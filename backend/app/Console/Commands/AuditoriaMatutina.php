<?php

namespace App\Console\Commands;

use App\Jobs\SendWhatsAppMessage;
use App\Models\Evaluation;
use App\Models\Forecast;
use App\Models\Measurement;
use App\Models\Plot;
use App\Models\User;
use App\Services\HydroService;
use App\Services\OwmService;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\Log;

#[Signature('yakuai:auditoria:matutina {--simulado : Solo muestra lo que haría sin ejecutar}')]
#[Description('Auditoría 5:30 por parcela: crea evaluaciones y envía WhatsApp si toca actuar.')]
class AuditoriaMatutina extends Command
{
    public function __construct(
        private readonly HydroService $hydro,
        private readonly OwmService $owm,
    ) {
        parent::__construct();
    }

    public function handle(): int
    {
        $simulado = (bool) $this->option('simulado');

        try {
            $plots = Plot::query()
                ->with(['farmer', 'crop'])
                ->where('status', 'activa')
                ->orderBy('id')
                ->get();
        } catch (\Throwable $e) {
            $this->warn('Sin base lista para auditar: '.$e->getMessage());

            return self::SUCCESS;
        }

        if ($plots->isEmpty()) {
            $this->info('Sin parcelas activas para auditar.');

            return self::SUCCESS;
        }

        $now = now();
        $slot = $now->copy()->startOfHour();
        $evaluadas = 0;
        $mensajes = 0;
        $errores = 0;

        foreach ($plots as $plot) {
            $existing = Evaluation::where('plot_id', $plot->id)
                ->where('evaluated_at', $slot)
                ->first();

            if ($existing !== null) {
                $this->line(sprintf(
                    '[ok] Parcela #%d %s | ya evaluada a las %s',
                    $plot->id,
                    $plot->name,
                    $slot->format('H:i'),
                ));
                $evaluadas++;

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

            $calc = $this->hydro->evaluate($plot, $measurement, $forecast, $now);

            if ($simulado) {
                $this->line(sprintf(
                    '[simulado] Parcela #%d %s | agricultor=%s | cultivo=%s | resultado=%s | razon=%s',
                    $plot->id,
                    $plot->name,
                    $plot->farmer?->name ?? '—',
                    $plot->crop?->name ?? '—',
                    $calc['result'],
                    $calc['reason'],
                ));
                $evaluadas++;

                continue;
            }

            try {
                $evaluation = Evaluation::create([
                    'plot_id' => $plot->id,
                    'evaluated_at' => $slot,
                    'stage' => $calc['stage'],
                    'inputs_snapshot' => $calc['snapshot'],
                    'result' => $calc['result'],
                    'min_liters' => $calc['min_liters'],
                    'max_liters' => $calc['max_liters'],
                    'confidence' => $calc['confidence'],
                    'reason' => $calc['reason'],
                    'next_at' => $calc['next_at'],
                    'is_critical' => $calc['is_critical'],
                ]);
                $evaluadas++;

                $this->line(sprintf(
                    '[evaluada] Parcela #%d %s | resultado=%s | razon=%s',
                    $plot->id,
                    $plot->name,
                    $calc['result'],
                    $calc['reason'],
                ));

                if (in_array($calc['result'], ['riega', 'espera'], true)) {
                    $phone = $this->resolvePhone($plot);

                    if ($phone !== null) {
                        SendWhatsAppMessage::dispatch($evaluation->id, $phone);
                        $mensajes++;
                        $this->line(sprintf(
                            '[whatsapp] Mensaje encolado para %s',
                            $phone,
                        ));
                    }
                }
            } catch (QueryException $e) {
                if ($e->getCode() === '23000') {
                    $existing = Evaluation::where('plot_id', $plot->id)
                        ->where('evaluated_at', $slot)
                        ->first();

                    if ($existing !== null) {
                        $this->line(sprintf(
                            '[ok] Parcela #%d %s | ya evaluada (duplicado)',
                            $plot->id,
                            $plot->name,
                        ));
                        $evaluadas++;

                        continue;
                    }
                }

                $errores++;
                $this->error(sprintf(
                    '[error] Parcela #%d %s | %s',
                    $plot->id,
                    $plot->name,
                    $e->getMessage(),
                ));
                Log::error('Auditoría matutina: error al evaluar', [
                    'plot_id' => $plot->id,
                    'error' => $e->getMessage(),
                ]);
            } catch (\Throwable $e) {
                $errores++;
                $this->error(sprintf(
                    '[error] Parcela #%d %s | %s',
                    $plot->id,
                    $plot->name,
                    $e->getMessage(),
                ));
                Log::error('Auditoría matutina: error inesperado', [
                    'plot_id' => $plot->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        $this->info(sprintf(
            'Auditoría completada: %d evaluadas, %d mensajes encolados, %d errores.',
            $evaluadas,
            $mensajes,
            $errores,
        ));

        Log::info('Auditoría matutina completada', [
            'evaluadas' => $evaluadas,
            'mensajes' => $mensajes,
            'errores' => $errores,
        ]);

        return $errores > 0 ? self::FAILURE : self::SUCCESS;
    }

    private function resolvePhone(Plot $plot): ?string
    {
        $farmer = $plot->farmer;

        if ($farmer !== null && $farmer->phone !== null && $farmer->phone !== '') {
            return $farmer->phone;
        }

        $user = User::where('farmer_id', $plot->farmer_id)
            ->where('is_active', true)
            ->first();

        if ($user !== null && $user->phone !== null && $user->phone !== '') {
            return $user->phone;
        }

        return null;
    }
}
