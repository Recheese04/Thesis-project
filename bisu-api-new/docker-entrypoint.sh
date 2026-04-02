#!/bin/bash
set -e

# Clear all caches to ensure fresh config on every deploy
php artisan config:clear
php artisan route:clear
php artisan cache:clear
php artisan view:clear

# Generate optimized config/routes for production
php artisan config:cache
php artisan route:cache

# Fix storage permissions
chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

# Start Apache
exec apache2-foreground
