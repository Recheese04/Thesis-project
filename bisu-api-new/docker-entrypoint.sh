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
    echo "Listen $PORT" > /etc/apache2/ports.conf
    sed -i "s/:80/:$PORT/g" /etc/apache2/sites-available/000-default.conf
fi

# Debug: show what MPM modules exist at runtime
echo "=== MPM symlinks in mods-enabled ==="
ls -la /etc/apache2/mods-enabled/mpm_* 2>&1 || echo "No mpm symlinks found"
echo "=== Checking apache2.conf for LoadModule mpm ==="
grep -n "LoadModule mpm" /etc/apache2/apache2.conf 2>&1 || echo "No LoadModule mpm in apache2.conf"

# Nuclear fix: remove ALL mpm configs, re-add only prefork
rm -f /etc/apache2/mods-enabled/mpm_*.conf /etc/apache2/mods-enabled/mpm_*.load
ln -sf /etc/apache2/mods-available/mpm_prefork.conf /etc/apache2/mods-enabled/mpm_prefork.conf
ln -sf /etc/apache2/mods-available/mpm_prefork.load /etc/apache2/mods-enabled/mpm_prefork.load

# Also strip any stray LoadModule mpm lines from apache2.conf
sed -i '/LoadModule mpm_event_module/d' /etc/apache2/apache2.conf 2>/dev/null || true
sed -i '/LoadModule mpm_worker_module/d' /etc/apache2/apache2.conf 2>/dev/null || true

echo "=== After fix ==="
ls -la /etc/apache2/mods-enabled/mpm_* 2>&1 || true
apache2ctl configtest 2>&1 || true

# Start Apache
exec apache2-foreground
