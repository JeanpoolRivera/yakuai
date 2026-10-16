<?php

namespace App\Services;

use App\Models\Evaluation;

/**
 * Textos listos para compartir por WhatsApp (fase real: proveedor con
 * plantillas; en curso: el panel los muestra y el agricultor los reenvía).
 */
class MessageService
{
    public function forEvaluation(Evaluation $evaluation): string
    {
        $evaluation->loadMissing('plot');
        $plot = $evaluation->plot->name;

        $lines = ["🌱 YakuAI – {$plot}", ''];

        $lines[] = match ($evaluation->result) {
            'riega' => ($evaluation->is_critical ? '🟠 *Toca regar hoy mismo*' : '🟠 *Toca regar*'),
            'no' => '🟢 *Tu tierra está bien, no riegues hoy*',
            'espera' => '🔵 *Mejor espera, ya viene la lluvia*',
            default => '⚠️ *Nos faltan datos para decidir*',
        };

        if ($evaluation->result === 'espera') {
            $lines[] = '🌧️ Va a llover en las próximas horas. Espera antes de regar.';
        } elseif ($evaluation->result === 'no') {
            $lines[] = '💧 La tierra aún tiene agua suficiente.';
        } elseif ($evaluation->result === 'riega') {
            $lines[] = '💧 Tu tierra está seca.';
        } elseif ($evaluation->result === 'incompleta') {
            $lines[] = 'Falta información del campo. Pide al técnico que revise el sensor.';
        }

        if ($evaluation->min_liters !== null) {
            $plan = $evaluation->inputs_snapshot['plan'] ?? null;
            if (is_array($plan) && isset($plan['litros'])) {
                $lines[] = "🪣 Riega {$plan['litros']} litros (rango {$evaluation->min_liters}–{$evaluation->max_liters})"
                    .(isset($plan['minutos']) && $plan['minutos'] !== null ? " = {$plan['minutos']} min" : '');
                if (isset($plan['inicio']) && $plan['inicio'] !== null) {
                    $lines[] = '🕐 Inicia: '.substr((string) $plan['inicio'], 0, 16);
                }
                if (isset($plan['fin']) && $plan['fin'] !== null) {
                    $lines[] = '🏁 Termina: '.substr((string) $plan['fin'], 0, 16);
                }
                if (! empty($plan['nota'])) {
                    $lines[] = '⚠️ '.$plan['nota'];
                }
            } else {
                $lines[] = "🪣 Cantidad aprox.: {$evaluation->min_liters}–{$evaluation->max_liters} litros";
            }
        }

        $lines[] = '🕐 Riega temprano: 05:30–07:00';

        if ($evaluation->next_at !== null) {
            $lines[] = '🔄 Revisamos: '.$evaluation->next_at->format('d/m H:i');
        }

        return implode("\n", $lines);
    }
}
