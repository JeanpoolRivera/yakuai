<?php

require __DIR__.'/vendor/autoload.php';

$class = 'App\\Http\\Controllers\\MetricsController';
echo 'Class exists: '.(class_exists($class) ? 'YES' : 'NO')."\n";

$file = __DIR__.'/app/Http/Controllers/MetricsController.php';
echo 'File exists: '.(file_exists($file) ? 'YES' : 'NO')."\n";

if (file_exists($file)) {
    $content = file_get_contents($file);
    echo 'Has namespace: '.(strpos($content, 'namespace App\Http\Controllers') !== false ? 'YES' : 'NO')."\n";
    echo 'Has class: '.(strpos($content, 'class MetricsController') !== false ? 'YES' : 'NO')."\n";
}

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo 'Laravel loaded: YES'."\n";
echo 'Class exists after boot: '.(class_exists($class) ? 'YES' : 'NO')."\n";
