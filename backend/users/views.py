import json
import logging

from django.contrib.auth import authenticate, get_user_model, login, logout
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from .validators import (
    validate_full_name,
    validate_password,
    validate_user_email,
    validate_username,
)


logger = logging.getLogger(__name__)
User = get_user_model()


def parse_json_body(request):
    try:
        return json.loads(request.body.decode('utf-8'))
    except (json.JSONDecodeError, UnicodeDecodeError):
        logger.warning('Invalid JSON received in request body.')
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
        logger.warning('Unauthorized access attempt to users endpoint.')
        return JsonResponse(
            {'error': 'Требуется аутентификация.'},
            status=401,
        )
    return None


def require_admin(request):
    if not request.user.is_authenticated:
        logger.warning('Unauthorized admin access attempt.')
        return JsonResponse(
            {'error': 'Требуется аутентификация.'},
            status=401,
        )

    if not request.user.is_staff:
        logger.warning(
            'User %s attempted to access admin endpoint without permissions.',
            request.user.username,
        )
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
        logger.warning(
            'User registration validation failed for username="%s", email="%s". Errors: %s',
            username,
            email,
            errors,
        )
        return JsonResponse({'errors': errors}, status=400)

    user = User.objects.create_user(
        username=username,
        full_name=full_name,
        email=email,
        password=password,
    )

    logger.info(
        'User registered successfully: username="%s", id=%s.',
        user.username,
        user.id,
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
        logger.warning('Login attempt with missing username or password.')
        return JsonResponse(
            {'error': 'Необходимо указать логин и пароль.'},
            status=400,
        )

    if not User.objects.filter(username=username).exists():
        logger.warning('Login attempt for non-existing username="%s".', username)
        return JsonResponse(
            {'error': 'Пользователь с таким логином не найден.'},
            status=400,
        )

    user = authenticate(request, username=username, password=password)
    if user is None:
        logger.warning('Failed login attempt for username="%s": invalid password.', username)
        return JsonResponse(
            {'error': 'Неверный пароль.'},
            status=400,
        )

    login(request, user)

    logger.info('User logged in successfully: username="%s", id=%s.', user.username, user.id)

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

    username = request.user.username
    user_id = request.user.id

    logout(request)

    logger.info('User logged out successfully: username="%s", id=%s.', username, user_id)

    return JsonResponse(
        {'message': 'Выход выполнен успешно.'},
        status=200,
    )


@require_http_methods(['GET'])
def me_view(request):
    auth_error = require_auth(request)
    if auth_error:
        return auth_error

    logger.info(
        'User requested own profile: username="%s", id=%s.',
        request.user.username,
        request.user.id,
    )

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

    logger.info(
        'Admin %s requested users list. Users count: %s.',
        request.user.username,
        users.count(),
    )

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
        logger.warning(
            'Admin %s attempted to update non-existing user id=%s.',
            request.user.username,
            user_id,
        )
        return JsonResponse({'error': 'Пользователь не найден.'}, status=404)

    data = parse_json_body(request)
    if data is None:
        return JsonResponse({'error': 'Некорректный JSON.'}, status=400)

    if 'is_admin' not in data:
        logger.warning(
            'Admin %s attempted to update user id=%s without is_admin field.',
            request.user.username,
            user_id,
        )
        return JsonResponse(
            {'error': 'Поле is_admin обязательно.'},
            status=400,
        )

    is_admin = bool(data['is_admin'])
    old_status = user.is_staff
    user.is_staff = is_admin
    user.save(update_fields=['is_staff'])

    logger.info(
        'Admin %s changed admin flag for user %s (id=%s) from %s to %s.',
        request.user.username,
        user.username,
        user.id,
        old_status,
        is_admin,
    )

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
        logger.warning(
            'Admin %s attempted to delete non-existing user id=%s.',
            request.user.username,
            user_id,
        )
        return JsonResponse({'error': 'Пользователь не найден.'}, status=404)

    if user.id == request.user.id:
        logger.warning(
            'Admin %s attempted to delete own account.',
            request.user.username,
        )
        return JsonResponse(
            {'error': 'Нельзя удалить самого себя.'},
            status=400,
        )

    deleted_username = user.username
    deleted_user_id = user.id
    user.delete()

    logger.info(
        'Admin %s deleted user %s (id=%s).',
        request.user.username,
        deleted_username,
        deleted_user_id,
    )

    return JsonResponse(
        {'message': 'Пользователь удалён.'},
        status=200,
    )