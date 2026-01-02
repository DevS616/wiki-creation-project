import json
import os
import re
import urllib.parse
import urllib.request
from datetime import datetime, timedelta
import psycopg2

def handler(event: dict, context) -> dict:
    """API для авторизации через Steam OpenID"""
    
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    query_params = event.get('queryStringParameters') or {}
    
    # Возврат с Steam
    if 'openid.claimed_id' in query_params:
        return handle_steam_callback(query_params)
    
    # Проверка сессии
    if method == 'POST':
        body = json.loads(event.get('body', '{}'))
        session_token = body.get('session_token')
        
        if session_token:
            return validate_session(session_token)
    
    # Начало авторизации
    return_url = query_params.get('return_url', 'http://localhost:5173/adm')
    auth_url = generate_steam_login_url(return_url)
    
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({'auth_url': auth_url}),
        'isBase64Encoded': False
    }


def generate_steam_login_url(return_url: str) -> str:
    """Генерирует URL для авторизации через Steam"""
    params = {
        'openid.ns': 'http://specs.openid.net/auth/2.0',
        'openid.mode': 'checkid_setup',
        'openid.return_to': return_url,
        'openid.realm': return_url.rsplit('/', 1)[0],
        'openid.identity': 'http://specs.openid.net/auth/2.0/identifier_select',
        'openid.claimed_id': 'http://specs.openid.net/auth/2.0/identifier_select'
    }
    
    query_string = urllib.parse.urlencode(params)
    return f'https://steamcommunity.com/openid/login?{query_string}'


def handle_steam_callback(params: dict) -> dict:
    """Обработка callback от Steam"""
    
    # Проверяем подпись Steam
    if not verify_steam_response(params):
        return {
            'statusCode': 401,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Invalid Steam response'}),
            'isBase64Encoded': False
        }
    
    # Извлекаем Steam ID
    claimed_id = params.get('openid.claimed_id', '')
    steam_id_match = re.search(r'/id/(\d+)$', claimed_id)
    
    if not steam_id_match:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Could not extract Steam ID'}),
            'isBase64Encoded': False
        }
    
    steam_id = steam_id_match.group(1)
    
    # Получаем данные пользователя от Steam
    user_data = get_steam_user_data(steam_id)
    
    if not user_data:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Could not fetch user data'}),
            'isBase64Encoded': False
        }
    
    # Сохраняем/обновляем пользователя в БД
    user = save_user_to_db(steam_id, user_data)
    
    # Если пользователь не найден в базе и это не супер-админ - доступ запрещён
    if not user:
        return {
            'statusCode': 403,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': 'Доступ запрещён. Вас должен добавить администратор.'
            }),
            'isBase64Encoded': False
        }
    
    # Создаем токен сессии
    session_token = create_session_token(user)
    
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({
            'session_token': session_token,
            'user': user
        }),
        'isBase64Encoded': False
    }


def verify_steam_response(params: dict) -> bool:
    """Проверяет подпись ответа от Steam"""
    
    validation_params = dict(params)
    validation_params['openid.mode'] = 'check_authentication'
    
    data = urllib.parse.urlencode(validation_params).encode('utf-8')
    
    try:
        req = urllib.request.Request('https://steamcommunity.com/openid/login', data=data)
        response = urllib.request.urlopen(req, timeout=10)
        content = response.read().decode('utf-8')
        return 'is_valid:true' in content
    except:
        return False


def get_steam_user_data(steam_id: str) -> dict:
    """Получает данные пользователя через Steam API"""
    
    api_key = os.environ.get('STEAM_API_KEY')
    if not api_key:
        return None
    
    url = f'http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key={api_key}&steamids={steam_id}'
    
    try:
        req = urllib.request.Request(url)
        response = urllib.request.urlopen(req, timeout=10)
        data = json.loads(response.read().decode('utf-8'))
        
        players = data.get('response', {}).get('players', [])
        if players:
            player = players[0]
            return {
                'username': player.get('personaname'),
                'avatar_url': player.get('avatarfull')
            }
    except:
        pass
    
    return None


def save_user_to_db(steam_id: str, user_data: dict) -> dict:
    """Сохраняет или обновляет пользователя в БД. Доступ только для супер-админа и добавленных пользователей"""
    
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    
    try:
        # Проверяем существующего пользователя
        cur.execute(
            "SELECT id, steam_id, username, avatar_url, role FROM users WHERE steam_id = %s",
            (steam_id,)
        )
        existing = cur.fetchone()
        
        if existing:
            # Обновляем данные существующего пользователя
            cur.execute(
                "UPDATE users SET username = %s, avatar_url = %s, updated_at = CURRENT_TIMESTAMP WHERE steam_id = %s",
                (user_data['username'], user_data['avatar_url'], steam_id)
            )
            conn.commit()
            
            return {
                'id': existing[0],
                'steam_id': existing[1],
                'username': user_data['username'],
                'avatar_url': user_data['avatar_url'],
                'role': existing[4]
            }
        else:
            # Если это супер-админ - создаем его автоматически
            if steam_id == '76561198995407853':
                cur.execute(
                    "INSERT INTO users (steam_id, username, avatar_url, role) VALUES (%s, %s, %s, %s) RETURNING id, role",
                    (steam_id, user_data['username'], user_data['avatar_url'], 'administrator')
                )
                new_user = cur.fetchone()
                conn.commit()
                
                return {
                    'id': new_user[0],
                    'steam_id': steam_id,
                    'username': user_data['username'],
                    'avatar_url': user_data['avatar_url'],
                    'role': new_user[1]
                }
            else:
                # Все остальные - доступ запрещён
                return None
    finally:
        cur.close()
        conn.close()


def create_session_token(user: dict) -> str:
    """Создает токен сессии (упрощенная версия)"""
    import hashlib
    import time
    
    data = f"{user['steam_id']}:{user['id']}:{time.time()}"
    return hashlib.sha256(data.encode()).hexdigest()


def validate_session(session_token: str) -> dict:
    """Валидация сессии (заглушка для примера)"""
    
    # В реальной системе здесь должна быть проверка токена
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({'valid': False}),
        'isBase64Encoded': False
    }