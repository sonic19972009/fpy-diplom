from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

from storage.views import public_file_download_view, render_public_link_error_page


def invalid_public_link_root_view(request):
    return render_public_link_error_page(
        'Ссылка недействительна',
        'Файл недоступен. Ссылка устарела или была удалена.',
    )


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('users.urls')),
    path('api/', include('storage.urls')),
    path('public/', invalid_public_link_root_view, name='invalid-public-link-root'),
    path('public/<str:token>/', public_file_download_view, name='public-file-download'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)