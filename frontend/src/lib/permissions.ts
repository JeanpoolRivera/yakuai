/* Permisos de experiencia (visibilidad). La autoridad real es el backend. */
import type { Role } from "../api/types";

export function isFarmerRole(role: Role | string | null | undefined): boolean {
  return role === "agricultor";
}

export function isStaffRole(role: Role | string | null | undefined): boolean {
  return role === "admin" || role === "tecnico";
}

export function roleLabel(role: Role | string | null | undefined): string {
  if (role === "admin") return "Administrador";
  if (role === "tecnico") return "Técnico";
  if (role === "agricultor") return "Agricultor";
  return "Sesión";
}
