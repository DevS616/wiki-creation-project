import json
import os
import psycopg2
from datetime import datetime

def handler(event: dict, context) -> dict:
    """API для управления статьями и категориями Wiki"""
    
    method = event.get('httpMethod', 'GET')
    query = event.get('queryStringParameters') or {}
    action = query.get('action', '')
    
    if method == 'OPTIONS':
        return cors_response(200, '')
    
    if action == 'categories':
        return handle_categories(method, event)
    elif action == 'articles':
        return handle_articles(method, event)
    elif action == 'users':
        return handle_users(method, event)
    elif action == 'upload_image':
        return handle_upload_image(method, event)
    
    return cors_response(404, {'error': 'Not found. Use ?action=categories|articles|users|upload_image'})


def handle_categories(method: str, event: dict) -> dict:
    """Управление категориями"""
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        if method == 'GET':
            cur.execute("SELECT id, name, icon, created_at FROM categories ORDER BY name")
            categories = cur.fetchall()
            
            return cors_response(200, {
                'categories': [
                    {'id': c[0], 'name': c[1], 'icon': c[2], 'created_at': c[3].isoformat() if c[3] else None}
                    for c in categories
                ]
            })
        
        elif method == 'POST':
            body = json.loads(event.get('body', '{}'))
            user = validate_user(event)
            
            if not user or user['role'] != 'administrator':
                return cors_response(403, {'error': 'Access denied'})
            
            name = body.get('name')
            icon = body.get('icon', 'BookOpen')
            
            if not name:
                return cors_response(400, {'error': 'Name is required'})
            
            cur.execute(
                "INSERT INTO categories (name, icon) VALUES (%s, %s) RETURNING id, name, icon, created_at",
                (name, icon)
            )
            new_category = cur.fetchone()
            conn.commit()
            
            return cors_response(201, {
                'category': {
                    'id': new_category[0],
                    'name': new_category[1],
                    'icon': new_category[2],
                    'created_at': new_category[3].isoformat()
                }
            })
        
        elif method == 'DELETE':
            user = validate_user(event)
            
            if not user or user['role'] != 'administrator':
                return cors_response(403, {'error': 'Access denied'})
            
            query = event.get('queryStringParameters', {})
            category_id = query.get('id')
            
            if not category_id:
                return cors_response(400, {'error': 'ID is required'})
            
            cur.execute("UPDATE articles SET category_id = NULL WHERE category_id = %s", (int(category_id),))
            cur.execute("DELETE FROM categories WHERE id = %s", (int(category_id),))
            conn.commit()
            
            return cors_response(200, {'success': True})
        
    finally:
        cur.close()
        conn.close()
    
    return cors_response(405, {'error': 'Method not allowed'})


def handle_articles(method: str, event: dict) -> dict:
    """Управление статьями"""
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        if method == 'GET':
            cur.execute("""
                SELECT a.id, a.title, a.description, a.content, a.category_id, 
                       c.name as category_name, c.icon as category_icon,
                       a.author_id, u.username as author_name,
                       a.created_at, a.updated_at, a.preview_image
                FROM articles a
                LEFT JOIN categories c ON a.category_id = c.id
                LEFT JOIN users u ON a.author_id = u.id
                ORDER BY a.updated_at DESC
            """)
            articles = cur.fetchall()
            
            return cors_response(200, {
                'articles': [
                    {
                        'id': a[0],
                        'title': a[1],
                        'description': a[2],
                        'content': a[3],
                        'category_id': a[4],
                        'category_name': a[5],
                        'category_icon': a[6],
                        'author_id': a[7],
                        'author_name': a[8],
                        'created_at': a[9].isoformat() if a[9] else None,
                        'updated_at': a[10].isoformat() if a[10] else None,
                        'preview_image': a[11] if len(a) > 11 else None
                    }
                    for a in articles
                ]
            })
        
        elif method == 'POST':
            body = json.loads(event.get('body', '{}'))
            user = validate_user(event)
            
            if not user:
                return cors_response(403, {'error': 'Authentication required'})
            
            title = body.get('title')
            description = body.get('description')
            content = body.get('content')
            category_id = body.get('category_id')
            preview_image = body.get('preview_image')
            
            if not all([title, description, content]):
                return cors_response(400, {'error': 'Missing required fields'})
            
            cur.execute(
                """INSERT INTO articles (title, description, content, category_id, author_id, preview_image) 
                   VALUES (%s, %s, %s, %s, %s, %s) 
                   RETURNING id, title, description, content, category_id, author_id, created_at, updated_at""",
                (title, description, content, category_id, user['id'], preview_image)
            )
            new_article = cur.fetchone()
            conn.commit()
            
            return cors_response(201, {
                'article': {
                    'id': new_article[0],
                    'title': new_article[1],
                    'description': new_article[2],
                    'content': new_article[3],
                    'category_id': new_article[4],
                    'author_id': new_article[5],
                    'created_at': new_article[6].isoformat(),
                    'updated_at': new_article[7].isoformat()
                }
            })
        
        elif method == 'PUT':
            body = json.loads(event.get('body', '{}'))
            user = validate_user(event)
            
            if not user:
                return cors_response(403, {'error': 'Authentication required'})
            
            article_id = body.get('id')
            
            if not article_id:
                return cors_response(400, {'error': 'Article ID is required'})
            
            cur.execute("SELECT author_id FROM articles WHERE id = %s", (article_id,))
            article = cur.fetchone()
            
            if not article:
                return cors_response(404, {'error': 'Article not found'})
            
            if article[0] != user['id'] and user['role'] != 'administrator':
                return cors_response(403, {'error': 'Access denied'})
            
            updates = []
            params = []
            
            if 'title' in body:
                updates.append("title = %s")
                params.append(body['title'])
            
            if 'description' in body:
                updates.append("description = %s")
                params.append(body['description'])
            
            if 'content' in body:
                updates.append("content = %s")
                params.append(body['content'])
            
            if 'category_id' in body:
                updates.append("category_id = %s")
                params.append(body['category_id'])
            
            if 'preview_image' in body:
                updates.append("preview_image = %s")
                params.append(body['preview_image'])
            
            if updates:
                updates.append("updated_at = CURRENT_TIMESTAMP")
                params.append(article_id)
                
                query = f"UPDATE articles SET {', '.join(updates)} WHERE id = %s"
                cur.execute(query, params)
                conn.commit()
            
            return cors_response(200, {'success': True})
        
        elif method == 'DELETE':
            user = validate_user(event)
            
            if not user or user['role'] not in ['moderator', 'administrator']:
                return cors_response(403, {'error': 'Access denied'})
            
            query = event.get('queryStringParameters', {})
            article_id = query.get('id')
            
            if not article_id:
                return cors_response(400, {'error': 'ID is required'})
            
            cur.execute("DELETE FROM articles WHERE id = %s", (article_id,))
            conn.commit()
            
            return cors_response(200, {'success': True})
        
    finally:
        cur.close()
        conn.close()
    
    return cors_response(405, {'error': 'Method not allowed'})


def handle_users(method: str, event: dict) -> dict:
    """Управление пользователями (только для супер-админа)"""
    
    user = validate_user(event)
    
    if not user or user['steam_id'] != '76561198995407853':
        return cors_response(403, {'error': 'Access denied'})
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        if method == 'GET':
            cur.execute("""
                SELECT id, steam_id, username, avatar_url, role, created_at, updated_at
                FROM users
                ORDER BY created_at DESC
            """)
            users = cur.fetchall()
            
            return cors_response(200, {
                'users': [
                    {
                        'id': u[0],
                        'steam_id': u[1],
                        'username': u[2],
                        'avatar_url': u[3],
                        'role': u[4],
                        'created_at': u[5].isoformat() if u[5] else None,
                        'updated_at': u[6].isoformat() if u[6] else None
                    }
                    for u in users
                ]
            })
        
        elif method == 'PUT':
            body = json.loads(event.get('body', '{}'))
            user_id = body.get('id')
            new_role = body.get('role')
            
            if not user_id or not new_role:
                return cors_response(400, {'error': 'ID and role are required'})
            
            if new_role not in ['editor', 'moderator', 'administrator']:
                return cors_response(400, {'error': 'Invalid role'})
            
            cur.execute(
                "UPDATE users SET role = %s, updated_at = CURRENT_TIMESTAMP WHERE id = %s",
                (new_role, user_id)
            )
            conn.commit()
            
            return cors_response(200, {'success': True})
        
        elif method == 'DELETE':
            query = event.get('queryStringParameters', {})
            user_id = query.get('id')
            
            if not user_id:
                return cors_response(400, {'error': 'ID is required'})
            
            cur.execute("SELECT steam_id FROM users WHERE id = %s", (user_id,))
            target_user = cur.fetchone()
            
            if target_user and target_user[0] == '76561198995407853':
                return cors_response(400, {'error': 'Cannot delete super admin'})
            
            cur.execute("UPDATE articles SET author_id = NULL WHERE author_id = %s", (user_id,))
            cur.execute("DELETE FROM users WHERE id = %s", (user_id,))
            conn.commit()
            
            return cors_response(200, {'success': True})
        
    finally:
        cur.close()
        conn.close()
    
    return cors_response(405, {'error': 'Method not allowed'})


def handle_upload_image(method: str, event: dict) -> dict:
    """Загрузка изображений в S3"""
    
    if method != 'POST':
        return cors_response(405, {'error': 'Method not allowed'})
    
    user = validate_user(event)
    if not user:
        return cors_response(403, {'error': 'Authentication required'})
    
    try:
        import boto3
        import base64
        import uuid
        
        body = json.loads(event.get('body', '{}'))
        image_data = body.get('image', '')
        filename = body.get('filename', 'image.png')
        
        if ',' in image_data:
            image_data = image_data.split(',')[1]
        
        image_bytes = base64.b64decode(image_data)
        
        content_type = 'image/png'
        if filename.lower().endswith(('.jpg', '.jpeg')):
            content_type = 'image/jpeg'
        elif filename.lower().endswith('.gif'):
            content_type = 'image/gif'
        elif filename.lower().endswith('.webp'):
            content_type = 'image/webp'
        
        s3 = boto3.client('s3',
            endpoint_url='https://bucket.poehali.dev',
            aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
            aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY']
        )
        
        file_ext = filename.split('.')[-1] if '.' in filename else 'png'
        unique_name = f"wiki/{datetime.now().strftime('%Y%m%d')}/{uuid.uuid4().hex}.{file_ext}"
        
        s3.put_object(
            Bucket='files',
            Key=unique_name,
            Body=image_bytes,
            ContentType=content_type
        )
        
        cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{unique_name}"
        
        return cors_response(200, {'url': cdn_url})
    
    except Exception as e:
        print(f"Upload error: {str(e)}")
        return cors_response(500, {'error': f'Upload failed: {str(e)}'})


def validate_user(event: dict) -> dict:
    """Проверяет авторизацию пользователя по токену"""
    
    headers = event.get('headers', {})
    auth_header = headers.get('X-Authorization', headers.get('authorization', ''))
    
    if not auth_header:
        return None
    
    token = auth_header.replace('Bearer ', '').strip()
    
    if not token:
        return None
    
    try:
        parts = token.split(':')
        if len(parts) >= 2:
            steam_id = parts[0]
            user_id = parts[1]
            
            conn = get_db_connection()
            cur = conn.cursor()
            
            cur.execute(
                "SELECT id, steam_id, username, avatar_url, role FROM users WHERE steam_id = %s AND id = %s",
                (steam_id, user_id)
            )
            user_data = cur.fetchone()
            
            cur.close()
            conn.close()
            
            if user_data:
                return {
                    'id': user_data[0],
                    'steam_id': user_data[1],
                    'username': user_data[2],
                    'avatar_url': user_data[3],
                    'role': user_data[4]
                }
    except:
        pass
    
    return None


def get_db_connection():
    """Создает подключение к БД"""
    return psycopg2.connect(os.environ['DATABASE_URL'])


def cors_response(status_code: int, body):
    """Создает ответ с CORS заголовками"""
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Authorization'
        },
        'body': json.dumps(body) if isinstance(body, dict) else body,
        'isBase64Encoded': False
    }
