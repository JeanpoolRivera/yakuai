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
     * Catálogo inicial para Yakuai.
     *
     * Las etapas y parámetros originales de papa, maíz choclo, haba seca y
     * zanahoria se conservan tal como estaban en el seeder recibido.
     *
     * Para los cultivos agregados se usan perfiles de referencia orientativos:
     * Kc inicial/medio/final basados cuando existe una correspondencia en FAO-56
     * (Allen et al., 1998), con Kc de desarrollo interpolado linealmente. En
     * cultivos andinos sin una ficha FAO-56 específica y en frutales perennes se
     * usan cultivos/grupos análogos como aproximación, NO como mediciones locales.
     *
     * Los días de etapa, profundidad radicular y fracción p también son valores
     * iniciales que deben validarse para variedad, altitud, clima, sistema de
     * manejo y campaña en Chupaca antes de usarse para recomendar riegos reales.
     * Referencia principal: FAO Irrigation and Drainage Paper 56, tablas 12 y 22.
     */
    public function run(): void
    {
        /**
         * Construye un perfil de cuatro etapas a partir de Kc inicial, medio y
         * final. El Kc de desarrollo se interpola linealmente. La profundidad
         * radicular aumenta gradualmente hasta el máximo orientativo del perfil.
         *
         * @return array<int, array{0:string,1:int,2:float,3:float,4:float}>
         */
        $makeProfile = static function (
            array $days,
            float $kcIni,
            float $kcMid,
            float $kcEnd,
            float $rootMax,
            float $p,
        ): array {
            if (count($days) !== 4) {
                throw new \InvalidArgumentException('Un perfil de cultivo debe tener cuatro duraciones de etapa.');
            }

            $kcDes = ($kcIni + $kcMid) / 2;
            $rootDepths = [
                max(0.10, $rootMax * 0.30),
                max(0.15, $rootMax * 0.60),
                $rootMax,
                $rootMax,
            ];

            $rawStages = [
                ['ini', $days[0], $kcIni, $rootDepths[0], $p],
                ['des', $days[1], $kcDes, $rootDepths[1], $p],
                ['med', $days[2], $kcMid, $rootDepths[2], $p],
                ['fin', $days[3], $kcEnd, $rootDepths[3], $p],
            ];

            return array_map(
                static fn (array $stage): array => [
                    $stage[0],
                    (int) $stage[1],
                    round((float) $stage[2], 3),
                    round((float) $stage[3], 2),
                    round((float) $stage[4], 3),
                ],
                $rawStages,
            );
        };

        // Perfiles orientativos compartidos por cultivos del mismo grupo.
        // Para nuevas incorporaciones deben sustituirse por datos locales cuando
        // existan fichas validadas para la variedad y condiciones de Chupaca.
        $profiles = [
            // Hortalizas de hoja y raíz: FAO-56 small vegetables como referencia.
            'small_vegetable' => $makeProfile([20, 25, 35, 20], 0.70, 1.05, 0.95, 0.70, 0.35),
            'lettuce'          => $makeProfile([20, 20, 25, 15], 0.70, 1.00, 0.95, 0.40, 0.30),
            'onion'            => $makeProfile([20, 25, 40, 20], 0.70, 1.05, 0.75, 0.45, 0.30),
            'garlic'           => $makeProfile([20, 25, 40, 20], 0.70, 1.00, 0.70, 0.40, 0.30),
            // Tubérculos andinos: aproximación por analogía con papa.
            'tuber'            => $makeProfile([25, 30, 45, 30], 0.50, 1.15, 0.75, 0.70, 0.35),
            // Cereales: referencia general de cereales de grano en FAO-56.
            'cereal'           => $makeProfile([20, 30, 45, 25], 0.30, 1.15, 0.25, 1.20, 0.55),
            'quinoa'           => $makeProfile([20, 30, 40, 25], 0.40, 1.00, 0.30, 1.00, 0.50),
            // Leguminosas: aproximación por analogía con frijol/guisante.
            'pulse_dry'        => $makeProfile([20, 25, 35, 20], 0.40, 1.15, 0.35, 0.80, 0.45),
            'pulse_fresh'      => $makeProfile([20, 25, 30, 15], 0.50, 1.15, 1.05, 0.70, 0.45),
            // Forrajes: valores orientativos para un ciclo/corte, no para todo el
            // comportamiento plurianual de una pradera establecida.
            'alfalfa'          => $makeProfile([15, 20, 30, 15], 0.40, 1.20, 1.00, 1.20, 0.55),
            'forage'           => $makeProfile([20, 25, 35, 20], 0.40, 1.05, 0.85, 0.80, 0.50),
            // Perfil simplificado de temporada para frutales perennes; no representa
            // dormancia, cobertura del suelo ni diferencias entre huertos.
            'fruit_tree'       => $makeProfile([30, 45, 90, 45], 0.50, 0.95, 0.70, 1.00, 0.50),
            // Tuna: perfil preliminar de baja demanda relativa, requiere calibración.
            'tuna'             => $makeProfile([30, 45, 90, 45], 0.35, 0.65, 0.45, 0.60, 0.55),
        ];

        $crops = [
            // Cultivos que ya estaban en el catálogo: valores originales conservados.
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

            // Tubérculos y raíces andinas reportados en la zona: perfiles por analogía.
            'olluco'  => ['Olluco', 'Ullucus tuberosus', $profiles['tuber']],
            'oca'     => ['Oca', 'Oxalis tuberosa', $profiles['tuber']],
            'mashua'  => ['Mashua', 'Tropaeolum tuberosum', $profiles['tuber']],

            // Otros cereales y granos.
            'cebada'  => ['Cebada', 'Hordeum vulgare', $profiles['cereal']],
            'trigo'   => ['Trigo', 'Triticum aestivum', $profiles['cereal']],
            'quinua'  => ['Quinua', 'Chenopodium quinoa', $profiles['quinoa']],
            'avena'   => ['Avena', 'Avena sativa', $profiles['cereal']],

            // Hortalizas adicionales.
            'ajo'       => ['Ajo', 'Allium sativum', $profiles['garlic']],
            'cebolla'   => ['Cebolla', 'Allium cepa', $profiles['onion']],
            'betarraga' => ['Betarraga', 'Beta vulgaris', $profiles['small_vegetable']],
            'col'       => ['Col', 'Brassica oleracea var. capitata', $profiles['small_vegetable']],
            'lechuga'   => ['Lechuga', 'Lactuca sativa', $profiles['lettuce']],
            'berro'     => ['Berro', 'Nasturtium officinale', $profiles['lettuce']],

            // Leguminosas. Se mantienen separadas arveja verde y arveja seca.
            'arveja_verde' => ['Arveja verde', 'Pisum sativum', $profiles['pulse_fresh']],
            'arveja_seca'  => ['Arveja seca', 'Pisum sativum', $profiles['pulse_dry']],

            // Forrajes (el perfil es por ciclo/corte y es provisional).
            'alfalfa'  => ['Alfalfa', 'Medicago sativa', $profiles['alfalfa']],
            'trebol'   => ['Trébol', 'Trifolium repens', $profiles['forage']],
            'ryegrass' => ['Ryegrass', 'Lolium multiflorum', $profiles['forage']],

            // Frutales mencionados para la provincia. El perfil de etapas es una
            // simplificación temporal para que aparezcan en el catálogo; calibrar
            // antes de usarlo para recomendaciones automáticas de riego.
            'guinda'    => ['Guinda (capulí)', 'Prunus serotina subsp. capuli', $profiles['fruit_tree']],
            'tuna'      => ['Tuna', 'Opuntia ficus-indica', $profiles['tuna']],
            'membrillo' => ['Membrillo', 'Cydonia oblonga', $profiles['fruit_tree']],
            'manzana'   => ['Manzana', 'Malus domestica', $profiles['fruit_tree']],
            'pera'      => ['Pera', 'Pyrus communis', $profiles['fruit_tree']],
            'ciruelo'   => ['Ciruelo', 'Prunus domestica', $profiles['fruit_tree']],
            'nispero'   => ['Níspero', 'Eriobotrya japonica', $profiles['fruit_tree']],
        ];

        foreach ($crops as $code => [$name, $scientific, $stages]) {
            // updateOrCreate: si cambias nombre/científico en este archivo y
            // vuelves a sembrar, el cambio SÍ se aplica. is_active se fuerza a
            // true para que el cultivo aparezca en el formulario de parcelas.
            $crop = Crop::updateOrCreate(['code' => $code], [
                'name' => $name,
                'scientific_name' => $scientific,
                'is_active' => true,
            ]);

            foreach ($stages as [$stage, $days, $kc, $zr, $p]) {
                CropStage::firstOrCreate(
                    ['crop_id' => $crop->id, 'stage' => $stage, 'version' => 1],
                    [
                        'days' => $days,
                        'kc' => $kc,
                        'root_depth_m' => $zr,
                        'depletion_fraction' => $p,
                    ],
                );
            }
        }

        // Texturas de referencia. No implican que todos estos tipos estén
        // confirmados en cada sector de Chupaca; el suelo real requiere análisis.
        $soils = [
            ['arenoso', 'Arenoso', 0.120, 0.060],
            ['franco_arenoso', 'Franco arenoso', 0.200, 0.100],
            ['franco', 'Franco', 0.270, 0.120],
            ['franco_arcilloso', 'Franco arcilloso', 0.320, 0.180],
            ['arcilloso', 'Arcilloso', 0.350, 0.200],
        ];

        foreach ($soils as [$code, $name, $cc, $pmp]) {
            SoilTexture::updateOrCreate(['code' => $code], [
                'name' => $name,
                'field_capacity' => $cc,
                'wilting_point' => $pmp,
            ]);
        }

        // Los endpoints /crops y /soil-textures guardan su respuesta en caché
        // (Redis). Sin esto, el formulario seguiría mostrando la lista vieja
        // aunque el seeder ya haya insertado los datos nuevos.
        Cache::forget('crops_active');
        Cache::forget('soil_textures_all');
    }
}