<?php

namespace App\Jobs;

use App\Models\Evaluation;
use App\Services\WhatsAppService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SendWhatsAppMessage implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public int $backoff = [60, 300, 900];

    public function __construct(
        public int $evaluationId,
        public string $phone,
    ) {}

    public function handle(WhatsAppService $whatsapp): void
    {
        $evaluation = Evaluation::with('plot')->find($this->evaluationId);

        if ($evaluation === null) {
            Log::warning('WhatsApp: evaluación no encontrada', ['evaluation_id' => $this->evaluationId]);

            return;
        }

        if (! in_array($evaluation->result, ['riega', 'espera'], true)) {
            return;
        }

        $message = $whatsapp->buildMessage($evaluation);
        $result = $whatsapp->send($this->phone, $message);

        if (! $result) {
            Log::error('WhatsApp: fallo al enviar mensaje', [
                'evaluation_id' => $this->evaluationId,
                'phone' => $this->phone,
            ]);

            $this->fail(new \RuntimeException('WhatsApp send failed'));
        }

        Log::info('WhatsApp: mensaje enviado', [
            'evaluation_id' => $this->evaluationId,
            'phone' => $this->phone,
            'result' => $evaluation->result,
        ]);
    }
}
