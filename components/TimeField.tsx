'use client';

import { useState } from 'react';
import TimeSelect from './TimeSelect';

/**
 * Self-contained standalone version of TimeSelect for plain server-rendered
 * forms (settings, edit page) — manages its own state from `defaultValue` so
 * the parent page doesn't need to become a client component.
 */
export default function TimeField({
  name,
  defaultValue,
  required,
  className,
}: {
  name: string;
  defaultValue?: string;
  required?: boolean;
  className?: string;
}) {
  const [value, setValue] = useState(defaultValue ?? '');
  return (
    <TimeSelect name={name} value={value} onChange={setValue} required={required} className={className} />
  );
}
