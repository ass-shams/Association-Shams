import type { Gender } from '../types';

export interface GenderFieldProps {
  readonly value: Gender | '';
  readonly onChange: (value: Gender) => void;
  readonly error?: string;
  readonly disabled?: boolean;
}

const OPTIONS: readonly { value: Gender; label: string }[] = [
  { value: 'male', label: 'ذكر' },
  { value: 'female', label: 'أنثى' },
];

const MESSAGE_ID = 'mem-gender-error';

/** Accessible required radio group used to pick the applicant's gender. */
export default function GenderField({
  value,
  onChange,
  error,
  disabled = false,
}: GenderFieldProps) {
  return (
    <fieldset
      className="mem-choice-group mem-choice-group--gender"
      aria-describedby={error ? MESSAGE_ID : undefined}
    >
      <legend className="field__label mem-choice-group__legend">
        الجنس
        <span className="field__required" aria-hidden="true">
          *
        </span>
      </legend>

      <div className="mem-choice-group__options">
        {OPTIONS.map((option) => {
          const isSelected = value === option.value;

          return (
            <label
              key={option.value}
              className={`choice choice--radio${isSelected ? ' choice--selected' : ''}`}
            >
              <input
                className="choice__input"
                type="radio"
                id={`mem-gender-${option.value}`}
                name="gender"
                value={option.value}
                checked={isSelected}
                disabled={disabled}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? MESSAGE_ID : undefined}
                onChange={() => onChange(option.value)}
              />
              <span className="choice__control" aria-hidden="true" />
              <span className="choice__label">{option.label}</span>
            </label>
          );
        })}
      </div>

      {error ? (
        <p className="field__message field__error" id={MESSAGE_ID} role="alert">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
