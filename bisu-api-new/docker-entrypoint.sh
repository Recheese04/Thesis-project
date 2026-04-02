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

# Run migrations (safe with --force for production)
php artisan migrate --force 2>/dev/null || true

# Fix storage permissions
chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

# Start Apache
exec apache2-foreground
