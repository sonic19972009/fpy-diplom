import os
from pathlib import Path
from uuid import uuid4

from django.conf import settings
from django.contrib.auth import get_user_model
from django.http import FileResponse, JsonResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from .models import StoredFile


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
                return User.objects.get(pk=user_id)
            except User.DoesNotExist:
                return None
    return request.user


def get_file_for_request(request, file_id):
    try:
        file_obj = StoredFile.objects.select_related('owner').get(pk=file_id)
    except StoredFile.DoesNotExist:
        return None, JsonResponse({'error': 'Файл не найден.'}, status=404)

    if request.user.is_staff or file_obj.owner_id == request.user.id:
        return file_obj, None

    return None, JsonResponse({'error': 'Недостаточно прав доступа.'}, status=403)


def ensure_user_storage_dir(user):
    storage_dir = Path(settings.MEDIA_ROOT) / user.storage_path
    storage_dir.mkdir(parents=True, exist_ok=True)
    return storage_dir


@require_http_methods(['GET'])
def files_list_view(request):
    auth_error = require_auth(request)
    if auth_error:
        return auth_error

    target_user = get_target_user(request)
    if target_user is None:
        return JsonResponse({'error': 'Пользователь не найден.'}, status=404)

    files = StoredFile.objects.filter(owner=target_user).select_related('owner')

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

    if uploaded_file is None:
        return JsonResponse({'error': 'Файл не передан.'}, status=400)

    user = request.user
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

    if absolute_path.exists():
        absolute_path.unlink()

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

    import json

    try:
        data = json.loads(request.body.decode('utf-8'))
    except (json.JSONDecodeError, UnicodeDecodeError):
        return JsonResponse({'error': 'Некорректный JSON.'}, status=400)

    new_name = str(data.get('original_name', '')).strip()

    if not new_name:
        return JsonResponse({'error': 'Новое имя файла обязательно.'}, status=400)

    if len(new_name) > 255:
        return JsonResponse({'error': 'Имя файла слишком длинное.'}, status=400)

    file_obj.original_name = new_name
    file_obj.save(update_fields=['original_name'])

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

    import json

    try:
        data = json.loads(request.body.decode('utf-8'))
    except (json.JSONDecodeError, UnicodeDecodeError):
        return JsonResponse({'error': 'Некорректный JSON.'}, status=400)

    comment = str(data.get('comment', '')).strip()

    file_obj.comment = comment
    file_obj.save(update_fields=['comment'])

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
        return JsonResponse({'error': 'Файл на диске не найден.'}, status=404)

    file_obj.last_downloaded_at = timezone.now()
    file_obj.save(update_fields=['last_downloaded_at'])

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
        return JsonResponse({'error': 'Публичная ссылка недействительна.'}, status=404)

    absolute_path = Path(settings.MEDIA_ROOT) / file_obj.file_path

    if not absolute_path.exists():
        return JsonResponse({'error': 'Файл на диске не найден.'}, status=404)

    file_obj.last_downloaded_at = timezone.now()
    file_obj.save(update_fields=['last_downloaded_at'])

    return FileResponse(
        absolute_path.open('rb'),
        as_attachment=True,
        filename=file_obj.original_name,
    )