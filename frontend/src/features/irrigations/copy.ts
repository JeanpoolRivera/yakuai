import type { IrrigationStatus } from "@/api/types";
import type { DeviationLevel, PeriodFilter, StatusFilter } from "./utils";

export interface PageCopy {
  eyebrow: string;
  title: string;
  description: string;
  cta: string;
  emptyTitle: string;
  emptyHint: string;
  searchPlaceholder: string;
}

export function pageCopy(isStaff: boolean): PageCopy {
  if (isStaff) {
    return {
      eyebrow: "Operación",
      title: "Historial de riego",
      description:
        "Revisa el agua aplicada, compárala con la recomendación y mantén una trazabilidad clara.",
      cta: "Registrar riego",
      emptyTitle: "Aún no hay riegos registrados",
      emptyHint: "Registra el primer riego para empezar a comparar el agua aplicada con la recomendación.",
      searchPlaceholder: "Buscar por parcela o nota",
    };
  }
  return {
    eyebrow: "Tu campo",
    title: "Mis riegos",
    description: "Consulta el agua que has aplicado y cómo se compara con lo que necesitaba tu parcela.",
    cta: "Registrar riego",
    emptyTitle: "Aún no has registrado riegos",
    emptyHint: "Anota cada riego real para ver si te acercaste a lo recomendado.",
    searchPlaceholder: "Buscar por nota",
  };
}

export const STATUS_LABEL: Record<IrrigationStatus, string> = {
  activo: "Vigente",
  corregido: "Corregido",
  anulado: "Anulado",
};

export function statusLabel(status: string): string {
  return STATUS_LABEL[status as IrrigationStatus] ?? status;
}

export const STATUS_ORDER: StatusFilter[] = ["todos", "activo", "corregido", "anulado"];

export const STATUS_FILTER_LABEL: Record<StatusFilter, string> = {
  todos: "Todos",
  activo: "Vigentes",
  corregido: "Corregidos",
  anulado: "Anulados",
};

export const PERIOD_LABEL: Record<PeriodFilter, string> = {
  "7d": "7 días",
  "30d": "30 días",
  todo: "Histórico",
};

export const ORIGIN_LABEL: Record<string, string> = {
  manual: "Manual",
  demo: "Demostración",
};

export function originLabel(origin: string): string {
  return ORIGIN_LABEL[origin] ?? origin;
}

export const DEVIATION_LABEL: Record<DeviationLevel, string> = {
  none: "Sin recomendación",
  ok: "En rango",
  over: "Por encima",
  under: "Por debajo",
};

export function deviationLabel(level: DeviationLevel): string {
  return DEVIATION_LABEL[level];
}

/** Icono compacto de la diferencia en el ledger: ● en rango, ↑ por encima, ↓ por debajo. */
export const DEVIATION_ICON: Record<DeviationLevel, string> = {
  none: "—",
  ok: "●",
  over: "↑",
  under: "↓",
};

export function deviationIcon(level: DeviationLevel): string {
  return DEVIATION_ICON[level];
}

export type DeviationTone = "success" | "warning" | "danger" | "neutral";

export function deviationTone(level: DeviationLevel): DeviationTone {
  if (level === "ok") return "success";
  if (level === "over") return "warning";
  if (level === "under") return "danger";
  return "neutral";
}

export const FILTER_GROUP_LABEL = {
  status: "Filtrar por estado",
  period: "Filtrar por período",
  plot: "Filtrar por parcela",
} as const;

export const DATE_LABEL = {
  from: "Desde",
  to: "Hasta",
} as const;

export const EMPTY_FILTERED_TITLE = "Sin coincidencias";
export const EMPTY_FILTERED_HINT = "Prueba con otra búsqueda, estado o período.";
export const CLEAR_FILTERS = "Limpiar filtros";
export const MORE_FILTERS = "Más filtros";
export const FEWER_FILTERS = "Menos filtros";
export const RESULTS_LABEL = "registros";

/** Encabezados de la tabla de historial (estilo prototipo). */
export const TABLE = {
  headers: {
    date: "Fecha",
    plot: "Parcela",
    recommended: "Recomendado",
    applied: "Aplicado",
    difference: "Diferencia",
    status: "Estado",
  } as const,
  statusPill: {
    ok: "Cumplido",
    over: "Más riego",
    under: "Menos riego",
    pending: "Pendiente",
    noRecord: "Sin registro",
    noRec: "Sin recomendación",
  } as const,
} as const;

/** KPI strip: 2 cards (gráfico 7d + cumplimiento). */
export const KPI = {
  chartTitle: "Últimos 7 días",
  chartLegend: { recommended: "Recomendado", applied: "Aplicado" },
  complianceTitle: "Cumplimiento",
  complianceNote: "de los riegos dentro de ±10 % de lo recomendado",
} as const;

/** Sección de trazabilidad del detalle (comparación antes/después). */
export const COMPARE = {
  title: "Trazabilidad",
  applied: "Aplicada",
  recommended: "Recomendada",
  supersedesPrefix: "Corrige al registro del",
  supersededPrefix: "Este registro fue corregido por el del",
  openPrevious: "Abrir registro anterior",
  openNext: "Abrir registro siguiente",
} as const;

export const LOAD_ERROR = "No se pudo cargar el historial.";
export const RETRY = "Reintentar";

export const TOAST = {
  created: "Riego registrado. Ya aparece en el historial.",
  corrected: "Corrección guardada. El registro anterior se conserva.",
  voided: "Riego anulado. Se conserva en el historial.",
} as const;

export const FORM_TITLE = {
  create: "Registrar riego",
  correct: "Corregir riego",
  void: "Anular riego",
} as const;

export const FORM_HINT = {
  create: "Registra el agua que realmente aplicaste.",
  correct: "Se crea un registro nuevo y el anterior queda como corregido.",
  void: "El registro se conserva como anulado y deja de contar en los totales.",
} as const;

export const AUDIT_NOTE = {
  voided: "Motivo de anulación",
  active: "Nota",
  corrected: "Este registro fue corregido",
} as const;

export const NO_PLOTS = "No hay parcelas disponibles para registrar riegos.";
