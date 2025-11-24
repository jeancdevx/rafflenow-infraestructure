from datetime import datetime
from lib.powertools_config import logger


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
                ':updated_at': now,
                ':processing_status': 'processing',
                ':completed_status': 'completed'
            },
            ConditionExpression='#status = :processing_status OR #status = :completed_status'
        )
        
        logger.info(
            "Raffle updated to completed",
            extra={
                "raffle_id": raffle_id,
                "winner_email": winner['participant_email'],
                "completed_at": now
            }
        )
        
        return now
        
    except Exception as e:
        logger.error(
            "Failed to update raffle",
            extra={
                "raffle_id": raffle_id,
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
                "raffle_id": raffle_id,
                "error_message": error_message
            }
        )
        
    except Exception as e:
        logger.error(
            "Failed to mark raffle as failed",
            extra={
                "raffle_id": raffle_id,
                "error": str(e)
            }
        )
        raise
