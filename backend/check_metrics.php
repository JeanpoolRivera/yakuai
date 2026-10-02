<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Services\MetricsService;

try {
    $service = new MetricsService();
    $result = $service->summary();
    echo 'MetricsService works: '.json_encode($result)."\n";
} catch (\Throwable $e) {
    echo 'Error: '.$e->getMessage()."\n";
    echo 'File: '.$e->getFile().':'.$e->getLine()."\n";
    echo 'Trace: '.$e->getTraceAsString()."\n";
}
