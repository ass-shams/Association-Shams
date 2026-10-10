import { INTEREST_OPTIONS } from '../constants';
import type { InterestValue } from '../types';

export interface InterestFieldProps {
  readonly value: readonly InterestValue[];
  readonly onChange: (value: InterestValue[]) => void;
  readonly error?: string;
  readonly disabled?: boolean;
}

const MESSAGE_ID = 'mem-interests-error';

/**
 * Multi-select interest group. Implemented as a labelled fieldset of native
 * checkboxes (visually restyled) so it stays keyboard operable and supports
 * several selections at once.
 */
export default function InterestField({
  value,
  onChange,
  error,
  disabled = false,
}: InterestFieldProps) {
  function toggle(option: InterestValue) {
    if (value.includes(option)) {
      onChange(value.filter((item) => item !== option));
    } else {
      onChange([...value, option]);
    }
  }

  return (
    <fieldset
      className="mem-choice-group mem-choice-group--interests"
      aria-describedby={error ? MESSAGE_ID : undefined}
    >
      <legend className="field__label mem-choice-group__legend">
        ما هي ميولاتك؟
        <span className="field__required" aria-hidden="true">
          *
        </span>
      </legend>
      <p className="mem-choice-group__hint">يمكنك اختيار أكثر من مجال.</p>

      <div className="mem-choice-group__options">
        {INTEREST_OPTIONS.map((option, index) => {
          const isSelected = value.includes(option);

          return (
            <label
              key={option}
              className={`choice choice--checkbox${isSelected ? ' choice--selected' : ''}`}
            >
              <input
                className="choice__input"
                type="checkbox"
                id={`mem-interest-${index}`}
                name="interests"
                value={option}
                checked={isSelected}
                disabled={disabled}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? MESSAGE_ID : undefined}
                onChange={() => toggle(option)}
              />
              <span className="choice__control" aria-hidden="true" />
              <span className="choice__label">{option}</span>
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
