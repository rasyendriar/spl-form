'use client';

import { useMemo, useRef, useState } from 'react';
import { createSubmissionAction } from '@/lib/actions';

type Block = {
  id: string;
  names: string[];
  pekerjaan: string;
  jamSelesai: string;
};

let uid = 0;
function nextId() {
  uid += 1;
  return `blk_${Date.now()}_${uid}`;
}

function isSaturday(dateStr: string): boolean {
  if (!dateStr) return false;
  const d = new Date(`${dateStr}T00:00:00`);
  return !Number.isNaN(d.getTime()) && d.getDay() === 6;
}

export default function OvertimeForm({
  defaultName,
  defaultDate,
  weekdayStart,
  saturdayStart,
  disabled,
}: {
  defaultName: string;
  defaultDate: string;
  weekdayStart: string;
  saturdayStart: string;
  disabled: boolean;
}) {
  const [tanggalLembur, setTanggalLembur] = useState(defaultDate);
  const [blocks, setBlocks] = useState<Block[]>([
    { id: nextId(), names: [defaultName], pekerjaan: '', jamSelesai: '' },
  ]);
  const formRef = useRef<HTMLFormElement>(null);

  const saturday = isSaturday(tanggalLembur);
  const standardStart = saturday ? saturdayStart : weekdayStart;

  const blocksJson = useMemo(
    () =>
      JSON.stringify(
        blocks.map((b) => ({ names: b.names, pekerjaan: b.pekerjaan, jamSelesai: b.jamSelesai }))
      ),
    [blocks]
  );

  function updateBlock(id: string, patch: Partial<Block>) {
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  }

  function updateName(blockId: string, index: number, value: string) {
    setBlocks((prev) =>
      prev.map((b) =>
        b.id === blockId ? { ...b, names: b.names.map((n, i) => (i === index ? value : n)) } : b
      )
    );
  }

  function addName(blockId: string) {
    setBlocks((prev) =>
      prev.map((b) => (b.id === blockId ? { ...b, names: [...b.names, ''] } : b))
    );
  }

  function removeName(blockId: string, index: number) {
    setBlocks((prev) =>
      prev.map((b) =>
        b.id === blockId ? { ...b, names: b.names.filter((_, i) => i !== index) } : b
      )
    );
  }

  function addBlock() {
    setBlocks((prev) => [...prev, { id: nextId(), names: [''], pekerjaan: '', jamSelesai: '' }]);
  }

  function removeBlock(blockId: string) {
    setBlocks((prev) => prev.filter((b) => b.id !== blockId));
  }

  return (
    <form ref={formRef} action={createSubmissionAction} className="space-y-5">
      <input type="hidden" name="blocks_json" value={blocksJson} />

      <div>
        <label className="label" htmlFor="tanggal_lembur">
          Tanggal Lembur
        </label>
        <input
          id="tanggal_lembur"
          name="tanggal_lembur"
          type="date"
          required
          disabled={disabled}
          value={tanggalLembur}
          onChange={(e) => setTanggalLembur(e.target.value)}
          className="input max-w-xs"
        />
        <p className="text-xs text-[color:var(--color-ink-muted)] mt-1.5">
          Bisa pilih tanggal lain jika ini rencana lembur di hari mendatang.
        </p>
      </div>

      <div className="rounded-2xl bg-[color:var(--color-accent-tint)] px-4 py-3 text-sm text-[#0a4a8f] flex items-center gap-2">
        <span className="text-base">🕐</span>
        <span>
          Jam mulai lembur otomatis: <strong>{standardStart}</strong>{' '}
          <span className="text-[#0a4a8f]/70">
            ({saturday ? 'jadwal Sabtu' : 'jadwal hari biasa'})
          </span>
        </span>
      </div>

      <div className="space-y-4">
        {blocks.map((block, blockIndex) => (
          <div key={block.id} className="card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-[color:var(--color-ink-secondary)]">
                Pekerjaan #{blockIndex + 1}
              </p>
              {blocks.length > 1 && !disabled && (
                <button
                  type="button"
                  onClick={() => removeBlock(block.id)}
                  className="text-xs text-[color:var(--color-danger)] hover:underline"
                >
                  Hapus pekerjaan ini
                </button>
              )}
            </div>

            <div>
              <label className="label">Nama Orang yang Lembur</label>
              <div className="space-y-2">
                {block.names.map((name, nameIndex) => (
                  <div key={nameIndex} className="flex gap-2">
                    <input
                      type="text"
                      required
                      disabled={disabled}
                      value={name}
                      onChange={(e) => updateName(block.id, nameIndex, e.target.value)}
                      placeholder="Nama lengkap"
                      className="input"
                    />
                    {block.names.length > 1 && !disabled && (
                      <button
                        type="button"
                        onClick={() => removeName(block.id, nameIndex)}
                        className="btn-secondary px-3 shrink-0"
                        aria-label="Hapus nama ini"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {!disabled && (
                <button
                  type="button"
                  onClick={() => addName(block.id)}
                  className="mt-2 text-sm font-medium text-[color:var(--color-accent)] hover:underline"
                >
                  + Tambah Orang
                </button>
              )}
              <p className="text-xs text-[color:var(--color-ink-muted)] mt-1">
                Isi lebih dari satu nama jika beberapa orang mengerjakan pekerjaan yang sama.
              </p>
            </div>

            <div>
              <label className="label">Pekerjaan / Keperluan Lembur</label>
              <textarea
                required
                disabled={disabled}
                rows={2}
                value={block.pekerjaan}
                onChange={(e) => updateBlock(block.id, { pekerjaan: e.target.value })}
                placeholder="Contoh: Perbaikan mesin produksi line 2"
                className="input"
              />
            </div>

            <div className="max-w-xs">
              <label className="label">Jam Selesai</label>
              <input
                type="time"
                required
                disabled={disabled}
                value={block.jamSelesai}
                onChange={(e) => updateBlock(block.id, { jamSelesai: e.target.value })}
                className="input"
              />
            </div>
          </div>
        ))}
      </div>

      {!disabled && (
        <button type="button" onClick={addBlock} className="btn-secondary w-full">
          + Tambah Pekerjaan Lain (nama &amp; jam selesai berbeda)
        </button>
      )}

      <button type="submit" className="btn-primary w-full" disabled={disabled}>
        Simpan Pengajuan
      </button>
    </form>
  );
}
