import { statusMeta } from '../utils/helpers';

// Status is always shown as text (not colour alone)
export default function StatusBadge({ status }) {
  const meta = statusMeta(status);
  return <span className={`status-badge ${meta.className}`}>{status}</span>;
}
