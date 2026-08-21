#!/bin/bash
set -e

# Ensure CACHE_STORE defaults to file to prevent database cache table bootstrap crashes
export CACHE_STORE="${CACHE_STORE:-file}"
export CACHE_DRIVER="${CACHE_DRIVER:-file}"

# Run any pending migrations FIRST so database tables exist
php artisan migrate --force 2>&1 || echo "WARNING: Migration failed, check logs"

# Clear all caches
php artisan config:clear
php artisan route:clear
php artisan cache:clear || true
php artisan view:clear

# Generate optimized config/routes for production
php artisan config:cache || true
php artisan route:cache || true

# Fix storage permissions
chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache 2>/dev/null || true

# Nuclear fix: remove ALL mpm configs, re-add only prefork
rm -f /etc/apache2/mods-enabled/mpm_*.conf /etc/apache2/mods-enabled/mpm_*.load
ln -sf /etc/apache2/mods-available/mpm_prefork.conf /etc/apache2/mods-enabled/mpm_prefork.conf
ln -sf /etc/apache2/mods-available/mpm_prefork.load /etc/apache2/mods-enabled/mpm_prefork.load

# Configure Apache to listen on 80, 8080, and $PORT to prevent 502 Bad Gateway
PORT="${PORT:-8080}"
echo "=== Configuring Apache to listen on ports: 80, 8080, $PORT ==="

echo "Listen 80" > /etc/apache2/ports.conf
echo "Listen 8080" >> /etc/apache2/ports.conf
if [ "$PORT" != "80" ] && [ "$PORT" != "8080" ]; then
    echo "Listen $PORT" >> /etc/apache2/ports.conf
fi

# Rewrite VirtualHost to catch requests on any of those ports
cat > /etc/apache2/sites-available/000-default.conf <<EOF
<VirtualHost *:80 *:8080 *:${PORT}>
    ServerAdmin webmaster@localhost
    DocumentRoot /var/www/html/public

    <Directory /var/www/html/public>
        AllowOverride All
        Require all granted
    </Directory>

    ErrorLog \${APACHE_LOG_DIR}/error.log
    CustomLog \${APACHE_LOG_DIR}/access.log combined
</VirtualHost>
EOF

# Suppress ServerName warning
echo "ServerName localhost" >> /etc/apache2/apache2.conf

echo "=== Apache config test ==="
apache2ctl configtest 2>&1 || true

# Start Apache
exec apache2-foreground
