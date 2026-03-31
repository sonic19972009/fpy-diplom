import json
import logging
from pathlib import Path
from uuid import uuid4

from django.conf import settings
from django.contrib.auth import get_user_model
from django.http import FileResponse, HttpResponse, JsonResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from .models import StoredFile


logger = logging.getLogger(__name__)
User = get_user_model()


def file_to_dict(file_obj):
    return {
        'id': file_obj.id,
        'owner_id': file_obj.owner_id,
        'owner_username': file_obj.owner.username,
        'original_name': file_obj.original_name,
        'stored_name': file_obj.stored_name,
        'size': file_obj.size,
        'comment': file_obj.comment,
        'uploaded_at': file_obj.uploaded_at.isoformat() if file_obj.uploaded_at else None,
        'last_downloaded_at': (
            file_obj.last_downloaded_at.isoformat()
            if file_obj.last_downloaded_at else None
        ),
        'public_token': file_obj.public_token,
        'public_url': (
            f'/public/{file_obj.public_token}/'
            if file_obj.public_token else None
        ),
    }


def require_auth(request):
    if not request.user.is_authenticated:
        logger.warning('Unauthorized access attempt to storage endpoint.')
        return JsonResponse(
            {'error': 'Требуется аутентификация.'},
            status=401,
        )
    return None


def get_target_user(request):
    if request.user.is_staff:
        user_id = request.GET.get('user_id')
        if user_id:
            try:
                target_user = User.objects.get(pk=user_id)
                logger.debug(
                    'Admin %s requested files for user_id=%s.',
                    request.user.username,
                    user_id,
                )
                return target_user
            except User.DoesNotExist:
                logger.warning(
                    'Admin %s requested files for non-existing user_id=%s.',
                    request.user.username,
                    user_id,
                )
                return None
    return request.user


def get_file_for_request(request, file_id):
    try:
        file_obj = StoredFile.objects.select_related('owner').get(pk=file_id)
    except StoredFile.DoesNotExist:
        logger.warning(
            'User %s requested non-existing file id=%s.',
            request.user.username,
            file_id,
        )
        return None, JsonResponse({'error': 'Файл не найден.'}, status=404)

    if request.user.is_staff or file_obj.owner_id == request.user.id:
        return file_obj, None

    logger.warning(
        'User %s tried to access forbidden file id=%s owned by %s.',
        request.user.username,
        file_id,
        file_obj.owner.username,
    )
    return None, JsonResponse({'error': 'Недостаточно прав доступа.'}, status=403)


def ensure_user_storage_dir(user):
    storage_dir = Path(settings.MEDIA_ROOT) / user.storage_path
    storage_dir.mkdir(parents=True, exist_ok=True)
    return storage_dir


def render_public_link_error_page(title, message):
    html = f"""
    <!DOCTYPE html>
    <html lang="ru">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>{title}</title>
        <style>
            body {{
                margin: 0;
                font-family: Arial, sans-serif;
                background: #f3f4f6;
                color: #111827;
            }}
            .page {{
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 24px;
                box-sizing: border-box;
            }}
            .card {{
                max-width: 520px;
                width: 100%;
                background: #ffffff;
                border: 1px solid #e5e7eb;
                border-radius: 14px;
                padding: 32px;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
                text-align: center;
            }}
            h1 {{
                margin: 0 0 12px;
                font-size: 32px;
            }}
            p {{
                margin: 0 0 24px;
                font-size: 16px;
                line-height: 1.5;
                color: #4b5563;
            }}
            a {{
                display: inline-block;
                padding: 12px 18px;
                border-radius: 8px;
                background: #111827;
                color: #ffffff;
                text-decoration: none;
            }}
        </style>
    </head>
    <body>
        <div class="page">
            <div class="card">
                <h1>{title}</h1>
                <p>{message}</p>
                <a href="/">Вернуться на главную</a>
            </div>
        </div>
    </body>
    </html>
    """
    return HttpResponse(html, status=404)


@require_http_methods(['GET'])
def files_list_view(request):
    auth_error = require_auth(request)
    if auth_error:
        return auth_error

    target_user = get_target_user(request)
    if target_user is None:
        return JsonResponse({'error': 'Пользователь не найден.'}, status=404)

    files = StoredFile.objects.filter(owner=target_user).select_related('owner')

    logger.info(
        'User %s requested file list for user %s. Files count: %s.',
        request.user.username,
        target_user.username,
        files.count(),
    )

    return JsonResponse(
        {
            'files': [file_to_dict(file_obj) for file_obj in files],
            'user': {
                'id': target_user.id,
                'username': target_user.username,
            },
        },
        status=200,
    )


@csrf_exempt
@require_http_methods(['POST'])
def file_upload_view(request):
    auth_error = require_auth(request)
    if auth_error:
        return auth_error

    uploaded_file = request.FILES.get('file')
    comment = request.POST.get('comment', '').strip()
    target_user_id = request.POST.get('user_id')

    if uploaded_file is None:
        logger.warning('User %s attempted upload without file.', request.user.username)
        return JsonResponse({'error': 'Файл не передан.'}, status=400)

    user = request.user

    if request.user.is_staff and target_user_id:
        try:
            user = User.objects.get(pk=target_user_id)
            logger.info(
                'Admin %s uploads file to user %s storage.',
                request.user.username,
                user.username,
            )
        except User.DoesNotExist:
            logger.warning(
                'Admin %s attempted upload to non-existing user_id=%s.',
                request.user.username,
                target_user_id,
            )
            return JsonResponse({'error': 'Пользователь не найден.'}, status=404)

    storage_dir = ensure_user_storage_dir(user)

    original_name = uploaded_file.name
    extension = Path(original_name).suffix
    stored_name = f'{uuid4().hex}{extension}'
    absolute_path = storage_dir / stored_name

    with absolute_path.open('wb+') as destination:
        for chunk in uploaded_file.chunks():
            destination.write(chunk)

    relative_path = Path(user.storage_path) / stored_name

    stored_file = StoredFile.objects.create(
        owner=user,
        original_name=original_name,
        stored_name=stored_name,
        file_path=str(relative_path).replace('\\', '/'),
        size=uploaded_file.size,
        comment=comment,
    )

    logger.info(
        'User %s uploaded file "%s" (%s bytes) to owner %s. Stored as "%s".',
        request.user.username,
        original_name,
        uploaded_file.size,
        user.username,
        stored_name,
    )

    return JsonResponse(
        {
            'message': 'Файл успешно загружен.',
            'file': file_to_dict(stored_file),
        },
        status=201,
    )


@csrf_exempt
@require_http_methods(['DELETE'])
def file_delete_view(request, file_id):
    auth_error = require_auth(request)
    if auth_error:
        return auth_error

    file_obj, error_response = get_file_for_request(request, file_id)
    if error_response:
        return error_response

    absolute_path = Path(settings.MEDIA_ROOT) / file_obj.file_path
    original_name = file_obj.original_name

    if absolute_path.exists():
        absolute_path.unlink()
        logger.info(
            'User %s deleted file "%s" (id=%s) from disk.',
            request.user.username,
            original_name,
            file_id,
        )
    else:
        logger.warning(
            'User %s deleted file record "%s" (id=%s), but file was missing on disk.',
            request.user.username,
            original_name,
            file_id,
        )

    file_obj.delete()

    return JsonResponse(
        {'message': 'Файл удалён.'},
        status=200,
    )


@csrf_exempt
@require_http_methods(['PATCH'])
def file_rename_view(request, file_id):
    auth_error = require_auth(request)
    if auth_error:
        return auth_error

    file_obj, error_response = get_file_for_request(request, file_id)
    if error_response:
        return error_response

    try:
        data = json.loads(request.body.decode('utf-8'))
    except (json.JSONDecodeError, UnicodeDecodeError):
        logger.warning(
            'User %s sent invalid JSON while renaming file id=%s.',
            request.user.username,
            file_id,
        )
        return JsonResponse({'error': 'Некорректный JSON.'}, status=400)

    new_name = str(data.get('original_name', '')).strip()

    if not new_name:
        logger.warning(
            'User %s attempted to rename file id=%s with empty name.',
            request.user.username,
            file_id,
        )
        return JsonResponse({'error': 'Новое имя файла обязательно.'}, status=400)

    if len(new_name) > 255:
        logger.warning(
            'User %s attempted to rename file id=%s with too long name.',
            request.user.username,
            file_id,
        )
        return JsonResponse({'error': 'Имя файла слишком длинное.'}, status=400)

    old_name = file_obj.original_name
    file_obj.original_name = new_name
    file_obj.save(update_fields=['original_name'])

    logger.info(
        'User %s renamed file id=%s from "%s" to "%s".',
        request.user.username,
        file_id,
        old_name,
        new_name,
    )

    return JsonResponse(
        {
            'message': 'Имя файла обновлено.',
            'file': file_to_dict(file_obj),
        },
        status=200,
    )


@csrf_exempt
@require_http_methods(['PATCH'])
def file_comment_view(request, file_id):
    auth_error = require_auth(request)
    if auth_error:
        return auth_error

    file_obj, error_response = get_file_for_request(request, file_id)
    if error_response:
        return error_response

    try:
        data = json.loads(request.body.decode('utf-8'))
    except (json.JSONDecodeError, UnicodeDecodeError):
        logger.warning(
            'User %s sent invalid JSON while updating comment for file id=%s.',
            request.user.username,
            file_id,
        )
        return JsonResponse({'error': 'Некорректный JSON.'}, status=400)

    comment = str(data.get('comment', '')).strip()

    file_obj.comment = comment
    file_obj.save(update_fields=['comment'])

    logger.info(
        'User %s updated comment for file id=%s.',
        request.user.username,
        file_id,
    )

    return JsonResponse(
        {
            'message': 'Комментарий обновлён.',
            'file': file_to_dict(file_obj),
        },
        status=200,
    )


@require_http_methods(['GET'])
def file_download_view(request, file_id):
    auth_error = require_auth(request)
    if auth_error:
        return auth_error

    file_obj, error_response = get_file_for_request(request, file_id)
    if error_response:
        return error_response

    absolute_path = Path(settings.MEDIA_ROOT) / file_obj.file_path

    if not absolute_path.exists():
        logger.error(
            'User %s tried to download file id=%s, but file is missing on disk.',
            request.user.username,
            file_id,
        )
        return JsonResponse({'error': 'Файл на диске не найден.'}, status=404)

    file_obj.last_downloaded_at = timezone.now()
    file_obj.save(update_fields=['last_downloaded_at'])

    logger.info(
        'User %s downloaded file "%s" (id=%s).',
        request.user.username,
        file_obj.original_name,
        file_id,
    )

    return FileResponse(
        absolute_path.open('rb'),
        as_attachment=True,
        filename=file_obj.original_name,
    )


@csrf_exempt
@require_http_methods(['POST'])
def file_public_link_view(request, file_id):
    auth_error = require_auth(request)
    if auth_error:
        return auth_error

    file_obj, error_response = get_file_for_request(request, file_id)
    if error_response:
        return error_response

    if not file_obj.public_token:
        file_obj.public_token = uuid4().hex
        file_obj.save(update_fields=['public_token'])
        logger.info(
            'User %s generated public link for file id=%s.',
            request.user.username,
            file_id,
        )
    else:
        logger.info(
            'User %s requested existing public link for file id=%s.',
            request.user.username,
            file_id,
        )

    return JsonResponse(
        {
            'message': 'Публичная ссылка создана.',
            'public_token': file_obj.public_token,
            'public_url': f'/public/{file_obj.public_token}/',
        },
        status=200,
    )


@require_http_methods(['GET'])
def public_file_download_view(request, token):
    try:
        file_obj = StoredFile.objects.select_related('owner').get(public_token=token)
    except StoredFile.DoesNotExist:
        logger.warning('Invalid public token requested: %s.', token)
        return render_public_link_error_page(
            'Ссылка недействительна',
            'Файл недоступен. Ссылка устарела или была удалена.',
        )

    absolute_path = Path(settings.MEDIA_ROOT) / file_obj.file_path

    if not absolute_path.exists():
        logger.error(
            'Public download failed for token=%s, file id=%s missing on disk.',
            token,
            file_obj.id,
        )
        return render_public_link_error_page(
            'Файл не найден',
            'Файл больше недоступен на сервере.',
        )

    file_obj.last_downloaded_at = timezone.now()
    file_obj.save(update_fields=['last_downloaded_at'])

    logger.info(
        'Public file download for file id=%s ("%s").',
        file_obj.id,
        file_obj.original_name,
    )

    return FileResponse(
        absolute_path.open('rb'),
        as_attachment=True,
        filename=file_obj.original_name,
    )


@csrf_exempt
@require_http_methods(['DELETE'])
def file_public_link_delete_view(request, file_id):
    auth_error = require_auth(request)
    if auth_error:
        return auth_error

    file_obj, error_response = get_file_for_request(request, file_id)
    if error_response:
        return error_response

    if not file_obj.public_token:
        logger.warning(
            'User %s attempted to delete missing public link for file id=%s.',
            request.user.username,
            file_id,
        )
        return JsonResponse({'error': 'Публичная ссылка отсутствует.'}, status=400)

    file_obj.public_token = None
    file_obj.save(update_fields=['public_token'])

    logger.info(
        'User %s deleted public link for file id=%s.',
        request.user.username,
        file_id,
    )

    return JsonResponse(
        {
            'message': 'Публичная ссылка удалена.',
            'file': file_to_dict(file_obj),
        },
        status=200,
    )