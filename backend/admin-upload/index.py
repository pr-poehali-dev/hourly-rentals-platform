import json
import os
import jwt
import boto3
import base64
import uuid

# Photo upload handler
def verify_token(token: str) -> dict:
    '''Проверка JWT токена администратора'''
    if not token:
        return None
    try:
        jwt_secret = os.environ['JWT_SECRET']
        payload = jwt.decode(token, jwt_secret, algorithms=['HS256'])
        return payload
    except:
        return None

def handler(event: dict, context) -> dict:
    '''API для загрузки фотографий объектов'''
    method = event.get('httpMethod', 'POST')
    
    # CORS headers для всех ответов
    cors_headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Authorization',
        'Access-Control-Max-Age': '86400'
    }
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': cors_headers,
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {**cors_headers, 'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    # Проверка авторизации
    auth_header = event.get('headers', {}).get('X-Authorization', '')
    token = auth_header.replace('Bearer ', '') if auth_header else ''
    admin = verify_token(token)
    
    if not admin:
        return {
            'statusCode': 401,
            'headers': {**cors_headers, 'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'Требуется авторизация'}),
            'isBase64Encoded': False
        }
    
    try:
        body = json.loads(event.get('body', '{}'))
        
        # Получаем base64 изображение
        image_base64 = body.get('image')
        content_type = body.get('contentType', 'image/jpeg')
        
        if not image_base64:
            return {
                'statusCode': 400,
                'headers': {**cors_headers, 'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'Изображение обязательно'}),
                'isBase64Encoded': False
            }
        
        # Декодируем base64
        image_data = base64.b64decode(image_base64)
        
        # Генерируем уникальное имя файла
        file_extension = content_type.split('/')[-1]
        file_name = f"listings/{uuid.uuid4()}.{file_extension}"
        
        # Загружаем в S3
        s3 = boto3.client('s3',
            endpoint_url='https://bucket.poehali.dev',
            aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
            aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY']
        )
        
        s3.put_object(
            Bucket='files',
            Key=file_name,
            Body=image_data,
            ContentType=content_type
        )
        
        # Формируем CDN URL
        cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{file_name}"
        
        return {
            'statusCode': 200,
            'headers': {**cors_headers, 'Content-Type': 'application/json'},
            'body': json.dumps({'url': cdn_url}),
            'isBase64Encoded': False
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {**cors_headers, 'Content-Type': 'application/json'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }