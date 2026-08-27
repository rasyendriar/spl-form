'use client';

import { useMemo, useState } from 'react';
import { Plus, Trash2, UserPlus, X } from 'lucide-react';
import { createSubmissionAction } from '@/lib/actions';
import TimeSelect from './TimeSelect';
import EmployeePicker, { Employee, PersonValue } from './EmployeePicker';

type Block = {
  id: string;
  people: PersonValue[];
  pekerjaan: string;
  jamMulai: string;
  jamSelesai: string;
};

let uid = 0;
function nextId() {
  uid += 1;
  return `blk_${Date.now()}_${uid}`;
}

export default function OvertimeForm({
  defaultPerson,
  defaultDate,
  employees,
  disabled,
}: {
  defaultPerson: PersonValue;
  defaultDate: string;
  employees: Employee[];
  disabled: boolean;
}) {
  const [tanggalLembur, setTanggalLembur] = useState(defaultDate);
  const [blocks, setBlocks] = useState<Block[]>([
    { id: nextId(), people: [defaultPerson], pekerjaan: '', jamMulai: '', jamSelesai: '' },
  ]);

  const blocksJson = useMemo(
    () =>
      JSON.stringify(
        blocks.map((b) => ({
          people: b.people,
          pekerjaan: b.pekerjaan,
          jamMulai: b.jamMulai,
          jamSelesai: b.jamSelesai,
        }))
      ),
    [blocks]
  );

  function updateBlock(id: string, patch: Partial<Block>) {
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  }

  function updatePerson(blockId: string, index: number, value: PersonValue) {
    setBlocks((prev) =>
      prev.map((b) =>
        b.id === blockId ? { ...b, people: b.people.map((p, i) => (i === index ? value : p)) } : b
      )
    );
  }

  function addPerson(blockId: string) {
    setBlocks((prev) =>
      prev.map((b) =>
        b.id === blockId ? { ...b, people: [...b.people, { nik: null, nama: '' }] } : b
      )
    );
  }

  function removePerson(blockId: string, index: number) {
    setBlocks((prev) =>
      prev.map((b) =>
        b.id === blockId ? { ...b, people: b.people.filter((_, i) => i !== index) } : b
      )
    );
  }

  function addBlock() {
    setBlocks((prev) => [
      ...prev,
      { id: nextId(), people: [{ nik: null, nama: '' }], pekerjaan: '', jamMulai: '', jamSelesai: '' },
    ]);
  }

  function removeBlock(blockId: string) {
    setBlocks((prev) => prev.filter((b) => b.id !== blockId));
  }

  return (
    <form action={createSubmissionAction} className="space-y-5">
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

      <div className="space-y-4">
        {blocks.map((block, blockIndex) => (
          <div key={block.id} className="card p-5 space-y-4 animate-fade-in-up">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-[color:var(--color-ink-secondary)]">
                Pekerjaan #{blockIndex + 1}
              </p>
              {blocks.length > 1 && !disabled && (
                <button
                  type="button"
                  onClick={() => removeBlock(block.id)}
                  className="inline-flex items-center gap-1 text-xs text-[color:var(--color-danger)] hover:underline"
                >
                  <Trash2 size={13} /> Hapus pekerjaan ini
                </button>
              )}
            </div>

            <div>
              <label className="label">Nama Orang yang Lembur</label>
              <div className="space-y-2">
                {block.people.map((person, personIndex) => (
                  <div key={personIndex} className="flex gap-2">
                    <div className="flex-1">
                      <EmployeePicker
                        value={person}
                        onChange={(v) => updatePerson(block.id, personIndex, v)}
                        employees={employees}
                        disabled={disabled}
                      />
                    </div>
                    {block.people.length > 1 && !disabled && (
                      <button
                        type="button"
                        onClick={() => removePerson(block.id, personIndex)}
                        className="btn-secondary px-3 shrink-0 h-fit"
                        aria-label="Hapus nama ini"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {!disabled && (
                <button
                  type="button"
                  onClick={() => addPerson(block.id)}
                  className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-[color:var(--color-accent)] hover:underline"
                >
                  <UserPlus size={15} /> Tambah Orang
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

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Jam Mulai</label>
                <TimeSelect
                  value={block.jamMulai}
                  onChange={(v) => updateBlock(block.id, { jamMulai: v })}
                  required
                  disabled={disabled}
                />
              </div>
              <div>
                <label className="label">Jam Selesai</label>
                <TimeSelect
                  value={block.jamSelesai}
                  onChange={(v) => updateBlock(block.id, { jamSelesai: v })}
                  required
                  disabled={disabled}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {!disabled && (
        <button type="button" onClick={addBlock} className="btn-secondary w-full">
          <Plus size={16} /> Tambah Pekerjaan Lain (nama &amp; jam berbeda)
        </button>
      )}

      <button type="submit" className="btn-primary w-full" disabled={disabled}>
        Simpan Pengajuan
      </button>
    </form>
  );
}
