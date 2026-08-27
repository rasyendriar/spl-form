'use client';

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

/**
 * Always renders as 24-hour HH:MM, regardless of browser/OS locale — unlike the
 * native <input type="time">, whose displayed format (12h vs 24h) follows the
 * viewer's locale and can't be forced via HTML/CSS alone.
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
  const [h, m] = value ? value.split(':') : ['', ''];

  function set(nextH: string, nextM: string) {
    if (nextH === '' || nextM === '') {
      onChange('');
      return;
    }
    onChange(`${nextH}:${nextM}`);
  }

  return (
    <div className={`flex items-center gap-1.5 ${className ?? ''}`}>
      {name && <input type="hidden" name={name} value={value} />}
      <select
        aria-label="Jam"
        required={required}
        disabled={disabled}
        value={h}
        onChange={(e) => set(e.target.value, m || '00')}
        className="input !w-auto px-3 tabular-nums"
      >
        <option value="" disabled>
          --
        </option>
        {HOURS.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      <span className="text-[color:var(--color-ink-muted)] font-medium">:</span>
      <select
        aria-label="Menit"
        required={required}
        disabled={disabled}
        value={m}
        onChange={(e) => set(h || '00', e.target.value)}
        className="input !w-auto px-3 tabular-nums"
      >
        <option value="" disabled>
          --
        </option>
        {MINUTES.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}
