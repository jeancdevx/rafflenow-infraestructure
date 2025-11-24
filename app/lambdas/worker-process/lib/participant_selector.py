import random
from boto3.dynamodb.conditions import Key
from lib.powertools_config import logger


def get_participants(participants_table, raffle_id: str) -> list:
    logger.info("Querying participants", extra={"raffle_id": raffle_id})
    
    response = participants_table.query(
        KeyConditionExpression=Key('raffle_id').eq(raffle_id)
    )
    
    participants = response.get('Items', [])
    
    logger.info(
        "Participants retrieved",
        extra={
            "raffle_id": raffle_id,
            "participant_count": len(participants)
        }
    )
    
    return participants


def select_winner(participants: list, raffle_id: str) -> dict:
    if not participants:
        logger.warning(
            "No participants found",
            extra={"raffle_id": raffle_id}
        )
        raise ValueError("No participants found for raffle")
    
    winner = random.choice(participants)
    
    logger.info(
        "Winner selected",
        extra={
            "raffle_id": raffle_id,
            "winner_email": winner.get('participant_email'),
            "total_participants": len(participants)
        }
    )
    
    return winner
