import type { ReactNode } from 'react';

export interface RegistrationFieldProps {
  readonly id: string;
  readonly name: string;
  readonly label: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly error?: string;
  readonly type?: 'text' | 'tel';
  readonly inputMode?: 'text' | 'tel' | 'numeric';
  readonly autoComplete?: string;
  readonly placeholder?: string;
  /** Small icon rendered inside the control, on the inline-start side. */
  readonly icon?: ReactNode;
  readonly required?: boolean;
  readonly disabled?: boolean;
}

/**
 * Labelled text input for the registration form. Reuses the shared field
 * styles from `styles.css` and links its error message to the control for
 * assistive technologies.
 */
export default function RegistrationField({
  id,
  name,
  label,
  value,
  onChange,
  error,
  type = 'text',
  inputMode,
  autoComplete,
  placeholder,
  icon,
  required = false,
  disabled = false,
}: RegistrationFieldProps) {
  const messageId = `${id}-message`;

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

      <div className="field__control">
        {icon ? (
          <span className="field__icon" aria-hidden="true">
            {icon}
          </span>
        ) : null}

        <input
          className="input"
          id={id}
          name={name}
          type={type}
          inputMode={inputMode}
          value={value}
          autoComplete={autoComplete}
          placeholder={placeholder}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? messageId : undefined}
          onChange={(event) => onChange(event.target.value)}
        />
      </div>

      {error ? (
        <p className="field__message field__error" id={messageId} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
