/* Toasts: evento global `yakuai-toast`. */

export type ToastKind = "ok" | "error" | "info";

export interface ToastDetail {
  msg: string;
  kind: ToastKind;
}

export function toast(msg: string, kind: ToastKind = "ok"): void {
  window.dispatchEvent(new CustomEvent<ToastDetail>("yakuai-toast", { detail: { msg, kind } }));
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
