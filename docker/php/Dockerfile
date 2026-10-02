FROM php:8.3-fpm-bookworm

ARG APP_UID=1000
ARG APP_GID=1000

RUN apt-get update && apt-get install -y --no-install-recommends \
    git unzip libonig-dev libxml2-dev libzip-dev libsqlite3-dev libfcgi-bin \
  && docker-php-ext-install bcmath mbstring pdo_mysql pdo_sqlite pcntl zip \
  && pecl install redis-6.2.0 \
  && docker-php-ext-enable redis \
  && apt-get clean && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

RUN groupadd -g ${APP_GID} yakuai \
  && useradd -u ${APP_UID} -g yakuai -m -s /bin/bash yakuai

COPY docker/php/zz-yakuai.conf /usr/local/etc/php-fpm.d/zz-yakuai.conf

WORKDIR /var/www/html
USER yakuai

CMD ["php-fpm", "-F"]
