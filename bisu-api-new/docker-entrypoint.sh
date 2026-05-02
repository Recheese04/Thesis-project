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

# Nuclear fix: remove ALL mpm configs, re-add only prefork
rm -f /etc/apache2/mods-enabled/mpm_*.conf /etc/apache2/mods-enabled/mpm_*.load
ln -sf /etc/apache2/mods-available/mpm_prefork.conf /etc/apache2/mods-enabled/mpm_prefork.conf
ln -sf /etc/apache2/mods-available/mpm_prefork.load /etc/apache2/mods-enabled/mpm_prefork.load

# Default to port 8080 if PORT is not set (Railway's default)
PORT="${PORT:-80}"
echo "=== Configuring Apache to listen on port: $PORT ==="

# Write the port config
echo "Listen $PORT" > /etc/apache2/ports.conf

# Rewrite VirtualHost to use the correct port
cat > /etc/apache2/sites-available/000-default.conf <<EOF
<VirtualHost *:${PORT}>
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
