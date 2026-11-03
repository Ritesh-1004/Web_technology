export default function StatsCard({ label, value, variant = '' }) {
  return (
    <div className={`stat-card ${variant}`}>
      <div className="stat-number">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}
