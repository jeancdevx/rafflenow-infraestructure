from datetime import datetime
from decimal import Decimal
from typing import Dict, Any
from lib.powertools_config import logger, Actions


def create_winner_record(
    winners_table: Any,
    raffle: Dict[str, Any],
    winner: Dict[str, Any],
    total_participants: int
) -> None:
    winner_record = {
        'raffle_id': raffle['raffle_id'],
        'winner_email': winner['participant_email'],
        'winner_name': winner['participant_name'],
        'user_id': winner.get('user_id', ''),
        'selected_at': datetime.utcnow().isoformat(),
        'total_participants': total_participants,
        'prize_description': raffle.get('description', ''),
        'prize_value': Decimal(str(raffle.get('prize_value', 0))),
        'notification_sent': False
    }
    
    logger.info(
        "Creating winner record",
        extra={
            "action": Actions.WINNER_RECORD_CREATED.value,
            "winner_email": winner['participant_email'],
            "total_participants": total_participants
        }
    )
    
    winners_table.put_item(Item=winner_record)
    
    logger.info(
        "Winner record created successfully",
        extra={"action": Actions.WINNER_RECORD_CREATED.value}
    )
