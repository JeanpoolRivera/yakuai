/* Toasts vía sonner. Firmas intactas para no tocar las páginas. */
import { toast as sonner } from "sonner";

export type ToastKind = "ok" | "error" | "info";

export function toast(msg: string, kind: ToastKind = "ok"): void {
  if (kind === "error") sonner.error(msg);
  else if (kind === "info") sonner(msg);
  else sonner.success(msg);
}

export function toastOk(msg: string): void {
  toast(msg, "ok");
}

export function toastError(msg: string): void {
  toast(msg, "error");
}

export function toastInfo(msg: string): void {
  toast(msg, "info");
}
