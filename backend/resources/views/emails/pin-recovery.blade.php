<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>YakuAI - Código de recuperación</title>
</head>
<body style="margin:0;padding:0;background:#f7f9f5;font-family:'Segoe UI',system-ui,sans-serif;">
    <div style="max-width:480px;margin:0 auto;padding:32px 24px;">
        <div style="background:#fff;border-radius:16px;padding:32px;border:1px solid #e5eae1;box-shadow:0 4px 16px rgba(23,61,48,0.06);">
            <div style="text-align:center;margin-bottom:24px;">
                <span style="display:inline-block;width:48px;height:48px;background:#285942;border-radius:12px;line-height:48px;color:#fff;font-size:24px;">🌱</span>
            </div>
            <h1 style="font-size:22px;font-weight:700;color:#1a2e24;margin:0 0 12px;text-align:center;">Código de recuperación de PIN</h1>
            <p style="font-size:14px;color:#5f6b63;margin:0 0 24px;text-align:center;">Tu código de recuperación es:</p>
            <div style="background:#f0f7f0;border:2px dashed #285942;border-radius:12px;padding:20px;text-align:center;margin-bottom:24px;">
                <span style="font-size:32px;font-weight:700;color:#285942;letter-spacing:4px;">{{ $code }}</span>
            </div>
            <p style="font-size:13px;color:#5f6b63;text-align:center;margin:0;">Este código expira en 10 minutos.</p>
            <p style="font-size:12px;color:#9aa59c;text-align:center;margin:24px 0 0;">Si no solicitaste este código, ignora este email.</p>
        </div>
    </div>
</body>
</html>
