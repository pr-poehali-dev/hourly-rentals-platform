import json
import os
import psycopg2

def handler(event: dict, context) -> dict:
    '''API для получения истории транзакций владельца'''
    
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Authorization, Authorization'
            },
            'body': ''
        }
    
    if method != 'GET':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    auth_header = event.get('headers', {}).get('X-Authorization') or event.get('headers', {}).get('authorization')
    
    if not auth_header:
        return {
            'statusCode': 401,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Unauthorized'})
        }
    
    query_params = event.get('queryStringParameters') or {}
    owner_id = query_params.get('owner_id')
    limit = int(query_params.get('limit', 50))
    
    if not owner_id:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'owner_id required'})
        }
    
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    
    try:
        cur.execute("""
            SELECT 
                t.id,
                t.amount,
                t.type,
                t.description,
                t.balance_after,
                t.created_at,
                t.related_bid_id
            FROM transactions t
            WHERE t.owner_id = %s
            ORDER BY t.created_at DESC
            LIMIT %s
        """, (owner_id, limit))
        
        transactions = []
        for row in cur.fetchall():
            transactions.append({
                'id': row[0],
                'amount': row[1],
                'type': row[2],
                'description': row[3],
                'balance_after': row[4],
                'created_at': row[5].isoformat() if row[5] else None,
                'related_bid_id': row[6]
            })
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'transactions': transactions})
        }
    
    finally:
        cur.close()
        conn.close()