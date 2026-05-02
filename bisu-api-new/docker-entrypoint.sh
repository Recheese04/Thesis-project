#!/bin/bash
set -e

# Clear all caches to ensure fresh config on every deploy
php artisan config:clear
php artisan route:clear
php artisan cache:clear
php artisan view:clear

# Run any pending migrations (don't crash the server if they fail)
php artisan migrate --force 2>&1 || echo "WARNING: Migration failed, check logs"

# Generate optimized config/routes for production
php artisan config:cache
php artisan route:cache

# Fix storage permissions
chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

# Update apache port to match Railway's $PORT if provided
if [ -n "$PORT" ]; then
    sed -i "s/80/$PORT/g" /etc/apache2/sites-available/000-default.conf /etc/apache2/ports.conf
fi

# Start Apache
exec apache2-foreground
