'use client';

const STEP_MINUTES = 5;

const OPTIONS = Array.from({ length: (24 * 60) / STEP_MINUTES }, (_, i) => {
  const totalMinutes = i * STEP_MINUTES;
  const h = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
  const m = String(totalMinutes % 60).padStart(2, '0');
  return `${h}:${m}`;
});

/**
 * Single dropdown covering the whole day in 5-minute steps — one tap on
 * mobile picks hour+minute together, instead of two separate hour/minute
 * selects. Always renders as 24-hour HH:MM regardless of browser/OS locale,
 * unlike the native <input type="time"> whose displayed format (12h vs 24h)
 * follows the viewer's locale and can't be forced via HTML/CSS alone.
 */
export default function TimeSelect({
  name,
  value,
  onChange,
  required,
  disabled,
  className,
}: {
  name?: string;
  value: string; // 'HH:MM' or ''
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      {name && <input type="hidden" name={name} value={value} />}
      <select
        aria-label="Jam"
        required={required}
        disabled={disabled}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input tabular-nums"
      >
        <option value="" disabled>
          -- : --
        </option>
        {OPTIONS.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}
