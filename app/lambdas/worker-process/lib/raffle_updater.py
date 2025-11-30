from datetime import datetime
from lib.powertools_config import logger, Actions, ErrorCodes


def update_raffle_to_completed(raffles_table, raffle_id: str, winner: dict) -> str:
    now = datetime.utcnow().isoformat()
    
    try:
        raffles_table.update_item(
            Key={'raffle_id': raffle_id},
            UpdateExpression='''
                SET #status = :status,
                    winner_email = :winner_email,
                    winner_name = :winner_name,
                    winner_selected_at = :selected_at,
                    completed_at = :completed_at,
                    updated_at = :updated_at
            ''',
            ExpressionAttributeNames={
                '#status': 'status'
            },
            ExpressionAttributeValues={
                ':status': 'completed',
                ':winner_email': winner['participant_email'],
                ':winner_name': winner['participant_name'],
                ':selected_at': now,
                ':completed_at': now,
                ':updated_at': now,
                ':processing_status': 'processing',
                ':completed_status': 'completed'
            },
            ConditionExpression='#status = :processing_status OR #status = :completed_status'
        )
        
        logger.info(
            "Raffle updated to completed",
            extra={
                "action": Actions.RAFFLE_COMPLETED.value,
                "winner_email": winner['participant_email'],
                "completed_at": now
            }
        )
        
        return now
        
    except Exception as e:
        logger.error(
            "Failed to update raffle",
            extra={
                "action": Actions.RAFFLE_FAILED.value,
                "error_code": ErrorCodes.DATABASE_UPDATE_ERROR.value,
                "error": str(e)
            }
        )
        raise


def update_raffle_to_failed(raffles_table, raffle_id: str, error_message: str) -> None:
    now = datetime.utcnow().isoformat()
    
    try:
        raffles_table.update_item(
            Key={'raffle_id': raffle_id},
            UpdateExpression='SET #status = :status, updated_at = :updated_at, error_message = :error_message',
            ExpressionAttributeNames={
                '#status': 'status'
            },
            ExpressionAttributeValues={
                ':status': 'failed',
                ':updated_at': now,
                ':error_message': error_message
            }
        )
        
        logger.warning(
            "Raffle marked as failed",
            extra={
                "action": Actions.RAFFLE_FAILED.value,
                "failure_reason": error_message
            }
        )
        
    except Exception as e:
        logger.error(
            "Failed to mark raffle as failed",
            extra={
                "action": Actions.RAFFLE_FAILED.value,
                "error_code": ErrorCodes.DATABASE_UPDATE_ERROR.value,
                "error": str(e)
            }
        )
        raise
