import * as React from "react";
import { useId } from "react";
import { Label } from "@/components/shadcn/label";
import { cn } from "@/lib/utils";

/** Campo con etiqueta + ayuda + error accesibles.
 * Clona el control hijo único para inyectar `id`, `aria-describedby` y `aria-invalid`.
 */
export function FormField({
  label,
  hint,
  error,
  required = false,
  htmlFor,
  children,
  className,
}: {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
}): React.JSX.Element {
  const generated = useId();
  const id = htmlFor ?? generated;
  const hintId = hint && !error ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const described = errorId ?? hintId;
  const control = React.isValidElement(children)
    ? React.cloneElement(children as React.ReactElement<Record<string, unknown>>, {
        id,
        ...(described ? { "aria-describedby": described } : {}),
        ...(error ? { "aria-invalid": true } : {}),
        ...(required ? { "aria-required": true, required: true } : {}),
      })
    : children;
  return (
    <div className={cn("grid gap-1.5", className)}>
      <Label htmlFor={id}>
        {label} {required ? <span aria-hidden="true" className="text-danger-500">*</span> : null}
      </Label>
      {control}
      {hint && !error ? (
        <span className="text-xs text-neutral-500" id={hintId}>
          {hint}
        </span>
      ) : null}
      {error ? (
        <span className="validation-message" role="alert" id={errorId}>
          {error}
        </span>
      ) : null}
    </div>
  );
}


