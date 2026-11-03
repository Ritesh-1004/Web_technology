import { useEffect, useMemo, useState } from 'react';
import DashboardStats from '../components/DashboardStats';
import SearchBar from '../components/SearchBar';
import FilterBar from '../components/FilterBar';
import AdminReportTable from '../components/AdminReportTable';
import { getReports, getReportStats, filterReports, updateReportStatus, deleteReports } from '../utils/storage';
import { useToast } from '../context/ToastContext';

export default function AdminDashboard() {
  const [reports, setReports] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [error, setError] = useState('');
  const [pendingDelete, setPendingDelete] = useState(null); // { ids, label }
  const { showToast } = useToast();

  useEffect(() => {
    setReports(getReports());
  }, []);

  const stats = useMemo(() => getReportStats(reports), [reports]);

  // Category list is built from the reports that actually exist
  const categories = useMemo(
    () => [...new Set(reports.map((r) => r.issueType))].sort(),
    [reports]
  );

  const visibleReports = useMemo(
    () => filterReports(reports, { search, status: statusFilter, category: categoryFilter }),
    [reports, search, statusFilter, categoryFilter]
  );

  // Save the new status, then re-read all reports so the table, the stat
  // cards and the Track page all use the same saved data.
  const handleStatusChange = (complaintId, newStatus) => {
    const saved = updateReportStatus(complaintId, newStatus);
    setReports(getReports());
    if (saved.ok) {
      setError('');
      showToast(`Status updated to "${newStatus}".`, 'success');
    } else {
      setError(saved.error);
      showToast('Status could not be saved.', 'error');
    }
  };

  const askDeleteOne = (report) =>
    setPendingDelete({ ids: [report.complaintId], label: `report ${report.complaintId}` });

  const askDeleteShown = () =>
    setPendingDelete({
      ids: visibleReports.map((r) => r.complaintId),
      label: `${visibleReports.length} report${visibleReports.length === 1 ? '' : 's'} currently shown`
    });

  const confirmDelete = () => {
    const res = deleteReports(pendingDelete.ids);
    setReports(getReports());
    setPendingDelete(null);
    if (res.ok) {
      setError('');
      showToast(`${res.removed} report${res.removed === 1 ? '' : 's'} deleted.`, 'success');
    } else {
      setError(res.error);
      showToast('Report could not be deleted.', 'error');
    }
  };

  return (
    <div className="container">
      <div className="page-head">
        <span className="section-eyebrow">Officer</span>
        <h1>Officer Dashboard</h1>
        <p>Review reports, open their location on a map and update their status.</p>
      </div>

      <div className="section">
        <div className="demo-banner">
          Prototype notice: reports are stored in this browser only (localStorage) and the officer login is checked in the browser, not on a server.
          Officers on other devices cannot see these reports until a real backend is added.
        </div>

        <DashboardStats stats={stats} />

        <div className="toolbar">
          <SearchBar value={search} onChange={setSearch} placeholder="Search by report ID, category or location" />
          <label className="visually-hidden" htmlFor="category-filter">Filter by category</label>
          <select id="category-filter" className="category-select" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="All">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <FilterBar active={statusFilter} onChange={setStatusFilter} />
        </div>

        {error && <div className="form-error" role="alert">{error}</div>}

        {visibleReports.length > 0 && (
          <div className="bulk-actions">
            <button type="button" className="btn btn-danger-outline btn-sm" onClick={askDeleteShown}>
              Delete all shown ({visibleReports.length})
            </button>
            <span className="muted">Tip: use the search or status filter first to choose which reports to delete.</span>
          </div>
        )}

        <AdminReportTable reports={visibleReports} onStatusChange={handleStatusChange} onDelete={askDeleteOne} />

        {pendingDelete && (
          <div className="modal-backdrop" onClick={() => setPendingDelete(null)}>
            <div className="modal-box confirm-box" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" onClick={(e) => e.stopPropagation()}>
              <h3 id="confirm-title">Delete permanently?</h3>
              <p>
                You are about to delete {pendingDelete.label}. This cannot be undone, and the
                report(s) will also disappear from the citizen Track and Dashboard pages.
              </p>
              <div className="confirm-actions">
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setPendingDelete(null)}>Cancel</button>
                <button type="button" className="btn btn-primary btn-sm danger-solid" onClick={confirmDelete}>Yes, delete</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
