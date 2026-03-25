from django.urls import path

from .views import (
    files_list_view,
    file_upload_view,
    file_delete_view,
    file_rename_view,
    file_comment_view,
    file_download_view,
    file_public_link_view,
)


urlpatterns = [
    path('files/', files_list_view, name='files-list'),
    path('files/upload/', file_upload_view, name='file-upload'),
    path('files/<int:file_id>/', file_delete_view, name='file-delete'),
    path('files/<int:file_id>/rename/', file_rename_view, name='file-rename'),
    path('files/<int:file_id>/comment/', file_comment_view, name='file-comment'),
    path('files/<int:file_id>/download/', file_download_view, name='file-download'),
    path('files/<int:file_id>/public-link/', file_public_link_view, name='file-public-link'),
]