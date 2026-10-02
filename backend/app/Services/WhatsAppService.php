<?php

namespace App\Services;

use App\Models\Evaluation;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WhatsAppService
{
    public function __construct(
        private readonly ?string $apiUrl = null,
        private readonly ?string $apiKey = null,
        private readonly ?string $phoneNumberId = null,
    ) {}

    public function buildMessage(Evaluation $evaluation): string
    {
        $evaluation->loadMissing('plot');
        $plot = $evaluation->plot->name;

        $lines = ["🌱 YakuAI – {$plot}", ''];

        $lines[] = match ($evaluation->result) {
            'riega' => ($evaluation->is_critical ? '🟠 *Toca regar hoy mismo*' : '🟠 *Toca regar*'),
            'espera' => '🔵 *Mejor espera, ya viene la lluvia*',
            default => '⚠️ *Nos faltan datos para decidir*',
        };

        if ($evaluation->result === 'espera') {
            $lines[] = '🌧️ Va a llover en las próximas horas. Espera antes de regar.';
        } elseif ($evaluation->result === 'riega') {
            $lines[] = '💧 Tu tierra está seca.';
        }

        if ($evaluation->min_liters !== null) {
            $lines[] = "🪣 Cantidad aprox.: {$evaluation->min_liters}–{$evaluation->max_liters} litros";
        }

        $lines[] = '🕐 Riega temprano: 05:30–07:00';

        if ($evaluation->next_at !== null) {
            $lines[] = '🔄 Revisamos: '.$evaluation->next_at->format('d/m H:i');
        }

        return implode("\n", $lines);
    }

    public function send(string $phone, string $message): bool
    {
        $apiUrl = $this->apiUrl ?? config('services.whatsapp.api_url');
        $apiKey = $this->apiKey ?? config('services.whatsapp.api_key');
        $phoneNumberId = $this->phoneNumberId ?? config('services.whatsapp.phone_number_id');

        if ($apiUrl === null || $apiKey === null || $phoneNumberId === null) {
            Log::info('WhatsApp: no configurado, mensaje simulado', [
                'phone' => $phone,
                'message' => $message,
            ]);

            return true;
        }

        try {
            $response = Http::timeout(30)
                ->withToken($apiKey)
                ->post("{$apiUrl}/{$phoneNumberId}/messages", [
                    'messaging_product' => 'whatsapp',
                    'to' => $phone,
                    'type' => 'text',
                    'text' => ['body' => $message],
                ]);

            if ($response->successful()) {
                return true;
            }

            Log::error('WhatsApp: respuesta no exitosa', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            return false;
        } catch (\Throwable $e) {
            Log::error('WhatsApp: excepción al enviar', [
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }
}
