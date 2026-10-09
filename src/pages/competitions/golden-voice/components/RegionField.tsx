import { REGION_OPTIONS } from '../constants';
import type { RegionValue } from '../constants';

export interface RegionFieldProps {
  readonly value: RegionValue | '';
  readonly onChange: (value: RegionValue) => void;
  readonly error?: string;
  readonly disabled?: boolean;
}

const MESSAGE_ID = 'gv-region-message';

/** Accessible radio group used to pick the participant's region. */
export default function RegionField({ value, onChange, error, disabled = false }: RegionFieldProps) {
  return (
    <fieldset className="gv-region" aria-describedby={error ? MESSAGE_ID : undefined}>
      <legend className="field__label gv-region__legend">
        الجهة
        <span className="field__required" aria-hidden="true">
          *
        </span>
      </legend>

      <div className="gv-region__options">
        {REGION_OPTIONS.map((option) => {
          const isSelected = value === option.value;

          return (
            <label
              key={option.value}
              className={isSelected ? 'gv-radio gv-radio--selected' : 'gv-radio'}
            >
              <input
                className="gv-radio__input"
                type="radio"
                name="region"
                value={option.value}
                checked={isSelected}
                disabled={disabled}
                onChange={() => onChange(option.value)}
              />
              <span className="gv-radio__control" aria-hidden="true" />
              <span className="gv-radio__label">{option.label}</span>
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
