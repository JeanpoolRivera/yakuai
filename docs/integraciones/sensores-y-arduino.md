# Sensores y Arduino

## Hardware de la maqueta

La maqueta de parcela usa un Arduino UNO conectado por USB a la computadora, un sensor capacitivo de humedad V1.2, un DS18B20 impermeable colocado en la tierra/sustrato para medir su temperatura, un caudalímetro YF-S401, un interruptor de flotador y una bomba controlada mediante un relé de bobina de 5 V y transistor BC547. El Arduino emite una línea JSON por segundo a 9600 baudios.

| Componente físico | Tipo que se registra en YakuAI | Pin UNO | Conexión principal |
|---|---|---|---|
| Capacitivo V1.2 | Humedad del suelo (`humedad`) | A0 | AOUT a A0; alimentación a 5 V y GND. |
| DS18B20 impermeable | Temperatura de tierra/sustrato de la maqueta (`temperatura_suelo`) | D3 | DATA a D3, 5 V y GND; resistencia de 4.7 kΩ entre DATA y 5 V. |
| Caudalímetro YF-S401 | Caudal (`caudal`) | D2 | Señal a D2; alimentación a 5 V y GND. |
| Interruptor de flotador | Agua suficiente (`agua_suficiente`) | D4 | Un cable a D4 y el otro a GND con `INPUT_PULLUP`. |
| Estado calculado de bomba/relé | Estado de bomba (`bomba_estado`) | D5 | D5 controla la base del BC547 mediante 470 Ω; el pin reporta el estado del relé. |

El relé es de bobina 5 V; la bomba se alimenta por separado a través de COM/NO. La tensión de la fuente de la bomba no se conecta al pin 5 V del Arduino.

El flotador está configurado para que cerrado signifique que hay agua suficiente. El Arduino informa `Hay agua suficiente` o `No hay suficiente agua` y evita activar la bomba si el nivel es insuficiente. La temperatura de tierra medida por el DS18B20 es diferente de la temperatura del aire y el clima entregados por OpenWeather.

## Conexión con YakuAI

En **Sensores** aparece el panel **Arduino UNO por USB**. Requiere Chrome o Microsoft Edge, una página en `localhost` o HTTPS, haber iniciado sesión como técnico o administrador y cerrar el Monitor serie del Arduino IDE antes de conectar el puerto. La conexión se mantiene al cambiar entre Sensores y Evaluar. El técnico elige una vez la parcela de la maqueta y configura el conjunto; YakuAI crea los registros físicos que falten o reutiliza los de esa parcela según tipo y pin.

El panel interpreta los campos `humedad_raw`, `temperatura_c`, `ds18_detectado`, `caudal_l_min`, `volumen_l`, `flotador` y `bomba`. Un servicio de la aplicación guarda humedad, temperatura de tierra y caudal cada 10 segundos; guarda el estado del flotador y de la bomba cuando cambia, aunque el usuario navegue entre pantallas. El volumen acumulado se muestra en vivo y se reinicia al reiniciar el Arduino; no se guarda como medición independiente. La ingesta usa la sesión de YakuAI y `origin: sensor`; no se guarda un token en la placa.

La lectura DS18B20 se cataloga como `temperatura_suelo`; los registros existentes de `temperatura_agua` se renombran con una migración, sin cambiar sus valores. OpenWeather se conserva como fuente de temperatura del aire y pronóstico. El flotador se registra como `agua_suficiente` (1 = suficiente, 0 = insuficiente) y la bomba como `bomba_estado` (1 = encendida, 0 = apagada).

## Requisitos y límites

La sección **Simular una recomendación** de Evaluar sirve para presentar escenarios sin Arduino. Usa el mismo motor de cálculo con humedad relativa y pronóstico ficticios, no guarda lecturas ni evaluaciones y nunca habilita el control de la bomba.

- La maqueta necesita una configuración única para el conjunto: humedad, temperatura de tierra, caudal, flotador y estado de bomba. La conversión de humedad requiere referencias reales de suelo seco y húmedo. Si faltan, la lectura se conserva como anómala y no entra al motor de recomendación; no se inventa una calibración.
- La integración serial funciona mientras la página YakuAI está abierta y la computadora permanece conectada al UNO. No ofrece conexión remota ni funciona si se desconecta el USB.
- En **Evaluar**, solo el técnico o administrador puede activar la maqueta y solo con resultado `riega`, telemetría de hasta 3 segundos y flotador indicando agua suficiente. YakuAI envía por serial `1` para encender y `0` para apagar, igual que el sketch; la interfaz verifica el estado recibido antes de confirmar el encendido. Se comprueba que no exista otro riego registrado para la parcela en las últimas 24 horas.
- El sketch apaga la bomba al cabo de 5 segundos como máximo y si el flotador detecta nivel insuficiente. La interfaz también ofrece un botón para detenerla. El volumen medido por YF-S401 se muestra como aproximado; no equivale al volumen recomendado para una parcela real y debe verificarse la calibración del caudalímetro.
- El sketch de referencia está en [`hardware/arduino/yakuai.ino`](../../hardware/arduino/yakuai.ino). Requiere las bibliotecas OneWire y DallasTemperature en Arduino IDE.
- El YF-S401 de la maqueta indica un rango de 0.3–6 L/min. El sistema marca como anómalas lecturas superiores a 6 L/min. Las lecturas observadas por encima de ese valor deben calibrarse con un volumen conocido antes de confiar en el caudal o volumen calculado.
- La evaluación conserva la lectura reciente de temperatura de tierra para mostrarla junto con los factores de decisión. Aún no se usa como umbral: no se ha definido una regla agronómica respaldada para ese dato. Caudal, flotador y estado de bomba sirven para comprobar la ejecución y proteger la maqueta, no para sustituir el cálculo de necesidad de riego.

La API valida los tipos y rangos en `backend/app/Services/SensorNormalizer.php`. La revisión automática cada 15 minutos marca sensores activos sin medición válida en las últimas tres horas como `sin_datos`; véase [estados del dominio](../backend/estados-del-dominio.md).
