const EMAIL_PATTERN = /^(?=.{3,254}$)[A-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[A-Z0-9!#$%&'*+/=?^_`{|}~-]+)*@[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?(?:\.[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?)+$/i;
const FARMER_NAME_PATTERN = /^[\p{L}\p{M}]+(?:[ '\u2019-][\p{L}\p{M}]+)*$/u;
const PLOT_NAME_PATTERN = /^[\p{L}\p{M}\p{N}][\p{L}\p{M}\p{N} .\u0027\u2019()#\/_-]*$/u;

export function isValidEmail(value: string): boolean {
  const email = value.trim();
  if (email.length > 254) return false;
  const at = email.lastIndexOf("@");
  if (at < 1 || at > 64) return false;
  const domain = email.slice(at + 1);
  if (domain.length > 253 || !domain.includes(".")) return false;
  return EMAIL_PATTERN.test(email);
}

export function isValidFarmerName(value: string): boolean {
  const name = value.trim();
  return name.length >= 2 && name.length <= 120 && FARMER_NAME_PATTERN.test(name);
}

export function isValidPlotName(value: string): boolean {
  const name = value.trim();
  return name.length >= 2 && name.length <= 120 && PLOT_NAME_PATTERN.test(name);
}

export function isValidPeruvianPhone(value: string): boolean {
  return /^\d{9}$/.test(value);
}

export function isValidFourDigitPin(value: string): boolean {
  return /^\d{4}$/.test(value);
}

export function isValidRecoveryCode(value: string): boolean {
  return /^\d{6}$/.test(value);
}

