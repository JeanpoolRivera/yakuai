<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>Activa tu cuenta de YakuAI</title>
</head>
<body style="margin:0;padding:0;background-color:#f2f7f6;font-family:Arial,Helvetica,sans-serif;color:#16333a;-webkit-text-size-adjust:100%;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
    Tu cuenta de agricultor está lista. Actívala y crea tu PIN personal de acceso.
  </div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background-color:#f2f7f6;">
    <tr>
      <td align="center" style="padding:36px 16px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:580px;">
          <tr>
            <td style="padding:0 0 18px 4px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td width="42" height="42" align="center" valign="middle" style="width:42px;height:42px;border-radius:13px;background-color:#0b6672;color:#ffffff;font-size:21px;font-weight:bold;">Y</td>
                  <td style="padding-left:11px;color:#12343b;font-size:22px;font-weight:bold;letter-spacing:-0.5px;">Yaku<span style="color:#0b6672;">AI</span><div style="padding-top:4px;color:#668087;font-size:11px;font-weight:normal;letter-spacing:0.2px;">DECISIONES CLARAS PARA EL RIEGO</div></td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="overflow:hidden;border:1px solid #dce9e6;border-radius:18px;background-color:#ffffff;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="padding:30px 34px 28px;background-color:#0b6672;background-image:linear-gradient(120deg,#0b6672,#124e59);">
                    <div style="display:inline-block;padding:7px 11px;border:1px solid rgba(255,255,255,0.28);border-radius:20px;color:#e5f5f1;font-size:11px;font-weight:bold;letter-spacing:1px;">INVITACIÓN A YAKUAI</div>
                    <h1 style="margin:18px 0 0;color:#ffffff;font-size:27px;line-height:1.25;font-weight:700;">Tu cuenta está lista</h1>
                    <p style="margin:9px 0 0;color:#d7eeea;font-size:15px;line-height:1.6;">Actívala para acceder a la información de tus parcelas.</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:32px 34px 12px;">
                    <p style="margin:0 0 14px;color:#16333a;font-size:16px;line-height:1.6;">Hola <strong>{{ $name }}</strong>,</p>
                    <p style="margin:0;color:#496168;font-size:15px;line-height:1.75;">Tu técnico creó una cuenta de agricultor para ti. Para comenzar, confirma tu correo y crea un PIN personal de 4 dígitos.</p>
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:26px 0 22px;">
                      <tr>
                        <td align="center" style="border-radius:9px;background-color:#0b6672;">
                          <a href="{{ $activationUrl }}" target="_blank" style="display:inline-block;padding:15px 23px;border:1px solid #0b6672;border-radius:9px;color:#ffffff;font-size:15px;font-weight:bold;line-height:1.2;text-decoration:none;">Activar mi cuenta <span aria-hidden="true">&#8594;</span></a>
                        </td>
                      </tr>
                    </table>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 20px;border:1px solid #dce9e6;border-radius:10px;background-color:#f6faf9;">
                      <tr>
                        <td width="42" valign="top" style="width:42px;padding:15px 0 15px 15px;color:#0b6672;font-size:18px;">&#128274;</td>
                        <td style="padding:15px 15px 15px 8px;color:#496168;font-size:13px;line-height:1.6;"><strong style="color:#16333a;">Enlace seguro</strong><br>Es de un solo uso y vence en 24 horas. Si no esperabas esta invitación, puedes ignorar este mensaje.</td>
                      </tr>
                    </table>
                    <p style="margin:0 0 8px;color:#667d82;font-size:12px;line-height:1.6;">Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
                    <p style="margin:0 0 20px;overflow-wrap:anywhere;word-break:break-word;color:#0b6672;font-size:12px;line-height:1.6;"><a href="{{ $activationUrl }}" style="color:#0b6672;text-decoration:underline;">{{ $activationUrl }}</a></p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 34px 28px;">
                    <div style="height:1px;background-color:#e6eeec;font-size:1px;line-height:1px;">&nbsp;</div>
                    <p style="margin:18px 0 0;color:#71858a;font-size:12px;line-height:1.6;">Este correo fue enviado automáticamente por YakuAI. No compartas tu PIN con nadie.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:20px 12px 0;color:#829398;font-size:11px;line-height:1.6;">YakuAI · Decisiones claras para el riego<br>Este mensaje se envió a la dirección asociada a tu invitación.</td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
