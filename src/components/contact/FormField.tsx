import type { ReactNode } from 'react';

export interface FormFieldProps {
  readonly id: string;
  readonly label: string;
  readonly name: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly error?: string;
  readonly required?: boolean;
  readonly type?: string;
  readonly autoComplete?: string;
  readonly inputMode?: 'text' | 'tel' | 'email';
  readonly placeholder?: string;
  /** Small icon rendered inside the control, on the inline-start (right in RTL). */
  readonly icon?: ReactNode;
  readonly multiline?: boolean;
  readonly rows?: number;
  readonly disabled?: boolean;
  readonly fullWidth?: boolean;
}

/** Shared labelled field (input or textarea) with optional icon and error message. */
export default function FormField({
  id,
  label,
  name,
  value,
  onChange,
  error,
  required = false,
  type = 'text',
  autoComplete,
  inputMode,
  placeholder,
  icon,
  multiline = false,
  rows = 5,
  disabled = false,
  fullWidth = false,
}: FormFieldProps) {
  const fieldClassName = [fullWidth ? 'field--full' : null, icon ? 'field--with-icon' : null]
    .filter(Boolean)
    .join(' ');

  const controlClassName = multiline
    ? 'field__control field__control--textarea'
    : 'field__control';

  return (
    <div className={fieldClassName ? `field ${fieldClassName}` : 'field'}>
      <label className="field__label" htmlFor={id}>
        {label}
        {required ? (
          <span className="field__required" aria-hidden="true">
            *
          </span>
        ) : null}
      </label>

      <div className={controlClassName}>
        {icon ? (
          <span className="field__icon" aria-hidden="true">
            {icon}
          </span>
        ) : null}

        {multiline ? (
          <textarea
            className="textarea"
            id={id}
            name={name}
            rows={rows}
            value={value}
            placeholder={placeholder}
            disabled={disabled}
            aria-invalid={error ? true : undefined}
            onChange={(event) => onChange(event.target.value)}
          />
        ) : (
          <input
            className="input"
            id={id}
            name={name}
            type={type}
            value={value}
            autoComplete={autoComplete}
            inputMode={inputMode}
            placeholder={placeholder}
            disabled={disabled}
            aria-invalid={error ? true : undefined}
            onChange={(event) => onChange(event.target.value)}
          />
        )}
      </div>

      {error ? <p className="field__message field__error">{error}</p> : null}
    </div>
  );
}
