import json
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import psycopg2
from psycopg2.extras import RealDictCursor

def send_email(to_email: str, subject: str, html_body: str):
    """Отправка email через SMTP"""
    smtp_host = os.environ.get('SMTP_HOST')
    smtp_port = int(os.environ.get('SMTP_PORT', 587))
    smtp_user = os.environ.get('SMTP_USER')
    smtp_password = os.environ.get('SMTP_PASSWORD')
    
    if not all([smtp_host, smtp_user, smtp_password]):
        raise Exception('SMTP настройки не заданы. Добавьте SMTP_HOST, SMTP_USER, SMTP_PASSWORD в секреты проекта')
    
    msg = MIMEMultipart('alternative')
    msg['From'] = smtp_user
    msg['To'] = to_email
    msg['Subject'] = subject
    
    html_part = MIMEText(html_body, 'html', 'utf-8')
    msg.attach(html_part)
    
    with smtplib.SMTP(smtp_host, smtp_port) as server:
        server.starttls()
        server.login(smtp_user, smtp_password)
        server.send_message(msg)
        print(f"[INFO] Email sent to {to_email}")

def handler(event: dict, context) -> dict:
    """Автоматическая отправка учетных данных владельцу после одобрения модерации"""
    method = event.get('httpMethod', 'POST')
    
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
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    try:
        body = json.loads(event.get('body', '{}'))
        listing_id = body.get('listing_id')
        
        if not listing_id:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'listing_id обязателен'}),
                'isBase64Encoded': False
            }
        
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # Получаем информацию об объекте и владельце
        cur.execute("""
            SELECT l.id, l.title, l.owner_id, l.created_by_owner,
                   o.email, o.full_name
            FROM t_p39732784_hourly_rentals_platf.listings l
            JOIN t_p39732784_hourly_rentals_platf.owners o ON l.owner_id = o.id
            WHERE l.id = %s
        """, (listing_id,))
        
        listing = cur.fetchone()
        
        if not listing:
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Объект не найден'}),
                'isBase64Encoded': False
            }
        
        # Проверяем, что объект создан владельцем
        if not listing['created_by_owner']:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Объект не был создан владельцем'}),
                'isBase64Encoded': False
            }
        
        # Получаем временный пароль
        cur.execute("""
            SELECT temporary_password 
            FROM t_p39732784_hourly_rentals_platf.pending_owner_credentials
            WHERE owner_id = %s
        """, (listing['owner_id'],))
        
        credentials = cur.fetchone()
        
        if not credentials:
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Учетные данные не найдены'}),
                'isBase64Encoded': False
            }
        
        # Формируем HTML письма
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #9333ea 0%, #ec4899 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }}
                .credentials {{ background: white; padding: 20px; margin: 20px 0; border-left: 4px solid #9333ea; }}
                .button {{ display: inline-block; background: linear-gradient(135deg, #9333ea 0%, #ec4899 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
                .footer {{ text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🎉 Ваш объект одобрен!</h1>
                </div>
                <div class="content">
                    <p>Здравствуйте, {listing['full_name']}!</p>
                    
                    <p>Рады сообщить, что ваш объект <strong>"{listing['title']}"</strong> успешно прошел модерацию и опубликован на платформе 120 минут!</p>
                    
                    <div class="credentials">
                        <h3>📧 Ваши данные для входа в экстранет:</h3>
                        <p><strong>Логин (email):</strong> {listing['email']}</p>
                        <p><strong>Пароль:</strong> {credentials['temporary_password']}</p>
                    </div>
                    
                    <p>Войдите в личный кабинет для управления вашим объектом:</p>
                    
                    <a href="https://120minut.ru/owner/login" class="button">Войти в экстранет</a>
                    
                    <p style="margin-top: 30px;"><strong>Что вы можете делать в экстранете:</strong></p>
                    <ul>
                        <li>Редактировать информацию об объекте</li>
                        <li>Управлять номерами и ценами</li>
                        <li>Продвигать объект в топ выдачи</li>
                        <li>Отслеживать статистику просмотров</li>
                        <li>Управлять подпиской</li>
                    </ul>
                    
                    <p style="margin-top: 30px; padding: 15px; background: #fef3c7; border-left: 4px solid #f59e0b;">
                        ⚠️ <strong>Рекомендуем сменить пароль</strong> после первого входа в настройках профиля.
                    </p>
                    
                    <div class="footer">
                        <p>С уважением,<br>Команда 120 минут</p>
                        <p>Если у вас возникли вопросы, свяжитесь с нами через экстранет.</p>
                    </div>
                </div>
            </div>
        </body>
        </html>
        """
        
        # Отправляем email
        send_email(
            to_email=listing['email'],
            subject='🎉 Ваш объект одобрен! Данные для входа в экстранет',
            html_body=html_body
        )
        
        # Помечаем, что письмо отправлено
        cur.execute("""
            UPDATE t_p39732784_hourly_rentals_platf.pending_owner_credentials
            SET sent_at = CURRENT_TIMESTAMP
            WHERE owner_id = %s
        """, (listing['owner_id'],))
        
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'success': True,
                'message': f'Учетные данные отправлены на {listing["email"]}'
            }),
            'isBase64Encoded': False
        }
        
    except Exception as e:
        print(f"[ERROR] {str(e)}")
        if 'conn' in locals():
            conn.close()
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
