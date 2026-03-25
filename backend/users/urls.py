from django.urls import path

from .views import (
    register_view,
    login_view,
    logout_view,
    me_view,
    users_list_view,
    user_update_view,
    user_delete_view,
)


urlpatterns = [
    path('auth/register/', register_view, name='register'),
    path('auth/login/', login_view, name='login'),
    path('auth/logout/', logout_view, name='logout'),
    path('auth/me/', me_view, name='me'),

    path('users/', users_list_view, name='users-list'),
    path('users/<int:user_id>/', user_update_view, name='user-update'),
    path('users/<int:user_id>/delete/', user_delete_view, name='user-delete'),
]