<?php

namespace Tests\Feature;

use Tests\TestCase;

class ApiCacheHeadersTest extends TestCase
{
    public function test_api_responses_are_not_cacheable(): void
    {
        $response = $this->getJson('/api/v1/health');

        $response->assertHeader('Cache-Control', 'no-store, private');
        $response->assertHeader('Pragma', 'no-cache');
        $response->assertHeader('Expires', '0');
    }
}