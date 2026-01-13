import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime

def handler(event: dict, context) -> dict:
    '''Автоматическая архивация объектов с истекшей подпиской'''
    
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        # Найти все объекты с истекшей подпиской
        cur.execute("""
            SELECT id, title, subscription_expires_at
            FROM listings
            WHERE is_archived = FALSE 
            AND subscription_expires_at IS NOT NULL
            AND subscription_expires_at < NOW()
        """)
        
        expired_listings = cur.fetchall()
        
        if not expired_listings:
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': True,
                    'message': 'Нет объектов с истекшей подпиской',
                    'archived_count': 0
                }),
                'isBase64Encoded': False
            }
        
        # Архивировать объекты
        listing_ids = [listing['id'] for listing in expired_listings]
        cur.execute("""
            UPDATE listings 
            SET is_archived = TRUE
            WHERE id = ANY(%s)
        """, (listing_ids,))
        
        conn.commit()
        
        archived_titles = [listing['title'] for listing in expired_listings]
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'success': True,
                'message': f'Архивировано объектов: {len(expired_listings)}',
                'archived_count': len(expired_listings),
                'archived_listings': archived_titles
            }, default=str),
            'isBase64Encoded': False
        }
    
    except Exception as e:
        print(f'ERROR: {type(e).__name__}: {str(e)}')
        import traceback
        traceback.print_exc()
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
    finally:
        cur.close()
        conn.close()
