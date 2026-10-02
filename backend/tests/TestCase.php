<?php

namespace Tests;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Support\Facades\RateLimiter;

abstract class TestCase extends BaseTestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        // La suite agota el throttle del grupo api (60/min); en tests se
        // desactiva. Los throttles explícitos de login/pin siguen activos.
        RateLimiter::for('api', fn (): Limit => Limit::none());
    }
}
