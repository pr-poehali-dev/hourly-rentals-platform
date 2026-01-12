import json
import os
import psycopg2
from datetime import datetime, timedelta

def handler(event: dict, context) -> dict:
    '''API для сбора и получения статистики просмотров объявлений'''
    
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Authorization'
            },
            'body': ''
        }
    
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    
    try:
        if method == 'POST':
            body = json.loads(event.get('body', '{}'))
            action = body.get('action')
            listing_id = body.get('listing_id')
            
            if not listing_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'listing_id required'})
                }
            
            today = datetime.now().date()
            
            if action == 'view':
                cur.execute("""
                    INSERT INTO listing_statistics (listing_id, date, views)
                    VALUES (%s, %s, 1)
                    ON CONFLICT (listing_id, date) 
                    DO UPDATE SET views = listing_statistics.views + 1
                """, (listing_id, today))
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True})
                }
            
            elif action == 'click':
                click_type = body.get('click_type', 'general')
                
                if click_type == 'phone':
                    cur.execute("""
                        INSERT INTO listing_statistics (listing_id, date, clicks, phone_clicks)
                        VALUES (%s, %s, 1, 1)
                        ON CONFLICT (listing_id, date) 
                        DO UPDATE SET clicks = listing_statistics.clicks + 1,
                                      phone_clicks = listing_statistics.phone_clicks + 1
                    """, (listing_id, today))
                elif click_type == 'telegram':
                    cur.execute("""
                        INSERT INTO listing_statistics (listing_id, date, clicks, telegram_clicks)
                        VALUES (%s, %s, 1, 1)
                        ON CONFLICT (listing_id, date) 
                        DO UPDATE SET clicks = listing_statistics.clicks + 1,
                                      telegram_clicks = listing_statistics.telegram_clicks + 1
                    """, (listing_id, today))
                else:
                    cur.execute("""
                        INSERT INTO listing_statistics (listing_id, date, clicks)
                        VALUES (%s, %s, 1)
                        ON CONFLICT (listing_id, date) 
                        DO UPDATE SET clicks = listing_statistics.clicks + 1
                    """, (listing_id, today))
                
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True})
                }
            
            else:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Unknown action'})
                }
        
        elif method == 'GET':
            listing_id = event.get('queryStringParameters', {}).get('listing_id')
            days = int(event.get('queryStringParameters', {}).get('days', 30))
            
            if not listing_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'listing_id required'})
                }
            
            start_date = datetime.now().date() - timedelta(days=days)
            
            cur.execute("""
                SELECT date, views, clicks, phone_clicks, telegram_clicks
                FROM listing_statistics
                WHERE listing_id = %s AND date >= %s
                ORDER BY date DESC
            """, (listing_id, start_date))
            
            stats = []
            total_views = 0
            total_clicks = 0
            total_phone = 0
            total_telegram = 0
            
            for row in cur.fetchall():
                stats.append({
                    'date': row[0].isoformat(),
                    'views': row[1],
                    'clicks': row[2],
                    'phone_clicks': row[3],
                    'telegram_clicks': row[4]
                })
                total_views += row[1]
                total_clicks += row[2]
                total_phone += row[3]
                total_telegram += row[4]
            
            ctr = round((total_clicks / total_views * 100), 2) if total_views > 0 else 0
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'stats': stats,
                    'summary': {
                        'total_views': total_views,
                        'total_clicks': total_clicks,
                        'phone_clicks': total_phone,
                        'telegram_clicks': total_telegram,
                        'ctr': ctr,
                        'period_days': days
                    }
                })
            }
        
        else:
            return {
                'statusCode': 405,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Method not allowed'})
            }
    
    finally:
        cur.close()
        conn.close()
