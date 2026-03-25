from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import User


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (
        ('Дополнительно', {'fields': ('full_name', 'storage_path')}),
    )

    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Дополнительно', {'fields': ('full_name', 'storage_path')}),
    )

    list_display = ('id', 'username', 'email', 'full_name', 'is_staff', 'is_superuser')