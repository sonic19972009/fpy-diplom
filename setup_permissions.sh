#!/bin/bash

set -e

PROJECT_ROOT="/home/cloud/fpy-diplom"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIST_DIR="$PROJECT_ROOT/frontend/dist"

PUBLIC_FRONTEND_DIR="/var/www/mycloud"
PUBLIC_STATIC_DIR="/var/www/mycloud-static"
PUBLIC_MEDIA_DIR="/var/www/mycloud-media"

APP_USER="cloud"
WEB_USER="www-data"

echo "Creating public directories..."
sudo mkdir -p "$PUBLIC_FRONTEND_DIR"
sudo mkdir -p "$PUBLIC_STATIC_DIR"
sudo mkdir -p "$PUBLIC_MEDIA_DIR"

echo "Copying frontend build..."
if [ -d "$FRONTEND_DIST_DIR" ]; then
    sudo cp -r "$FRONTEND_DIST_DIR"/* "$PUBLIC_FRONTEND_DIR"/
fi

echo "Copying static files..."
if [ -d "$BACKEND_DIR/staticfiles" ]; then
    sudo cp -r "$BACKEND_DIR/staticfiles"/* "$PUBLIC_STATIC_DIR"/
fi

echo "Copying media files..."
if [ -d "$BACKEND_DIR/media" ]; then
    sudo cp -r "$BACKEND_DIR/media"/* "$PUBLIC_MEDIA_DIR"/ 2>/dev/null || true
fi

echo "Setting ownership..."
sudo chown -R "$WEB_USER:$WEB_USER" "$PUBLIC_FRONTEND_DIR"
sudo chown -R "$WEB_USER:$WEB_USER" "$PUBLIC_STATIC_DIR"
sudo chown -R "$WEB_USER:$WEB_USER" "$PUBLIC_MEDIA_DIR"

sudo chown -R "$APP_USER:$APP_USER" "$PROJECT_ROOT"

echo "Setting permissions..."
sudo chmod -R 755 "$PROJECT_ROOT"
sudo chmod -R 755 "$PUBLIC_FRONTEND_DIR"
sudo chmod -R 755 "$PUBLIC_STATIC_DIR"
sudo chmod -R 755 "$PUBLIC_MEDIA_DIR"

if [ -d "$BACKEND_DIR/media" ]; then
    sudo chmod -R 775 "$BACKEND_DIR/media"
fi

echo "Done."
echo "Frontend: $PUBLIC_FRONTEND_DIR"
echo "Static:   $PUBLIC_STATIC_DIR"
echo "Media:    $PUBLIC_MEDIA_DIR"