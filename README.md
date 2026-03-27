# 📦 Cloud Storage Web Application 

## 📌 Описание проекта

Веб-приложение файлового хранилища с возможностью загрузки, управления и обмена файлами между пользователями.

Проект реализован как SPA-приложение с backend на Django и frontend на React.

---

## 🛠️ Технологии

### Backend

* Python
* Django
* PostgreSQL
* Session-based аутентификация
* REST API (JsonResponse, без DRF)

### Frontend

* React
* Redux Toolkit
* React Router
* Vite

---

## ⚙️ Функциональность

### 👤 Пользователи

* Регистрация
* Авторизация (логин / пароль)
* Выход из системы
* Получение текущего пользователя (`/me`)

### 📁 Файлы

* Загрузка файлов
* Удаление файлов
* Переименование файлов
* Добавление комментариев
* Скачивание файлов
* Генерация публичной ссылки
* Доступ к файлу по публичной ссылке

### 🛡️ Роли и доступ

* Обычный пользователь:

  * работает только со своими файлами
* Администратор:

  * просмотр всех пользователей
  * удаление пользователей
  * назначение/снятие прав администратора
  * просмотр файлов других пользователей
  * загрузка файлов в хранилище пользователя

### ⚙️ Админ-панель (кастомная)

* список пользователей
* информация о файлах (количество, размер)
* управление пользователями

---

## 🏗️ Архитектура проекта

```
backend/
  ├── users/        # работа с пользователями
  ├── storage/      # файловое хранилище
  ├── core/         # базовая логика
  ├── config/       # настройки (base/dev/prod)
  └── media/        # загруженные файлы

frontend/
  ├── src/
  │   ├── api/      # работа с API
  │   ├── pages/    # страницы
  │   ├── store/    # Redux
  │   └── components/
  └── vite.config.js
```

---

## 🔐 Конфигурация окружения

Используется `.env` файл (не хранится в репозитории).

Пример (`.env.example`):

```
SECRET_KEY=your_secret_key

POSTGRES_DB=your_db
POSTGRES_USER=your_user
POSTGRES_PASSWORD=your_password
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
```

---

## 🚀 Запуск проекта

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate   # Windows
pip install -r requirements.txt

python manage.py migrate
python manage.py runserver
```

---

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend будет доступен на:

```
http://localhost:5173
```

Backend:

```
http://localhost:8000
```

---

## 🔗 API

Основные эндпоинты:

### Auth

* POST `/api/auth/register/`
* POST `/api/auth/login/`
* POST `/api/auth/logout/`
* GET `/api/auth/me/`

### Users (admin)

* GET `/api/users/`
* PATCH `/api/users/{id}/`
* DELETE `/api/users/{id}/`

### Files

* GET `/api/files/`
* POST `/api/files/`
* DELETE `/api/files/{id}/`
* PATCH `/api/files/{id}/`
* GET `/api/files/{id}/download/`
* POST `/api/files/{id}/public-link/`
* GET `/public/{token}/`

---

## 🧾 Логирование

В проекте настроено логирование для:

* Django
* users
* storage

Логируются ключевые действия и ошибки.

---

## ⚠️ Текущее состояние проекта

На данный момент реализован основной функционал backend и frontend.

В процессе:

* финальная production-сборка
* единый сервер для frontend + backend
* деплой проекта
