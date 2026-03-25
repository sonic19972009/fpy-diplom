from uuid import uuid4

from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    full_name = models.CharField(max_length=255, verbose_name='Полное имя')
    storage_path = models.CharField(
        max_length=255,
        unique=True,
        blank=True,
        verbose_name='Путь к хранилищу',
    )

    def save(self, *args, **kwargs):
        if not self.storage_path:
            self.storage_path = f'user_{uuid4().hex}'
        super().save(*args, **kwargs)

    def __str__(self):
        return self.username