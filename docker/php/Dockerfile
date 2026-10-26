FROM php:8.3-fpm-bookworm AS php-runtime

ARG APP_UID=1000
ARG APP_GID=1000

RUN apt-get update && apt-get install -y --no-install-recommends \
    libonig-dev libxml2-dev libzip-dev libsqlite3-dev libfcgi-bin \
  && docker-php-ext-install bcmath mbstring opcache pdo_mysql pdo_sqlite pcntl zip \
  && pecl install redis-6.2.0 \
  && docker-php-ext-enable redis \
  && apt-get clean && rm -rf /var/lib/apt/lists/*

RUN groupadd -g ${APP_GID} yakuai \
  && useradd -u ${APP_UID} -g yakuai -m -s /bin/bash yakuai
COPY docker/php/zz-yakuai.conf /usr/local/etc/php-fpm.d/zz-yakuai.conf
WORKDIR /var/www/html

# Build tools are kept out of the final production runtime image.
FROM php-runtime AS php-tools
RUN apt-get update && apt-get install -y --no-install-recommends git unzip \
  && apt-get clean && rm -rf /var/lib/apt/lists/*
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

FROM php-tools AS production-build
USER root
RUN mkdir -p /var/www/html/storage/app/private /var/www/html/storage/framework/cache/data \
    /var/www/html/storage/framework/sessions /var/www/html/storage/framework/views \
    /var/www/html/storage/logs /var/www/html/bootstrap/cache \
  && chown -R yakuai:yakuai /var/www/html
USER yakuai
COPY --chown=yakuai:yakuai backend/composer.json backend/composer.lock ./
RUN composer install --no-dev --no-interaction --prefer-dist --no-progress \
    --no-scripts --no-autoloader
COPY --chown=yakuai:yakuai backend/ ./
RUN composer dump-autoload --no-dev --classmap-authoritative --no-interaction

FROM php-runtime AS production
COPY docker/php/opcache-production.ini /usr/local/etc/php/conf.d/zz-opcache.ini
COPY --from=production-build --chown=yakuai:yakuai /var/www/html/ /var/www/html/
USER yakuai
CMD ["php-fpm", "-F"]

# Default target remains the bind-mounted local development runtime.
FROM php-tools AS development
USER yakuai
CMD ["php-fpm", "-F"]