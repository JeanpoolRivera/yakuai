import { createContext, useContext, useId } from 'react';
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react';
import { Icon } from './Icon';

const FieldContext = createContext<{ id?: string; description?: string; invalid?: boolean; required?: boolean }>({});
export function Field({
  label,
  hint,
  error,
  required = false,
  htmlFor,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  htmlFor?: string;
  children: ReactNode;
}): React.JSX.Element {
  const generatedId = useId();
  htmlFor ??= generatedId;
  const hintId = htmlFor ? `${htmlFor}-hint` : undefined;
  const errorId = htmlFor ? `${htmlFor}-error` : undefined;
  return (
    <div className="field">
      <label className="field-label" htmlFor={htmlFor}>
        {label} {required ? <span className="req" aria-hidden="true">*</span> : null}
      </label>
      <FieldContext.Provider value={{ id: htmlFor, description: error ? errorId : hint ? hintId : undefined, invalid: Boolean(error), required }}>
        {children}
      </FieldContext.Provider>
      {hint && !error ? (
        <span className="field-hint" id={hintId}>
          {hint}
        </span>
      ) : null}
      {error ? (
        <span className="field-error" role="alert" id={errorId}>
          {error}
        </span>
      ) : null}
    </div>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>): React.JSX.Element {
  const field = useContext(FieldContext);
  const id = props.id ?? field.id;
  const linked = id !== undefined && id === field.id;
  return <input id={id} className="input" aria-describedby={linked ? field.description : undefined} aria-invalid={linked && field.invalid ? true : undefined} aria-required={linked && field.required ? true : undefined} {...props} />;
}

export function SelectInput(props: SelectHTMLAttributes<HTMLSelectElement>): React.JSX.Element {
  const field = useContext(FieldContext);
  const id = props.id ?? field.id;
  const linked = id !== undefined && id === field.id;
  return <select id={id} className="select" aria-describedby={linked ? field.description : undefined} aria-invalid={linked && field.invalid ? true : undefined} aria-required={linked && field.required ? true : undefined} {...props} />;
}

export function SearchInput({
  value,
  onChange,
  placeholder,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  label: string;
}): React.JSX.Element {
  return (
    <div className="searchbox">
      <span className="search-icon" aria-hidden="true">
        <Icon name="search" size={16} />
      </span>
      <input
        className="input"
        type="search"
        aria-label={label}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
