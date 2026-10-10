/* Helpers DOM. */

/** Envía un formulario por id (los botones del pie del modal están fuera del <form>). */
export function submitForm(id: string): void {
  const el = document.getElementById(id);
  if (el instanceof HTMLFormElement) el.requestSubmit();
}
