import json

from django.contrib.auth import authenticate, login, logout, get_user_model
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from .validators import (
    validate_username,
    validate_user_email,
    validate_password,
    validate_full_name,
)


User = get_user_model()


def parse_json_body(request):
    try:
        return json.loads(request.body.decode('utf-8'))
    except (json.JSONDecodeError, UnicodeDecodeError):
        return None


def user_to_dict(user):
    return {
        'id': user.id,
        'username': user.username,
        'full_name': user.full_name,
        'email': user.email,
        'is_admin': user.is_staff,
        'storage_path': user.storage_path,
    }


def require_auth(request):
    if not request.user.is_authenticated:
        return JsonResponse(
            {'error': 'Требуется аутентификация.'},
            status=401,
        )
    return None


def require_admin(request):
    if not request.user.is_authenticated:
        return JsonResponse(
            {'error': 'Требуется аутентификация.'},
            status=401,
        )

    if not request.user.is_staff:
        return JsonResponse(
            {'error': 'Недостаточно прав доступа.'},
            status=403,
        )

    return None


@csrf_exempt
@require_http_methods(['POST'])
def register_view(request):
    data = parse_json_body(request)
    if data is None:
        return JsonResponse({'error': 'Некорректный JSON.'}, status=400)

    username = str(data.get('username', '')).strip()
    full_name = str(data.get('full_name', '')).strip()
    email = str(data.get('email', '')).strip()
    password = str(data.get('password', ''))

    errors = {}

    username_error = validate_username(username)
    if username_error:
        errors['username'] = username_error
    elif User.objects.filter(username=username).exists():
        errors['username'] = 'Пользователь с таким логином уже существует.'

    full_name_error = validate_full_name(full_name)
    if full_name_error:
        errors['full_name'] = full_name_error

    email_error = validate_user_email(email)
    if email_error:
        errors['email'] = email_error
    elif User.objects.filter(email=email).exists():
        errors['email'] = 'Пользователь с таким email уже существует.'

    password_error = validate_password(password)
    if password_error:
        errors['password'] = password_error

    if errors:
        return JsonResponse({'errors': errors}, status=400)

    user = User.objects.create_user(
        username=username,
        full_name=full_name,
        email=email,
        password=password,
    )

    return JsonResponse(
        {
            'message': 'Пользователь успешно зарегистрирован.',
            'user': user_to_dict(user),
        },
        status=201,
    )


@csrf_exempt
@require_http_methods(['POST'])
def login_view(request):
    data = parse_json_body(request)
    if data is None:
        return JsonResponse({'error': 'Некорректный JSON.'}, status=400)

    username = str(data.get('username', '')).strip()
    password = str(data.get('password', ''))

    if not username or not password:
        return JsonResponse(
            {'error': 'Необходимо указать логин и пароль.'},
            status=400,
        )

    if not User.objects.filter(username=username).exists():
        return JsonResponse(
            {'error': 'Пользователь с таким логином не найден.'},
            status=400,
        )

    user = authenticate(request, username=username, password=password)
    if user is None:
        return JsonResponse(
            {'error': 'Неверный пароль.'},
            status=400,
        )

    login(request, user)

    return JsonResponse(
        {
            'message': 'Вход выполнен успешно.',
            'user': user_to_dict(user),
        },
        status=200,
    )


@csrf_exempt
@require_http_methods(['POST'])
def logout_view(request):
    auth_error = require_auth(request)
    if auth_error:
        return auth_error

    logout(request)

    return JsonResponse(
        {'message': 'Выход выполнен успешно.'},
        status=200,
    )


@require_http_methods(['GET'])
def me_view(request):
    auth_error = require_auth(request)
    if auth_error:
        return auth_error

    return JsonResponse(
        {'user': user_to_dict(request.user)},
        status=200,
    )


@require_http_methods(['GET'])
def users_list_view(request):
    admin_error = require_admin(request)
    if admin_error:
        return admin_error

    users = User.objects.all().order_by('id')

    return JsonResponse(
        {'users': [user_to_dict(user) for user in users]},
        status=200,
    )


@csrf_exempt
@require_http_methods(['PATCH'])
def user_update_view(request, user_id):
    admin_error = require_admin(request)
    if admin_error:
        return admin_error

    try:
        user = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        return JsonResponse({'error': 'Пользователь не найден.'}, status=404)

    data = parse_json_body(request)
    if data is None:
        return JsonResponse({'error': 'Некорректный JSON.'}, status=400)

    if 'is_admin' not in data:
        return JsonResponse(
            {'error': 'Поле is_admin обязательно.'},
            status=400,
        )

    is_admin = bool(data['is_admin'])
    user.is_staff = is_admin
    user.save(update_fields=['is_staff'])

    return JsonResponse(
        {
            'message': 'Права пользователя обновлены.',
            'user': user_to_dict(user),
        },
        status=200,
    )


@csrf_exempt
@require_http_methods(['DELETE'])
def user_delete_view(request, user_id):
    admin_error = require_admin(request)
    if admin_error:
        return admin_error

    try:
        user = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        return JsonResponse({'error': 'Пользователь не найден.'}, status=404)

    if user.id == request.user.id:
        return JsonResponse(
            {'error': 'Нельзя удалить самого себя.'},
            status=400,
        )

    user.delete()

    return JsonResponse(
        {'message': 'Пользователь удалён.'},
        status=200,
    )