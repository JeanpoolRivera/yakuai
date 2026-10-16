<?php

namespace App\Console\Commands;

use App\Jobs\SendWhatsAppMessage;
use App\Models\Evaluation;
use App\Models\Forecast;
use App\Models\Measurement;
use App\Services\HydroService;
use App\Services\OwmService;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\Log;

#[Signature('yakuai:esperas:revisar')]
#[Description('Re-evalúa esperas vencidas (lluvia): si no llovió, genera riega y avisa.')]
class EsperasRevisar extends Command
{
    public function __construct(
        private readonly HydroService $hydro,
        private readonly OwmService $owm,
    ) {
        parent::__construct();
    }

    public function handle(): int
    {
        $now = now();
        $revisadas = 0;
        $convertidas = 0;
        $errores = 0;

        try {
            $vencidas = Evaluation::query()
                ->where('result', 'espera')
                ->where('next_at', '<=', $now)
                ->orderBy('id')
                ->limit(100)
                ->get();
        } catch (\Throwable $e) {
            $this->warn('Sin base lista para revisar esperas: '.$e->getMessage());

            return self::SUCCESS;
        }

        foreach ($vencidas as $previa) {
            // Si ya hay una evaluación posterior para la parcela, no duplicar.
            $hayPosterior = Evaluation::where('plot_id', $previa->plot_id)
                ->where('evaluated_at', '>', $previa->evaluated_at)
                ->exists();

            if ($hayPosterior) {
                continue;
            }

            $slot = $now->copy()->startOfHour();
            $existeSlot = Evaluation::where('plot_id', $previa->plot_id)
                ->where('evaluated_at', $slot)
                ->exists();

            if ($existeSlot) {
                continue;
            }

            $plot = $previa->plot;
            if ($plot === null) {
                continue;
            }

            $measurement = Measurement::where('plot_id', $plot->id)
                ->whereHas('sensor', fn ($q) => $q->where('type', 'humedad'))
                ->where('quality', 'ok')
                ->latest('measured_at')
                ->first();

            $forecast = Forecast::where('plot_id', $plot->id)
                ->latest('fetched_at')
                ->first();

            if ($forecast === null || $forecast->fetched_at->diffInMinutes($now) > 120) {
                $forecast = $this->owm->refresh($plot);
            }

            try {
                $calc = $this->hydro->evaluate($plot, $measurement, $forecast, $now);
            } catch (\Throwable $e) {
                $errores++;
                Log::error('Esperas: error al evaluar', ['plot_id' => $plot->id, 'error' => $e->getMessage()]);

                continue;
            }

            try {
                $evaluation = Evaluation::create([
                    'plot_id' => $plot->id,
                    'evaluated_at' => $slot,
                    'stage' => $calc['stage'],
                    'inputs_snapshot' => $calc['snapshot'] + ['rechequeo_de' => $previa->id],
                    'result' => $calc['result'],
                    'min_liters' => $calc['min_liters'],
                    'max_liters' => $calc['max_liters'],
                    'confidence' => $calc['confidence'],
                    'reason' => $calc['reason'],
                    'next_at' => $calc['next_at'],
                    'is_critical' => $calc['is_critical'],
                ]);
                $revisadas++;

                $this->line(sprintf(
                    '[rechequeo] Parcela #%d | antes=espera | ahora=%s (%s)',
                    $plot->id,
                    $calc['result'],
                    $calc['reason'],
                ));

                if ($calc['result'] === 'riega') {
                    $convertidas++;
                    $phone = $plot->farmer?->phone;
                    if ($phone !== null && $phone !== '') {
                        SendWhatsAppMessage::dispatch($evaluation->id, $phone);
                        $this->line("[whatsapp] Aviso de riego para {$phone}");
                    }
                }
            } catch (QueryException $e) {
                if ($e->getCode() !== '23000') {
                    $errores++;
                    Log::error('Esperas: error al guardar', ['plot_id' => $plot->id, 'error' => $e->getMessage()]);
                }
            }
        }

        $this->info("Esperas revisadas: {$revisadas}, convertidas a riega: {$convertidas}, errores: {$errores}.");

        return $errores > 0 ? self::FAILURE : self::SUCCESS;
    }
}
