#include <OneWire.h>
#include <DallasTemperature.h>

// Pines conectados
const byte PIN_HUMEDAD = A0;
const byte PIN_CAUDAL = 2;      // D2: pin de interrupción del UNO
const byte PIN_DS18B20 = 3;     // D3
const byte PIN_FLOTADOR = 4;    // D4
const byte PIN_RELE = 5;        // D5, controla la base del BC547 mediante 470 ohmios

// Calibración nominal del YF-S401.
// El factor puede necesitar ajuste comparando el volumen medido con uno conocido.
const float FRECUENCIA_POR_LITRO_MIN = 98.0;
const float PULSOS_POR_LITRO = 5880.0;

// Límite de seguridad para cada activación manual de la bomba.
const unsigned long TIEMPO_MAXIMO_BOMBA_MS = 5000UL;
const unsigned long INTERVALO_LECTURA_MS = 1000UL;

OneWire oneWire(PIN_DS18B20);
DallasTemperature sensorTemperatura(&oneWire);

volatile unsigned long pulsosCaudal = 0;

unsigned long ultimoReporteMs = 0;
unsigned long ultimaActualizacionBombaMs = 0;
unsigned long pulsosTotales = 0;
float volumenTotalLitros = 0.0;
float caudalActualLMin = 0.0;
float temperaturaC = 0.0;

bool temperaturaDetectada = false;
bool bombaEncendida = false;

// El YF-S401 genera pulsos mientras circula agua.
void contarPulsoCaudal() {
  pulsosCaudal++;
}

bool hayAguaSuficiente() {
  // Con INPUT_PULLUP, un flotador cerrado hacia GND se lee LOW.
  // Cerrado significa que hay agua suficiente.
  return digitalRead(PIN_FLOTADOR) == LOW;
}

void apagarBomba() {
  digitalWrite(PIN_RELE, LOW);
  bombaEncendida = false;
}

void encenderBomba() {
  // Protección: no encender si el flotador indica que falta agua.
  if (!hayAguaSuficiente()) {
    apagarBomba();
    return;
  }

  digitalWrite(PIN_RELE, HIGH);
  bombaEncendida = true;
  ultimaActualizacionBombaMs = millis();
}

void procesarComandosSeriales() {
  while (Serial.available() > 0) {
    char comando = Serial.read();

    if (comando == '1') {
      encenderBomba();
    } else if (comando == '0') {
      apagarBomba();
    }
    // Ignora los caracteres de fin de línea enviados por el Monitor o YakuAI.
  }
}

void actualizarBomba() {
  // Si el nivel baja mientras la bomba está encendida, apagarla inmediatamente.
  if (bombaEncendida && !hayAguaSuficiente()) {
    apagarBomba();
    return;
  }

  // Apagado automático de seguridad después del tiempo límite.
  if (bombaEncendida &&
      millis() - ultimaActualizacionBombaMs >= TIEMPO_MAXIMO_BOMBA_MS) {
    apagarBomba();
  }
}

void actualizarTemperatura() {
  if (sensorTemperatura.getDeviceCount() == 0) {
    temperaturaDetectada = false;
    return;
  }

  sensorTemperatura.requestTemperatures();
  float lectura = sensorTemperatura.getTempCByIndex(0);

  if (lectura == DEVICE_DISCONNECTED_C || lectura < -55.0 || lectura > 125.0) {
    temperaturaDetectada = false;
    return;
  }

  temperaturaC = lectura;
  temperaturaDetectada = true;
}

void emitirJson(int humedadRaw) {
  const bool agua = hayAguaSuficiente();

  Serial.print(F("{\"humedad_raw\":"));
  Serial.print(humedadRaw);
  Serial.print(F(",\"temperatura_c\":"));
  if (temperaturaDetectada) Serial.print(temperaturaC, 1);
  else Serial.print(F("null"));
  Serial.print(F(",\"ds18_detectado\":"));
  Serial.print(temperaturaDetectada ? F("true") : F("false"));
  Serial.print(F(",\"caudal_l_min\":"));
  Serial.print(caudalActualLMin, 2);
  Serial.print(F(",\"volumen_l\":"));
  Serial.print(volumenTotalLitros, 3);
  Serial.print(F(",\"flotador\":\""));
  Serial.print(agua ? F("Hay agua suficiente") : F("No hay suficiente agua"));
  Serial.print(F("\""));
  Serial.print(F(",\"bomba\":"));
  Serial.print(bombaEncendida ? F("true") : F("false"));
  Serial.println(F("}"));
}

void setup() {
  // Mantiene la bomba apagada al iniciar.
  pinMode(PIN_RELE, OUTPUT);
  apagarBomba();
  pinMode(PIN_FLOTADOR, INPUT_PULLUP);
  pinMode(PIN_CAUDAL, INPUT_PULLUP);
  Serial.begin(9600);
  sensorTemperatura.begin();
  sensorTemperatura.setResolution(10);
  attachInterrupt(digitalPinToInterrupt(PIN_CAUDAL), contarPulsoCaudal, RISING);
  ultimoReporteMs = millis();
}

void loop() {
  procesarComandosSeriales();
  actualizarBomba();
  unsigned long ahora = millis();

  if (ahora - ultimoReporteMs >= INTERVALO_LECTURA_MS) {
    unsigned long intervaloMs = ahora - ultimoReporteMs;
    ultimoReporteMs = ahora;
    noInterrupts();
    unsigned long pulsosEnIntervalo = pulsosCaudal;
    pulsosCaudal = 0;
    interrupts();
    pulsosTotales += pulsosEnIntervalo;
    float frecuenciaHz = (pulsosEnIntervalo * 1000.0) / intervaloMs;
    caudalActualLMin = frecuenciaHz / FRECUENCIA_POR_LITRO_MIN;
    volumenTotalLitros = pulsosTotales / PULSOS_POR_LITRO;
    int humedadRaw = analogRead(PIN_HUMEDAD);
    actualizarTemperatura();
    actualizarBomba();
    emitirJson(humedadRaw);
  }
}
