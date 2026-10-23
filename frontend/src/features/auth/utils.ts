export function hintFor(status: number, backendMsg: string): string | null {
  if (status === 429) return null;
  if (/inactiva/i.test(backendMsg)) return "Pide a tu administrador que active tu cuenta.";
  if (/pin/i.test(backendMsg)) return "Verifica los 4 dígitos con tu técnico si lo olvidaste.";
  return "Verifica tu correo y contraseña e inténtalo de nuevo.";
}

export function passwordStrength(pw: string): { score: number; label: string; color: string } {
  if (!pw) return { score: 0, label: "", color: "" };
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 2) return { score, label: "Débil", color: "#b91c1c" };
  if (score <= 3) return { score, label: "Media", color: "#b45309" };
  return { score, label: "Fuerte", color: "#15803d" };
}

export function validateEmail(email: string): string {
  if (!email.trim()) return "Escribe tu correo.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return "Escribe un correo válido.";
  return "";
}

export function validateSecret(secret: string): string {
  if (secret.length === 0) return "Escribe tu contraseña o PIN.";
  return "";
}

export const INPUT_CLS =
  "h-[50px] w-full rounded-[7px] border border-neutral-400 bg-white pl-11 text-[16px] text-neutral-800 transition-[border-color,box-shadow] placeholder:text-[13px] placeholder:text-neutral-500 hover:border-primary-600 focus:border-primary-600 focus:outline-none focus:[box-shadow:var(--shadow-focus)]! focus:[outline:2px_solid_var(--color-primary-600)]! focus:[outline-offset:2px]! disabled:bg-neutral-100 disabled:hover:border-neutral-400 aria-[invalid=true]:border-danger-500";