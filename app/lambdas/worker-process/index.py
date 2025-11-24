import json
import os
import boto3
from aws_lambda_powertools.utilities.typing import LambdaContext
from aws_lambda_powertools.metrics import MetricUnit

from lib.powertools_config import logger, tracer, metrics
from lib.participant_selector import get_participants, select_winner
from lib.raffle_updater import update_raffle_to_completed, update_raffle_to_failed

dynamodb = boto3.resource('dynamodb')
raffles_table = dynamodb.Table(os.environ['DYNAMODB_RAFFLES_TABLE'])
participants_table = dynamodb.Table(os.environ['DYNAMODB_PARTICIPANTS_TABLE'])


@logger.inject_lambda_context
@tracer.capture_lambda_handler
@metrics.log_metrics(capture_cold_start_metric=True)
def handler(event: dict, context: LambdaContext) -> dict:
    logger.info("Processing raffle closed events", extra={"record_count": len(event['Records'])})
    
    for record in event['Records']:
        try:
            message_body = json.loads(record['body'])
            
            if 'detail-type' not in message_body or message_body.get('detail-type') != 'raffle.closed':
                logger.warning(
                    "Invalid event type",
                    extra={"detail_type": message_body.get('detail-type')}
                )
                continue
            
            detail = message_body.get('detail', {})
            raffle_id = detail.get('raffle_id')
            
            if not raffle_id:
                logger.warning("Missing raffle_id in message", extra={"message_body": message_body})
                continue
            
            logger.append_keys(raffle_id=raffle_id)
            logger.info("Processing raffle")
            
            raffle_response = raffles_table.get_item(Key={'raffle_id': raffle_id})
            
            if 'Item' not in raffle_response:
                logger.warning("Raffle not found")
                logger.remove_keys(['raffle_id'])
                continue
            
            raffle = raffle_response['Item']
            
            if raffle.get('status') != 'processing':
                logger.warning(
                    "Raffle not in processing status",
                    extra={"current_status": raffle.get('status')}
                )
                logger.remove_keys(['raffle_id'])
                continue
            
            try:
                participants = get_participants(participants_table, raffle_id)
                winner = select_winner(participants, raffle_id)
                
                completed_at = update_raffle_to_completed(raffles_table, raffle_id, winner)
                
                metrics.add_metric(name="WinnerSelected", unit=MetricUnit.Count, value=1)
                metrics.add_metric(
                    name="TotalParticipants",
                    unit=MetricUnit.Count,
                    value=len(participants)
                )
                
                logger.info(
                    "Raffle processing completed successfully",
                    extra={
                        "winner_email": winner['participant_email'],
                        "total_participants": len(participants),
                        "completed_at": completed_at
                    }
                )
                
            except ValueError as e:
                logger.warning(f"No participants: {str(e)}")
                update_raffle_to_failed(raffles_table, raffle_id, 'No participants found')
                metrics.add_metric(name="RaffleFailedNoParticipants", unit=MetricUnit.Count, value=1)
            
            logger.remove_keys(['raffle_id'])
            
        except Exception as e:
            logger.exception("Error processing record", extra={"error": str(e)})
            metrics.add_metric(name="ProcessingError", unit=MetricUnit.Count, value=1)
            raise
    
    return {
        'statusCode': 200,
        'body': json.dumps({'message': 'Processing completed'})
    }
