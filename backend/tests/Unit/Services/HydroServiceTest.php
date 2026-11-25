<?php

namespace Tests\Unit\Services;

use App\Services\HydroService;
use Carbon\CarbonImmutable;
use Tests\TestCase;

class HydroServiceTest extends TestCase
{
    public function test_hargreaves_calcula_evapotranspiracion_de_referencia(): void
    {
        $et0 = (new HydroService)->et0Hargreaves(25, 12, 12);

        $this->assertSame(3.61, $et0);
    }

    public function test_hargreaves_no_calcula_raiz_negativa_si_tmax_es_menor_que_tmin(): void
    {
        $et0 = (new HydroService)->et0Hargreaves(10, 12, 12);

        $this->assertSame(0.0, $et0);
    }

    public function test_radiacion_extraterrestre_es_positiva_y_mayor_en_verano_austral(): void
    {
        $service = new HydroService;
        $summer = $service->extraterrestrialRadiation(-12.0667, CarbonImmutable::parse('2026-01-15'));
        $winter = $service->extraterrestrialRadiation(-12.0667, CarbonImmutable::parse('2026-07-15'));

        $this->assertGreaterThan(0.0, $winter);
        $this->assertGreaterThan($winter, $summer);
    }
}
