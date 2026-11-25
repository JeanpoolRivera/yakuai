<?php

namespace Tests\Unit\Services;

use App\Services\SensorNormalizer;
use Tests\TestCase;

class SensorNormalizerTest extends TestCase
{
    public function test_humedad_normaliza_lectura_calibrada_a_porcentaje(): void
    {
        $result = (new SensorNormalizer)->normalize('humedad', 650, 1020, 320);

        $this->assertSame(['quality' => 'ok', 'norm' => 52.86], $result);
    }

    public function test_humedad_acepta_referencias_invertidas(): void
    {
        $result = (new SensorNormalizer)->normalize('humedad', 670, 320, 1020);

        $this->assertSame(['quality' => 'ok', 'norm' => 50.0], $result);
    }

    public function test_humedad_limita_porcentaje_dentro_del_margen_de_calibracion(): void
    {
        $normalizer = new SensorNormalizer;

        $this->assertSame(['quality' => 'ok', 'norm' => 0.0], $normalizer->normalize('humedad', 1000, 900, 300));
        $this->assertSame(['quality' => 'ok', 'norm' => 100.0], $normalizer->normalize('humedad', 200, 900, 300));
    }

    public function test_humedad_rechaza_calibracion_ausente_o_igual(): void
    {
        $normalizer = new SensorNormalizer;
        $anomalous = ['quality' => 'anomalo', 'norm' => null];

        $this->assertSame($anomalous, $normalizer->normalize('humedad', 650, null, 320));
        $this->assertSame($anomalous, $normalizer->normalize('humedad', 650, 320, null));
        $this->assertSame($anomalous, $normalizer->normalize('humedad', 650, 320, 320));
    }

    public function test_humedad_rechaza_lectura_fuera_del_rango_fisico(): void
    {
        $result = (new SensorNormalizer)->normalize('humedad', -1, 1020, 320);

        $this->assertSame(['quality' => 'anomalo', 'norm' => null], $result);
    }

    public function test_temperatura_acepta_limites_y_rechaza_valor_fuera_de_rango(): void
    {
        $normalizer = new SensorNormalizer;

        $this->assertSame(['quality' => 'ok', 'norm' => -10.0], $normalizer->normalize('aire_temp', -10, null, null));
        $this->assertSame(['quality' => 'ok', 'norm' => 60.0], $normalizer->normalize('aire_temp', 60, null, null));
        $this->assertSame(['quality' => 'anomalo', 'norm' => null], $normalizer->normalize('aire_temp', 60.01, null, null));
    }

    public function test_humedad_relativa_acepta_limites_y_rechaza_valor_fuera_de_rango(): void
    {
        $normalizer = new SensorNormalizer;

        $this->assertSame(['quality' => 'ok', 'norm' => 0.0], $normalizer->normalize('aire_hr', 0, null, null));
        $this->assertSame(['quality' => 'ok', 'norm' => 100.0], $normalizer->normalize('aire_hr', 100, null, null));
        $this->assertSame(['quality' => 'anomalo', 'norm' => null], $normalizer->normalize('aire_hr', 100.01, null, null));
    }

    public function test_lluvia_acepta_solo_valores_discretos(): void
    {
        $normalizer = new SensorNormalizer;

        $this->assertSame(['quality' => 'ok', 'norm' => 0.0], $normalizer->normalize('lluvia', 0, null, null));
        $this->assertSame(['quality' => 'ok', 'norm' => 1.0], $normalizer->normalize('lluvia', 1, null, null));
        $this->assertSame(['quality' => 'anomalo', 'norm' => null], $normalizer->normalize('lluvia', 0.5, null, null));
    }

    public function test_caudal_acepta_limites_y_rechaza_valor_fuera_de_rango(): void
    {
        $normalizer = new SensorNormalizer;

        $this->assertSame(['quality' => 'ok', 'norm' => 0.0], $normalizer->normalize('caudal', 0, null, null));
        $this->assertSame(['quality' => 'ok', 'norm' => 6.0], $normalizer->normalize('caudal', 6, null, null));
        $this->assertSame(['quality' => 'anomalo', 'norm' => null], $normalizer->normalize('caudal', 6.01, null, null));
    }

    public function test_tipo_de_sensor_desconocido_se_clasifica_como_anomalo(): void
    {
        $result = (new SensorNormalizer)->normalize('desconocido', 1, null, null);

        $this->assertSame(['quality' => 'anomalo', 'norm' => null], $result);
    }
}
