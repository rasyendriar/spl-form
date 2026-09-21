import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import OvertimeForm, { DRAFT_KEY } from './OvertimeForm';
import { createSubmissionAction } from '@/lib/actions';
import type { Employee, PersonValue } from './EmployeePicker';

vi.mock('@/lib/actions', () => ({
  createSubmissionAction: vi.fn(),
}));

// Fix "today" so the H-1/H+1 date-window check in lib/validation.ts is
// deterministic — the rest of lib/utils (shiftDateStr, isValidHHMM, etc.) is
// left real, only the wall-clock lookup is stubbed.
vi.mock('@/lib/utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/utils')>();
  return { ...actual, todayInputValue: () => '2026-09-21' };
});

const mockedCreateSubmissionAction = vi.mocked(createSubmissionAction);

const defaultPerson: PersonValue = { nik: null, nama: 'Test User' };
const employees: Employee[] = [
  { nik: '001', nama: 'Test User', section: 'Produksi', position: 'Operator' },
];
// A Monday, so the Saturday-only "piket" checkbox never enters the picture.
// Must match the stubbed todayInputValue() above.
const defaultDate = '2026-09-21';

function renderForm(props: Partial<React.ComponentProps<typeof OvertimeForm>> = {}) {
  return render(
    <OvertimeForm
      defaultPerson={defaultPerson}
      defaultDate={defaultDate}
      employees={employees}
      disabled={false}
      {...props}
    />
  );
}

function fillPekerjaan(value: string) {
  const textarea = screen.getByPlaceholderText('Contoh: Perbaikan mesin produksi line 2');
  return userEvent.type(textarea, value);
}

async function selectJam(label: 'mulai' | 'selesai', value: string) {
  const [jamMulaiSelect, jamSelesaiSelect] = screen.getAllByLabelText('Jam');
  await userEvent.selectOptions(label === 'mulai' ? jamMulaiSelect : jamSelesaiSelect, value);
}

beforeEach(() => {
  sessionStorage.clear();
  mockedCreateSubmissionAction.mockReset();
});

afterEach(() => {
  sessionStorage.clear();
});

describe('OvertimeForm', () => {
  it('blocks submission when a block is incomplete, without discarding what was already typed', async () => {
    renderForm();

    // Whitespace satisfies the browser's native `required` (so jsdom actually
    // lets the submit event through to our handler, like a real browser
    // would) but fails our trim-based check — a realistic way this used to
    // slip past the UI and hit the server as an "invalid_block" redirect.
    await fillPekerjaan('   ');
    await selectJam('mulai', '08:00');
    await selectJam('selesai', '10:00');

    await userEvent.click(screen.getByRole('button', { name: /simpan pengajuan/i }));

    expect(mockedCreateSubmissionAction).not.toHaveBeenCalled();
    expect(
      screen.getByText(
        'Setiap pekerjaan wajib punya nama, pekerjaan, jam mulai, dan jam selesai yang valid.'
      )
    ).toBeInTheDocument();
    expect(screen.getByText('Pekerjaan wajib diisi.')).toBeInTheDocument();

    // The whole point of the fix: nothing the user already typed disappears,
    // and jam mulai/selesai (which were valid) are still selected.
    const [jamMulaiSelect, jamSelesaiSelect] = screen.getAllByLabelText('Jam');
    expect(jamMulaiSelect).toHaveValue('08:00');
    expect(jamSelesaiSelect).toHaveValue('10:00');
  });

  it('rejects a block where jam mulai and jam selesai are the same, without discarding input', async () => {
    renderForm();

    await fillPekerjaan('Cek panel listrik');
    await selectJam('mulai', '08:00');
    await selectJam('selesai', '08:00');

    await userEvent.click(screen.getByRole('button', { name: /simpan pengajuan/i }));

    expect(mockedCreateSubmissionAction).not.toHaveBeenCalled();
    expect(screen.getByText('Jam mulai dan jam selesai tidak boleh sama.')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Contoh: Perbaikan mesin produksi line 2')).toHaveValue(
      'Cek panel listrik'
    );
  });

  it('rejects a tanggal lembur outside the H-1/H+1 window', async () => {
    renderForm();

    // The date input also carries native min/max (asserted below) which
    // browsers enforce on their own — this test instead proves our own JS
    // check is a real backstop (e.g. for the page being left open across
    // midnight, shifting what "today" means), so it submits the form
    // directly rather than going through the native min/max-guarded click.
    const dateInput = screen.getByLabelText('Tanggal Lembur');
    expect(dateInput).toHaveAttribute('min', '2026-09-20');
    expect(dateInput).toHaveAttribute('max', '2026-09-22');
    fireEvent.change(dateInput, { target: { value: '2026-09-30' } }); // far outside the 3-day window

    await fillPekerjaan('Lembur jauh hari');
    await selectJam('mulai', '08:00');
    await selectJam('selesai', '10:00');

    const form = screen.getByRole('button', { name: /simpan pengajuan/i }).closest('form')!;
    fireEvent.submit(form);

    expect(mockedCreateSubmissionAction).not.toHaveBeenCalled();
    expect(
      screen.getByText('Tanggal lembur hanya bisa untuk H-1, hari ini, atau H+1.')
    ).toBeInTheDocument();
    // Input untuk pekerjaan tetap ada meski tanggalnya ditolak.
    expect(screen.getByPlaceholderText('Contoh: Perbaikan mesin produksi line 2')).toHaveValue(
      'Lembur jauh hari'
    );
  });

  it('submits once all required fields are valid, and shows a pending state until the action resolves', async () => {
    let resolveAction: () => void = () => {};
    mockedCreateSubmissionAction.mockReturnValue(
      new Promise<void>((resolve) => {
        resolveAction = resolve;
      }) as unknown as ReturnType<typeof createSubmissionAction>
    );

    renderForm();

    await fillPekerjaan('Ganti oli genset');
    await selectJam('mulai', '19:00');
    await selectJam('selesai', '21:00');

    const submitButton = screen.getByRole('button', { name: /simpan pengajuan/i });
    await userEvent.click(submitButton);

    await waitFor(() => expect(submitButton).toBeDisabled());
    expect(submitButton).toHaveTextContent('Menyimpan...');
    expect(mockedCreateSubmissionAction).toHaveBeenCalledTimes(1);

    resolveAction();
    await waitFor(() => expect(submitButton).not.toBeDisabled());
  });

  it('restores an in-progress draft after the component remounts (simulating a server redirect)', async () => {
    const first = renderForm();

    await fillPekerjaan('Lembur checklist gudang');
    await selectJam('mulai', '17:00');

    // The draft is written to sessionStorage as the user types.
    await waitFor(() => expect(sessionStorage.getItem(DRAFT_KEY)).toContain('Lembur checklist gudang'));

    first.unmount();

    renderForm();

    expect(screen.getByPlaceholderText('Contoh: Perbaikan mesin produksi line 2')).toHaveValue(
      'Lembur checklist gudang'
    );
    const [jamMulaiSelect] = screen.getAllByLabelText('Jam');
    expect(within(jamMulaiSelect.closest('div')!).getByRole('combobox')).toHaveValue('17:00');
  });

  it('clears a stale draft instead of restoring it after a successful submission', async () => {
    sessionStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({
        tanggalLembur: defaultDate,
        blocks: [
          {
            id: 'blk_stale',
            people: [defaultPerson],
            pekerjaan: 'Pekerjaan lama yang seharusnya tidak muncul lagi',
            jamMulai: '08:00',
            jamSelesai: '10:00',
          },
        ],
      })
    );

    renderForm({ submittedOk: true });

    expect(screen.getByPlaceholderText('Contoh: Perbaikan mesin produksi line 2')).toHaveValue('');
    expect(sessionStorage.getItem(DRAFT_KEY)).toBeNull();
  });
});
