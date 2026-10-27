<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Resend, Postmark, AWS, and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'frontend' => [
        'url' => env('FRONTEND_URL', 'http://localhost:8081'),
    ],

    'owm' => [
        'key' => env('OWM_KEY'),
        'timeout' => env('OWM_TIMEOUT', 15),
    ],

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'whatsapp' => [
        'api_url' => env('WHATSAPP_API_URL'),
        'api_key' => env('WHATSAPP_API_KEY'),
        'phone_number_id' => env('WHATSAPP_PHONE_NUMBER_ID'),
    ],

    'brevo' => [
        'host' => env('BREVO_SMTP_HOST', 'smtp-relay.brevo.com'),
        'port' => env('BREVO_SMTP_PORT', 587),
        'username' => env('BREVO_SMTP_USERNAME'),
        'password' => env('BREVO_SMTP_PASSWORD'),
        'from_email' => env('BREVO_FROM_EMAIL', 'noreply@yakuai.local'),
        'from_name' => env('BREVO_FROM_NAME', 'YakuAI'),
    ],

];
