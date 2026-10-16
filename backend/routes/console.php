<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('yakuai:sensores:revisar')->everyFifteenMinutes();

Schedule::command('yakuai:esperas:revisar')->everyThirtyMinutes();

Schedule::command('yakuai:auditoria:matutina')->dailyAt('05:30');

Schedule::command('yakuai:pronosticos:limpiar')->weekly();
