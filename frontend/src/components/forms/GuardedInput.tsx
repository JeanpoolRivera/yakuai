import { useId, useState } from "react";
import type { InputProps } from "@/design-system/primitives/input";
import { Input } from "@/components/shadcn/input";
import { cn } from "@/lib/utils";

type GuardMode = "digits" | "decimal" | "farmer-name" | "plot-name" | "email" | "text";

type GuardedInputProps = Omit<InputProps, "value" | "onChange" | "type" | "inputMode" | "maxLength"> & {
  value: string;
  onValueChange: (value: string) => void;
  guardMode: GuardMode;
  maxLength?: number;
  allowNegative?: boolean;
  maxDecimals?: number;
  displayType?: React.HTMLInputTypeAttribute;
};

/** Rechaza caracteres no permitidos sin borrarlos silenciosamente y anuncia el motivo junto al campo. */
export function GuardedInput({
  value,
  onValueChange,
  guardMode,
  maxLength,
  allowNegative = false,
  maxDecimals = 2,
  displayType = "text",
  id,
  "aria-describedby": describedBy,
  ...inputProps
}: GuardedInputProps): React.JSX.Element {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const noticeId = `${inputId}-input-notice`;
  const [notice, setNotice] = useState("");

  function change(nextValue: string): void {
    if (maxLength !== undefined && nextValue.length > maxLength) {
      setNotice(`Máximo ${maxLength} caracteres.`);
      return;
    }

    const validCharacters = guardMode === "digits"
      ? /^\d*$/.test(nextValue)
      : guardMode === "decimal"
        ? (allowNegative ? /^-?\d*(?:[.,]\d*)?$/.test(nextValue) : /^\d*(?:[.,]\d*)?$/.test(nextValue))
        : guardMode === "farmer-name"
          ? /^[\p{L}\p{M} '’\-]*$/u.test(nextValue)
          : guardMode === "plot-name"
            ? /^[\p{L}\p{M}\p{N} .'’()#/_\-]*$/u.test(nextValue)
            : guardMode === "email"
              ? /^[^\s@]*(?:@[^\s@]*)?$/.test(nextValue)
              : true;

    if (!validCharacters) {
      const message = guardMode === "digits"
        ? "Solo números."
        : guardMode === "decimal"
          ? "Usa números y un decimal."
          : guardMode === "farmer-name"
            ? "Usa letras, espacios, apóstrofo o guion."
            : guardMode === "plot-name"
              ? "Ese carácter no está permitido."
              : guardMode === "email"
                ? "Sin espacios ni @ repetido."
                : "Ese carácter no está permitido.";
      setNotice(message);
      return;
    }

    if (guardMode === "decimal") {
      const fraction = nextValue.split(/[.,]/)[1];
      if (fraction && fraction.length > maxDecimals) {
        setNotice(`Usa como máximo ${maxDecimals} decimales.`);
        return;
      }
      nextValue = nextValue.replace(",", ".");
    }

    onValueChange(nextValue);
    setNotice("");
  }

  const describedByValue = [describedBy, notice ? noticeId : undefined].filter(Boolean).join(" ") || undefined;
  const mode = guardMode === "digits" ? "numeric" : guardMode === "decimal" ? "decimal" : guardMode === "email" ? "email" : undefined;

  return <>
    <Input
      {...inputProps}
      id={inputId}
      type={displayType}
      inputMode={mode}
      value={value}
      aria-describedby={describedByValue}
      className={cn(inputProps.className, notice && "border-danger-600 focus-visible:border-danger-600 focus-visible:ring-danger-500/20")}
      onChange={(event) => change(event.target.value)}
    />
    {notice ? <span id={noticeId} role="status" aria-live="polite" className="validation-message">{notice}</span> : null}
  </>;
}








