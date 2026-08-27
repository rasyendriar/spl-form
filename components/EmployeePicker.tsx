'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, UserCheck } from 'lucide-react';

export type Employee = { nik: string; nama: string; section: string; position: string };
export type PersonValue = { nik: string | null; nama: string; piket?: boolean | null };

export default function EmployeePicker({
  value,
  onChange,
  employees,
  placeholder,
  disabled,
}: {
  value: PersonValue;
  onChange: (v: PersonValue) => void;
  employees: Employee[];
  placeholder?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const matches = useMemo(() => {
    const q = value.nama.trim().toLowerCase();
    if (!q) return employees.slice(0, 8);
    return employees.filter((e) => e.nama.toLowerCase().includes(q)).slice(0, 8);
  }, [value.nama, employees]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative">
        {value.nik ? (
          <UserCheck
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[color:var(--color-success)]"
          />
        ) : (
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[color:var(--color-ink-muted)]"
          />
        )}
        <input
          type="text"
          required
          disabled={disabled}
          value={value.nama}
          onChange={(e) => {
            onChange({ nik: null, nama: e.target.value, piket: value.piket });
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder ?? 'Ketik atau pilih nama'}
          className="input pl-10"
          autoComplete="off"
        />
      </div>

      {open && !disabled && matches.length > 0 && (
        <div className="absolute z-20 mt-1.5 w-full card p-1.5 max-h-56 overflow-auto animate-fade-in-up">
          {matches.map((e) => (
            <button
              type="button"
              key={e.nik}
              onClick={() => {
                onChange({ nik: e.nik, nama: e.nama, piket: value.piket });
                setOpen(false);
              }}
              className="w-full text-left rounded-xl px-3 py-2 text-sm hover:bg-black/[0.04] flex items-center justify-between gap-2 transition-colors"
            >
              <span className="truncate">{e.nama}</span>
              <span className="text-xs text-[color:var(--color-ink-muted)] shrink-0">{e.nik}</span>
            </button>
          ))}
        </div>
      )}

      {!value.nik && value.nama.trim() && (
        <p className="text-[11px] text-[color:var(--color-ink-muted)] mt-1">
          Nama belum tercatat di database karyawan — tetap tersimpan sebagai teks bebas.
        </p>
      )}
    </div>
  );
}
