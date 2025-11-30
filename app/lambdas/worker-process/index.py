import json
import os
import boto3
from aws_lambda_powertools.utilities.typing import LambdaContext
from aws_lambda_powertools.metrics import MetricUnit

from lib.powertools_config import logger, tracer, metrics, Actions, ErrorCodes
from lib.participant_selector import get_participants, select_winner
from lib.raffle_updater import update_raffle_to_completed, update_raffle_to_failed
from lib.winner_recorder import create_winner_record
from lib.email_service import send_winner_notification

dynamodb = boto3.resource('dynamodb')
raffles_table = dynamodb.Table(os.environ['DYNAMODB_RAFFLES_TABLE'])
participations_table = dynamodb.Table(os.environ['DYNAMODB_PARTICIPATIONS_TABLE'])
winners_table = dynamodb.Table(os.environ['DYNAMODB_WINNERS_TABLE'])


@logger.inject_lambda_context
@tracer.capture_lambda_handler
@metrics.log_metrics(capture_cold_start_metric=True)
def handler(event: dict, context: LambdaContext) -> dict:
    logger.info(
        "Processing raffle closed events",
        extra={
            "action": Actions.BATCH_STARTED.value,
            "record_count": len(event['Records'])
        }
    )
    
    processed_count = 0
    skipped_count = 0
    
    for record in event['Records']:
        try:
            message_body = json.loads(record['body'])
            
            if 'detail-type' not in message_body or message_body.get('detail-type') != 'raffle.closed':
                logger.warning(
                    "Invalid event type, skipping",
                    extra={
                        "action": Actions.RECORD_SKIPPED.value,
                        "error_code": ErrorCodes.INVALID_EVENT_TYPE.value,
                        "detail_type": message_body.get('detail-type')
                    }
                )
                skipped_count += 1
                continue
            
            detail = message_body.get('detail', {})
            raffle_id = detail.get('raffle_id')
            
            if not raffle_id:
                logger.warning(
                    "Missing raffle_id in message",
                    extra={
                        "action": Actions.RECORD_SKIPPED.value,
                        "error_code": ErrorCodes.MISSING_RAFFLE_ID.value
                    }
                )
                skipped_count += 1
                continue
            
            logger.append_keys(raffle_id=raffle_id)
            logger.info(
                "Processing raffle record",
                extra={"action": Actions.RECORD_PROCESSING.value}
            )
            
            raffle_response = raffles_table.get_item(Key={'raffle_id': raffle_id})
            
            if 'Item' not in raffle_response:
                logger.warning(
                    "Raffle not found",
                    extra={
                        "action": Actions.RECORD_SKIPPED.value,
                        "error_code": ErrorCodes.RAFFLE_NOT_FOUND.value
                    }
                )
                skipped_count += 1
                logger.remove_keys(['raffle_id'])
                continue
            
            raffle = raffle_response['Item']
            
            if raffle.get('status') != 'processing':
                logger.warning(
                    "Raffle not in processing status",
                    extra={
                        "action": Actions.RECORD_SKIPPED.value,
                        "error_code": ErrorCodes.INVALID_RAFFLE_STATUS.value,
                        "current_status": raffle.get('status')
                    }
                )
                skipped_count += 1
                logger.remove_keys(['raffle_id'])
                continue
            
            logger.append_keys(raffle_title=raffle.get('title'))
            
            logger.info(
                "Raffle validated for processing",
                extra={
                    "action": Actions.RAFFLE_VALIDATED.value,
                    "raffle_status": raffle.get('status')
                }
            )
            
            try:
                participants = get_participants(participations_table, raffle_id)
                winner = select_winner(participants, raffle_id)
                
                completed_at = update_raffle_to_completed(raffles_table, raffle_id, winner)
                
                create_winner_record(winners_table, raffle, winner, len(participants))
                
                email_sent = send_winner_notification(
                    winner=winner,
                    raffle=raffle,
                    total_participants=len(participants),
                    selected_at=completed_at
                )
                
                if email_sent:
                    winners_table.update_item(
                        Key={'raffle_id': raffle_id},
                        UpdateExpression='SET notification_sent = :sent',
                        ExpressionAttributeValues={':sent': True}
                    )
                    metrics.add_metric(name="WinnerEmailSent", unit=MetricUnit.Count, value=1)
                
                metrics.add_metric(name="WinnerSelected", unit=MetricUnit.Count, value=1)
                metrics.add_metric(
                    name="TotalParticipants",
                    unit=MetricUnit.Count,
                    value=len(participants)
                )
                
                logger.info(
                    "Raffle processing completed successfully",
                    extra={
                        "action": Actions.RAFFLE_COMPLETED.value,
                        "winner_email": winner['participant_email'],
                        "total_participants": len(participants),
                        "completed_at": completed_at,
                        "email_sent": email_sent
                    }
                )
                
                processed_count += 1
                
            except ValueError as e:
                logger.warning(
                    "No participants found for raffle",
                    extra={
                        "action": Actions.RAFFLE_FAILED.value,
                        "error_code": ErrorCodes.NO_PARTICIPANTS.value,
                        "error": str(e)
                    }
                )
                update_raffle_to_failed(raffles_table, raffle_id, 'No participants found')
                metrics.add_metric(name="RaffleFailedNoParticipants", unit=MetricUnit.Count, value=1)
            
            logger.remove_keys(['raffle_id', 'raffle_title'])
            
        except Exception as e:
            logger.exception(
                "Error processing record",
                extra={
                    "action": Actions.RECORD_SKIPPED.value,
                    "error_code": ErrorCodes.PROCESSING_ERROR.value,
                    "error": str(e)
                }
            )
            metrics.add_metric(name="ProcessingError", unit=MetricUnit.Count, value=1)
            raise
    
    logger.info(
        "Batch processing completed",
        extra={
            "action": Actions.BATCH_COMPLETED.value,
            "processed_count": processed_count,
            "skipped_count": skipped_count,
            "total_records": len(event['Records'])
        }
    )
    
    return {
        'statusCode': 200,
        'body': json.dumps({'message': 'Processing completed'})
    }
