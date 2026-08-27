import { CheckCircle2, Clock, XCircle } from 'lucide-react';

export type SubmissionStatus = 'pending' | 'approved' | 'rejected';

const CONFIG: Record<SubmissionStatus, { label: string; className: string; Icon: typeof Clock }> = {
  pending: { label: 'Menunggu', className: 'badge-pending', Icon: Clock },
  approved: { label: 'Disetujui', className: 'badge-approved', Icon: CheckCircle2 },
  rejected: { label: 'Ditolak', className: 'badge-rejected', Icon: XCircle },
};

export default function StatusBadge({ status }: { status: string }) {
  const config = CONFIG[status as SubmissionStatus] ?? CONFIG.pending;
  const { label, className, Icon } = config;
  return (
    <span className={className}>
      <Icon size={12} />
      {label}
    </span>
  );
}
