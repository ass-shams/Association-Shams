export interface QuantitySelectorProps {
  readonly value: number;
  readonly onChange: (value: number) => void;
  readonly min?: number;
  readonly max?: number;
}

/** UI-only quantity stepper. No cart wiring yet. */
export default function QuantitySelector({
  value,
  onChange,
  min = 1,
  max,
}: QuantitySelectorProps) {
  const decrease = () => onChange(Math.max(min, value - 1));
  const increase = () => onChange(max !== undefined ? Math.min(max, value + 1) : value + 1);

  return (
    <div className="qty" role="group" aria-label="الكمية">
      <button
        type="button"
        className="qty__btn"
        onClick={decrease}
        disabled={value <= min}
        aria-label="تقليل الكمية"
      >
        −
      </button>
      <span className="qty__value" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        className="qty__btn"
        onClick={increase}
        disabled={max !== undefined && value >= max}
        aria-label="زيادة الكمية"
      >
        +
      </button>
    </div>
  );
}
