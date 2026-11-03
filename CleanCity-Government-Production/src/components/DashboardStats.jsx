import StatsCard from './StatsCard';

export default function DashboardStats({ stats }) {
  return (
    <div className="card-grid dashboard-stats">
      <StatsCard label="Total Reports" value={stats.total} />
      <StatsCard label="Pending" value={stats.pending} variant="pending" />
      <StatsCard label="In Progress" value={stats.inProgress} variant="progress" />
      <StatsCard label="Resolved" value={stats.resolved} variant="resolved" />
    </div>
  );
}
