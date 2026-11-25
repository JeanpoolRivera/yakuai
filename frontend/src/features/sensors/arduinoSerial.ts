export interface ArduinoReading {
  humedad_raw: number;
  temperatura_c: number | null;
  ds18_detectado: boolean;
  caudal_l_min: number;
  volumen_l: number;
  flotador: string;
  bomba: boolean;
}

interface SerialReader {
  read(): Promise<ReadableStreamReadResult<Uint8Array>>;
  cancel(): Promise<void>;
  releaseLock(): void;
}

interface SerialPort {
  readable: ReadableStream<Uint8Array> | null;
  writable: WritableStream<Uint8Array> | null;
  open(options: { baudRate: number }): Promise<void>;
  close(): Promise<void>;
}

interface SerialApi {
  requestPort(): Promise<SerialPort>;
}

export interface ArduinoSerialState {
  connected: boolean;
  connecting: boolean;
  reading: ArduinoReading | null;
  lastReceivedAt: number | null;
  error: string;
}

const EMPTY_STATE: ArduinoSerialState = {
  connected: false,
  connecting: false,
  reading: null,
  lastReceivedAt: null,
  error: "",
};

function parseReading(line: string): ArduinoReading | null {
  try {
    const value = JSON.parse(line) as Partial<ArduinoReading>;
    if (typeof value.humedad_raw !== "number" || typeof value.caudal_l_min !== "number" ||
      typeof value.volumen_l !== "number" || typeof value.ds18_detectado !== "boolean" ||
      typeof value.flotador !== "string" || typeof value.bomba !== "boolean") return null;
    if (value.temperatura_c !== null && typeof value.temperatura_c !== "number") return null;
    return value as ArduinoReading;
  } catch {
    return null;
  }
}

class ArduinoSerialConnection {
  private state: ArduinoSerialState = EMPTY_STATE;
  private readonly listeners = new Set<() => void>();
  private readonly readingListeners = new Set<(reading: ArduinoReading) => void>();
  private port: SerialPort | null = null;
  private reader: SerialReader | null = null;
  private loop: Promise<void> | null = null;
  private running = false;
  private firstDataTimeout: ReturnType<typeof setTimeout> | null = null;

  getSnapshot = (): ArduinoSerialState => this.state;

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  subscribeReading(listener: (reading: ArduinoReading) => void): () => void {
    this.readingListeners.add(listener);
    return () => this.readingListeners.delete(listener);
  }

  private update(patch: Partial<ArduinoSerialState>): void {
    this.state = { ...this.state, ...patch };
    for (const listener of this.listeners) listener();
  }

  async connect(): Promise<void> {
    if (this.state.connected) return;
    if (this.loop) return this.waitUntilConnected();
    const serial = (navigator as Navigator & { serial?: SerialApi }).serial;
    if (!serial) throw new Error("La conexión serial requiere Chrome o Edge en localhost o HTTPS.");

    this.running = true;
    this.update({ ...EMPTY_STATE, connecting: true });
    this.loop = this.openAndRead(serial).finally(() => { this.loop = null; });
    return this.waitUntilConnected();
  }

  private waitUntilConnected(): Promise<void> {
    if (this.state.connected) return Promise.resolve();
    if (this.state.error) return Promise.reject(new Error(this.state.error));
    return new Promise((resolve, reject) => {
      const unsubscribe = this.subscribe(() => {
        if (this.state.connected) {
          unsubscribe();
          resolve();
        } else if (this.state.error || !this.state.connecting) {
          unsubscribe();
          reject(new Error(this.state.error || "No se pudo conectar con el Arduino."));
        }
      });
    });
  }

  private async openAndRead(serial: SerialApi): Promise<void> {
    let port: SerialPort | null = null;
    try {
      port = await serial.requestPort();
      await port.open({ baudRate: 9600 });
      if (!port.readable) throw new Error("No se pudo abrir la lectura serial del Arduino.");
      this.port = port;
      this.update({ connected: true, connecting: false, error: "" });
      this.firstDataTimeout = setTimeout(() => {
        if (this.running && this.state.lastReceivedAt === null) {
          this.update({ error: "El puerto abrió, pero no llegan lecturas. Revisa que el sketch esté a 9600 baudios y cierra el Monitor serie." });
        }
      }, 5000);

      const reader = port.readable.getReader() as unknown as SerialReader;
      this.reader = reader;
      const decoder = new TextDecoder();
      let buffer = "";
      while (this.running) {
        const { value, done } = await reader.read();
        if (done) break;
        if (!value) continue;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split(/\r?\n/);
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          const reading = parseReading(line.trim());
          if (!reading) {
            this.update({ error: "El Arduino envió una línea que no coincide con el JSON esperado." });
            continue;
          }
          if (this.firstDataTimeout) clearTimeout(this.firstDataTimeout);
          this.firstDataTimeout = null;
          this.update({ reading, lastReceivedAt: Date.now(), error: "" });
          for (const listener of this.readingListeners) listener(reading);
        }
      }
    } catch (cause) {
      if (this.running) {
        const name = cause instanceof DOMException ? cause.name : "";
        const error = name === "NotFoundError"
          ? "No se seleccionó un puerto. Elige el Arduino (por ejemplo, COM9)."
          : name === "NetworkError"
            ? "No se pudo abrir el puerto. Cierra el Monitor serie y otros programas que usen el Arduino."
            : cause instanceof Error ? cause.message : "No se pudo conectar con el Arduino.";
        this.update({ error });
      }
    } finally {
      this.running = false;
      if (this.firstDataTimeout) clearTimeout(this.firstDataTimeout);
      this.firstDataTimeout = null;
      this.reader?.releaseLock();
      this.reader = null;
      this.port = null;
      if (port) {
        try { await port.close(); } catch { /* El dispositivo puede haberse desconectado. */ }
      }
      this.update({ connected: false, connecting: false });
    }
  }

  async sendPumpCommand(command: "1" | "0"): Promise<void> {
    const writable = this.port?.writable;
    if (!this.state.connected || !writable) throw new Error("Conecta el Arduino antes de controlar la bomba.");
    const writer = writable.getWriter();
    try {
      await writer.write(new TextEncoder().encode(command));
    } finally {
      writer.releaseLock();
    }
  }

  async disconnect(): Promise<void> {
    this.running = false;
    try { await this.reader?.cancel(); } catch { /* El bucle cierra el puerto en finally. */ }
    await this.loop;
  }
}

export const arduinoSerial = new ArduinoSerialConnection();
