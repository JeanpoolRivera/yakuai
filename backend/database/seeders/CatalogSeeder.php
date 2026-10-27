<?php

namespace Database\Seeders;

use App\Models\Crop;
use App\Models\CropStage;
use App\Models\SoilTexture;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Cache;

class CatalogSeeder extends Seeder
{
    /**
     * Carga valores iniciales de literatura; no representa validación local.
     * Kc genérico: FAO-56 Tabla 12; raíces y agotamiento: Tabla 22.
     * Duraciones y valores de suelo quedan sujetos a revisión agronómica local.
     */
    public function run(): void
    {
        $reviewedAt = now()->toDateString();
        $cropSource = 'FAO Irrigation and Drainage Paper 56 (1998), Tables 12 and 22. Stage durations are provisional estimates; local validation is pending.';
        $cropSourceUrl = 'https://www.fao.org/4/X0490E/x0490e0b.htm';
        $soilSource = 'FAO-56 Table 19; Saxton & Rawls (2006). Provisional class defaults; local measurements pending.';
        $soilSourceUrl = 'https://www.fao.org/4/X0490E/x0490e0e.htm';
        $crops = [
            'papa' => ['Papa', 'Solanum tuberosum', [
                ['ini', 25, 0.50, 0.40, 0.35],
                ['des', 30, 0.80, 0.50, 0.35],
                ['med', 40, 1.15, 0.60, 0.35],
                ['fin', 30, 0.75, 0.60, 0.35],
            ]],
            'maiz' => ['Maíz choclo', 'Zea mays', [
                ['ini', 25, 0.30, 1.00, 0.55],
                ['des', 40, 0.75, 1.30, 0.55],
                ['med', 45, 1.20, 1.70, 0.55],
                ['fin', 30, 0.35, 1.70, 0.55],
            ]],
            'haba' => ['Haba seca', 'Vicia faba', [
                ['ini', 20, 0.50, 0.50, 0.45],
                ['des', 30, 0.85, 0.60, 0.45],
                ['med', 35, 1.15, 0.70, 0.45],
                ['fin', 15, 0.30, 0.70, 0.45],
            ]],
            'zanahoria' => ['Zanahoria', 'Daucus carota', [
                ['ini', 20, 0.70, 0.50, 0.35],
                ['des', 30, 0.90, 0.65, 0.35],
                ['med', 50, 1.05, 0.80, 0.35],
                ['fin', 20, 0.95, 0.80, 0.35],
            ]],
        ];

        foreach ($crops as $code => [$name, $scientific, $stages]) {
            $crop = Crop::firstOrCreate(['code' => $code], [
                'name' => $name,
                'scientific_name' => $scientific,
            ]);

            foreach ($stages as [$stage, $days, $kc, $zr, $p]) {
                CropStage::firstOrCreate(
                    ['crop_id' => $crop->id, 'stage' => $stage, 'version' => 1],
                    [
                        'days' => $days,
                        'kc' => $kc,
                        'root_depth_m' => $zr,
                        'depletion_fraction' => $p,
                        'source' => $cropSource,
                        'source_url' => $cropSourceUrl,
                        'reviewed_at' => $reviewedAt,
                    ]
                );
            }
        }

        $soils = [
            ['arenoso', 'Arenoso', 0.120, 0.060],
            ['franco_arenoso', 'Franco arenoso', 0.200, 0.100],
            ['franco', 'Franco', 0.270, 0.120],
            ['franco_arcilloso', 'Franco arcilloso', 0.320, 0.180],
            ['arcilloso', 'Arcilloso', 0.350, 0.200],
        ];

        foreach ($soils as [$code, $name, $cc, $pmp]) {
            SoilTexture::firstOrCreate(['code' => $code], [
                'name' => $name,
                'field_capacity' => $cc,
                'wilting_point' => $pmp,
                'source' => $soilSource,
                'source_url' => $soilSourceUrl,
                'reviewed_at' => $reviewedAt,
            ]);
        }
        Cache::forget('crops_active');
        Cache::forget('soil_textures_all');
    }
}
