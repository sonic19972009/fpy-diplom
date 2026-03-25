import re

from django.core.validators import validate_email
from django.core.exceptions import ValidationError


USERNAME_PATTERN = re.compile(r'^[A-Za-z][A-Za-z0-9]{3,19}$')
PASSWORD_UPPERCASE_PATTERN = re.compile(r'[A-Z]')
PASSWORD_DIGIT_PATTERN = re.compile(r'\d')
PASSWORD_SPECIAL_PATTERN = re.compile(r'[^A-Za-z0-9]')


def validate_username(username):
    if not username:
        return 'Логин обязателен.'

    if not USERNAME_PATTERN.fullmatch(username):
        return (
            'Логин должен содержать только латинские буквы и цифры, '
            'начинаться с буквы и иметь длину от 4 до 20 символов.'
        )

    return None


def validate_user_email(email):
    if not email:
        return 'Email обязателен.'

    try:
        validate_email(email)
    except ValidationError:
        return 'Введите корректный email.'

    return None


def validate_password(password):
    if not password:
        return 'Пароль обязателен.'

    if len(password) < 6:
        return 'Пароль должен содержать не менее 6 символов.'

    if not PASSWORD_UPPERCASE_PATTERN.search(password):
        return 'Пароль должен содержать хотя бы одну заглавную букву.'

    if not PASSWORD_DIGIT_PATTERN.search(password):
        return 'Пароль должен содержать хотя бы одну цифру.'

    if not PASSWORD_SPECIAL_PATTERN.search(password):
        return 'Пароль должен содержать хотя бы один специальный символ.'

    return None


def validate_full_name(full_name):
    if not full_name:
        return 'Полное имя обязательно.'

    if len(full_name.strip()) < 2:
        return 'Полное имя должно содержать не менее 2 символов.'

    return None