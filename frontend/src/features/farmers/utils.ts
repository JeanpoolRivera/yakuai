import type { Farmer } from '@/api/types';
import { initial as initialFn } from '@/lib/format';

export function twoInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return initialFn(name);
  if (parts.length === 1) return initialFn(parts[0]);
  return (initialFn(parts[0]) + initialFn(parts[parts.length - 1])).toUpperCase();
}

export function initial(name: string): string {
  return name.trim().charAt(0).toUpperCase() || "?";
}

export function waLink(phone: string): string {
  return `https://wa.me/${phone.replace(/\D/g, "")}`;
}

export function validateFarmer(name: string, phone: string): string | null {
  if (name.trim().length < 2) return "El nombre debe tener al menos 2 letras.";
  if (phone.trim() && !/^\+?[\d\s-]{7,}$/.test(phone.trim())) return "Teléfono inválido.";
  return null;
}

export function filterFarmers(farmers: Farmer[], query: string): Farmer[] {
  if (!query.trim()) return farmers;
  const q = query.trim().toLowerCase();
  return farmers.filter((f) => `${f.name} ${f.phone ?? ""}`.toLowerCase().includes(q));
}
