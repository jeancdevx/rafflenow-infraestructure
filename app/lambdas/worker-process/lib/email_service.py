import os
import json
import boto3
from botocore.exceptions import ClientError
from lib.powertools_config import logger

ses_client = boto3.client('ses')

SES_SENDER_EMAIL = os.environ.get('SES_SENDER_EMAIL')
SES_WINNER_TEMPLATE = os.environ.get('SES_WINNER_TEMPLATE')
SES_CONFIGURATION_SET = os.environ.get('SES_CONFIGURATION_SET')


def send_winner_notification(winner: dict, raffle: dict, total_participants: int, selected_at: str) -> bool:
    if not SES_SENDER_EMAIL or not SES_WINNER_TEMPLATE:
        logger.warning(
            "SES not configured, skipping email",
            extra={
                "has_sender": bool(SES_SENDER_EMAIL),
                "has_template": bool(SES_WINNER_TEMPLATE)
            }
        )
        return False

    template_data = {
        "winner_name": winner.get('participant_name', 'Participante'),
        "raffle_title": raffle.get('title', ''),
        "prize_description": raffle.get('prize_description', raffle.get('description', '')),
        "prize_value": format_currency(raffle.get('prize_value', 0)),
        "total_participants": str(total_participants),
        "selected_at": format_date(selected_at)
    }

    try:
        params = {
            'Source': SES_SENDER_EMAIL,
            'Destination': {
                'ToAddresses': [winner['participant_email']]
            },
            'Template': SES_WINNER_TEMPLATE,
            'TemplateData': json.dumps(template_data)
        }

        if SES_CONFIGURATION_SET:
            params['ConfigurationSetName'] = SES_CONFIGURATION_SET

        response = ses_client.send_templated_email(**params)

        logger.info(
            "Winner notification email sent",
            extra={
                "message_id": response['MessageId'],
                "recipient": winner['participant_email'],
                "raffle_id": raffle.get('raffle_id')
            }
        )

        return True

    except ClientError as error:
        logger.error(
            "Failed to send winner notification email",
            extra={
                "error": str(error),
                "error_code": error.response['Error']['Code'],
                "recipient": winner['participant_email'],
                "raffle_id": raffle.get('raffle_id')
            }
        )
        return False

    except Exception as error:
        logger.error(
            "Unexpected error sending winner email",
            extra={
                "error": str(error),
                "recipient": winner['participant_email'],
                "raffle_id": raffle.get('raffle_id')
            }
        )
        return False


def format_currency(value) -> str:
    if not value:
        return "0.00"
    try:
        return f"{float(value):,.2f}"
    except (ValueError, TypeError):
        return "0.00"


def format_date(date_string: str) -> str:
    if not date_string:
        return ""
    try:
        from datetime import datetime
        dt = datetime.fromisoformat(date_string.replace('Z', '+00:00'))
        months = [
            'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
            'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
        ]
        return f"{dt.day} de {months[dt.month - 1]} de {dt.year}"
    except Exception:
        return date_string
