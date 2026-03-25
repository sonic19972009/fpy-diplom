from django.conf import settings
from django.db import models


class StoredFile(models.Model):
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='files',
        verbose_name='Владелец',
    )
    original_name = models.CharField(max_length=255, verbose_name='Оригинальное имя')
    stored_name = models.CharField(max_length=255, verbose_name='Имя файла на диске')
    file_path = models.CharField(max_length=500, unique=True, verbose_name='Путь к файлу')
    size = models.PositiveBigIntegerField(default=0, verbose_name='Размер файла')
    comment = models.TextField(blank=True, verbose_name='Комментарий')
    uploaded_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата загрузки')
    last_downloaded_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Дата последнего скачивания',
    )
    public_token = models.CharField(
        max_length=64,
        unique=True,
        null=True,
        blank=True,
        verbose_name='Публичный токен',
    )

    class Meta:
        ordering = ['-uploaded_at']
        verbose_name = 'Файл'
        verbose_name_plural = 'Файлы'

    def __str__(self):
        return f'{self.original_name} ({self.owner.username})'