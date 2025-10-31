import json
import random
import os
from datetime import datetime
from decimal import Decimal
import boto3
from boto3.dynamodb.conditions import Key

dynamodb = boto3.resource('dynamodb')
raffles_table = dynamodb.Table(os.environ['DYNAMODB_RAFFLES_TABLE'])
participants_table = dynamodb.Table(os.environ['DYNAMODB_PARTICIPANTS_TABLE'])


def handler(event, context):
    print(f"Event received: {json.dumps(event)}")
    
    for record in event['Records']:
        try:
            message_body = json.loads(record['body'])
            raffle_id = message_body.get('raffle_id')
            action = message_body.get('action')
            
            print(f"Processing raffle_id: {raffle_id}, action: {action}")
            
            if not raffle_id or action != 'select_winner':
                print(f"Invalid message format or action: {message_body}")
                continue
            
            raffle_response = raffles_table.get_item(Key={'raffle_id': raffle_id})
            
            if 'Item' not in raffle_response:
                print(f"Raffle not found: {raffle_id}")
                continue
            
            raffle = raffle_response['Item']
            
            if raffle.get('status') != 'processing':
                print(f"Raffle {raffle_id} is not in processing status: {raffle.get('status')}")
                continue
            
            participants_response = participants_table.query(
                KeyConditionExpression=Key('raffle_id').eq(raffle_id)
            )
            
            participants = participants_response.get('Items', [])
            
            if not participants:
                print(f"No participants found for raffle {raffle_id}")
                update_raffle_status(raffle_id, 'failed', 'No participants found')
                continue
            
            print(f"Found {len(participants)} participants for raffle {raffle_id}")
            
            winner = random.choice(participants)
            
            print(f"Winner selected: {winner['participant_email']}")
            
            update_raffle_with_winner(raffle_id, winner)
            
            print(f"Successfully processed raffle {raffle_id}")
            
        except Exception as e:
            print(f"Error processing record: {str(e)}")
            raise e
    
    return {
        'statusCode': 200,
        'body': json.dumps({'message': 'Processing completed'})
    }


def update_raffle_with_winner(raffle_id, winner):
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
                ':processing_status': 'processing'
            },
            ConditionExpression='#status = :processing_status'
        )
        print(f"Raffle {raffle_id} updated to completed with winner {winner['participant_email']}")
    except Exception as e:
        print(f"Error updating raffle {raffle_id}: {str(e)}")
        raise e


def update_raffle_status(raffle_id, status, error_message=None):
    now = datetime.utcnow().isoformat()
    
    update_expression = 'SET #status = :status, updated_at = :updated_at'
    expression_values = {
        ':status': status,
        ':updated_at': now
    }
    
    if error_message:
        update_expression += ', error_message = :error_message'
        expression_values[':error_message'] = error_message
    
    try:
        raffles_table.update_item(
            Key={'raffle_id': raffle_id},
            UpdateExpression=update_expression,
            ExpressionAttributeNames={
                '#status': 'status'
            },
            ExpressionAttributeValues=expression_values
        )
        print(f"Raffle {raffle_id} status updated to {status}")
    except Exception as e:
        print(f"Error updating raffle status {raffle_id}: {str(e)}")
        raise e
