import { useEffect, useMemo, useState } from 'react';
import DashboardStats from '../components/DashboardStats';
import SearchBar from '../components/SearchBar';
import FilterBar from '../components/FilterBar';
import ReportCard from '../components/ReportCard';
import { getReports, getReportStats, filterReports } from '../utils/storage';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { session } = useAuth();
  const [reports, setReports] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    // A citizen only ever sees the reports submitted from their own account
    setReports(getReports().filter((r) => r.userId === session.userId));
  }, [session.userId]);

  const stats = useMemo(() => getReportStats(reports), [reports]);
  const visibleReports = useMemo(
    () => filterReports(reports, { search, status: statusFilter }),
    [reports, search, statusFilter]
  );

  return (
    <div className="container">
      <div className="page-head">
        <span className="section-eyebrow">Your reports</span>
        <h1>My Dashboard</h1>
        <p>All garbage reports you submitted with this account, with their current status.</p>
      </div>

      <div className="section">
        <DashboardStats stats={stats} />

        <div className="toolbar">
          <SearchBar value={search} onChange={setSearch} />
          <FilterBar active={statusFilter} onChange={setStatusFilter} />
        </div>

        {visibleReports.length === 0 ? (
          <div className="empty-state">
            <h3>No reports to show</h3>
            <p>Reports you submit will appear here.</p>
          </div>
        ) : (
          <div className="report-list-grid">
            {visibleReports.map((r) => (
              <ReportCard key={r.id} report={r} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
