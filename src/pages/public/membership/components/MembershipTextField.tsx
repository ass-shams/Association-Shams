import type { ReactNode } from 'react';

export interface MembershipTextFieldProps {
  readonly id: string;
  readonly label: string;
  readonly name: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly error?: string;
  /** Optional helper text shown when there is no error. */
  readonly hint?: string;
  readonly required?: boolean;
  readonly type?: 'text' | 'tel';
  readonly inputMode?: 'text' | 'tel' | 'numeric';
  readonly autoComplete?: string;
  readonly placeholder?: string;
  /** Small icon rendered inside the control, on the inline-start side. */
  readonly icon?: ReactNode;
  readonly multiline?: boolean;
  readonly rows?: number;
  readonly disabled?: boolean;
}

/**
 * Labelled membership form control (input or textarea) with an optional icon,
 * error message and hint. The error and hint are linked to the control through
 * `aria-describedby` so assistive technologies announce them.
 */
export default function MembershipTextField({
  id,
  label,
  name,
  value,
  onChange,
  error,
  hint,
  required = false,
  type = 'text',
  inputMode,
  autoComplete,
  placeholder,
  icon,
  multiline = false,
  rows = 5,
  disabled = false,
}: MembershipTextFieldProps) {
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy = [error ? errorId : null, !error && hint ? hintId : null]
    .filter(Boolean)
    .join(' ');

  const controlClassName = multiline
    ? 'field__control field__control--textarea'
    : 'field__control';

  const inputClassName = multiline ? 'textarea' : 'input';

  return (
    <div className={icon ? 'field field--with-icon' : 'field'}>
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
            className={inputClassName}
            id={id}
            name={name}
            rows={rows}
            value={value}
            placeholder={placeholder}
            disabled={disabled}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy || undefined}
            onChange={(event) => onChange(event.target.value)}
          />
        ) : (
          <input
            className={inputClassName}
            id={id}
            name={name}
            type={type}
            inputMode={inputMode}
            value={value}
            autoComplete={autoComplete}
            placeholder={placeholder}
            disabled={disabled}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy || undefined}
            onChange={(event) => onChange(event.target.value)}
          />
        )}
      </div>

      {error ? (
        <p className="field__message field__error" id={errorId} role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="field__message field__hint" id={hintId}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}
