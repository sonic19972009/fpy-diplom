# 📦 Cloud Storage Web Application 

## 📌 Описание проекта

Веб-приложение файлового хранилища с возможностью загрузки, управления и обмена файлами между пользователями.

Проект реализован как SPA-приложение:

* backend — Django
* frontend — React

---

## 🛠️ Технологии

### Backend

* Python
* Django
* PostgreSQL
* Session-based аутентификация
* REST API

### Frontend

* React
* Redux Toolkit
* React Router
* Vite

**Инфраструктура:**

* Nginx
* Gunicorn
* Ubuntu VPS

---

## ⚙️ Функциональность

### Пользователи

* Регистрация / авторизация
* Получение текущего пользователя

### Файлы

* Загрузка / удаление
* Переименование
* Добавление комментариев
* Скачивание
* Генерация публичной ссылки
* Доступ по публичной ссылке

### Администрирование

* управление пользователями
* просмотр файлов пользователей
* назначение ролей

---

## 🏗️ Архитектура проекта

```text
backend/
  ├── users/        # работа с пользователями
  ├── storage/      # файловое хранилище
  ├── core/         # базовая логика
  ├── config/       # настройки
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

```env
DJANGO_SECRET_KEY=your_secret_key
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=SERVER_IP,localhost

POSTGRES_DB=your_db
POSTGRES_USER=your_user
POSTGRES_PASSWORD=your_password
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
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

## 🚀 Запуск проекта

<details>
<summary> Инструкция по локальному запуску </summary>

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

Frontend: http://localhost:5173
Backend: http://localhost:8000

</details>

# 🚀 Деплой на VPS (Ubuntu)

<details>
<summary> Инструкция по деплою на VPS </summary>

## 1. Подключение к серверу

```bash
ssh root@SERVER_IP
```

---

## 2. Создание пользователя

```bash
adduser cloud
usermod -aG sudo cloud
su - cloud
```

---

## 3. Установка зависимостей

```bash
sudo apt update
sudo apt upgrade -y

sudo apt install -y python3 python3-pip python3-venv python3-dev
sudo apt install -y build-essential libpq-dev
sudo apt install -y postgresql postgresql-contrib
sudo apt install -y nginx
```

### Node.js 22

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
```

---

## 4. Настройка PostgreSQL

```bash
sudo -u postgres psql
```

```sql
CREATE DATABASE mycloud;
CREATE USER myclouduser WITH PASSWORD 'your_password';
ALTER ROLE myclouduser SET client_encoding TO 'utf8';
ALTER ROLE myclouduser SET default_transaction_isolation TO 'read committed';
ALTER ROLE myclouduser SET timezone TO 'UTC';

GRANT ALL PRIVILEGES ON DATABASE mycloud TO myclouduser;
ALTER DATABASE mycloud OWNER TO myclouduser;

\c mycloud

ALTER SCHEMA public OWNER TO myclouduser;
GRANT ALL ON SCHEMA public TO myclouduser;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO myclouduser;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO myclouduser;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO myclouduser;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO myclouduser;

\q
```

---

## 5. Клонирование проекта

```bash
cd ~
git clone https://github.com/sonic19972009/fpy-diplom.git
cd fpy-diplom
```

---

## 6. Backend настройка

```bash
cd ~/fpy-diplom/backend
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
pip install gunicorn
mkdir -p static
```

### .env

```bash
nano .env
```

```env
DJANGO_SECRET_KEY=your_secret_key
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=SERVER_IP,localhost

POSTGRES_DB=mycloud
POSTGRES_USER=myclouduser
POSTGRES_PASSWORD=your_password
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
```

---

## 7. Миграции и статика

```bash
python manage.py migrate
python manage.py collectstatic --noinput
python manage.py createsuperuser
```

---

## 8. Frontend сборка

```bash
cd ~/fpy-diplom/frontend
npm install
npm run build
```

---

## 9. Права доступа

```bash
cd ~/fpy-diplom
chmod +x setup_permissions.sh
./setup_permissions.sh
```

---

## 10. Gunicorn (systemd)

```bash
sudo nano /etc/systemd/system/gunicorn.service
```

```ini
[Unit]
Description=Gunicorn
After=network.target

[Service]
User=cloud
Group=www-data
WorkingDirectory=/home/cloud/fpy-diplom/backend
Environment="PATH=/home/cloud/fpy-diplom/backend/venv/bin"
ExecStart=/home/cloud/fpy-diplom/backend/venv/bin/gunicorn config.wsgi:application --bind 127.0.0.1:8000

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reexec
sudo systemctl daemon-reload
sudo systemctl start gunicorn
sudo systemctl enable gunicorn
```

---

## 11. Nginx

```bash
sudo nano /etc/nginx/sites-available/mycloud
```

```nginx
server {
    listen 80;
    server_name SERVER_IP;

    client_max_body_size 100M;

    root /var/www/mycloud;
    index index.html;

    location / {
        try_files $uri /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8000;
    }

    location /admin/ {
        proxy_pass http://127.0.0.1:8000;
    }

    location /public/ {
        proxy_pass http://127.0.0.1:8000;
    }

    location /static/ {
        alias /var/www/mycloud-static/;
    }

    location /media/ {
        alias /var/www/mycloud-media/;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/mycloud /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default

sudo nginx -t
sudo systemctl restart nginx
```

</details>

---

<details>
<summary> Полезные команды для разработки </summary>

## Просмотр логов

```bash
sudo journalctl -u gunicorn -f
sudo tail -f /var/log/nginx/error.log
```

## Перезапуск служб

```bash
sudo systemctl restart gunicorn
sudo systemctl reload nginx
```

</details>

<details>
<summary> Устранение неисправностей </summary>

## Проверка статуса служб

```bash
sudo systemctl status gunicorn
sudo systemctl status nginx
```

## Проверка сетевых портов

```bash
sudo netstat -tlnp | grep :80
sudo netstat -tlnp | grep :8000
```

</details>
