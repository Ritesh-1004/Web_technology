import { useState } from 'react';
import StatusBadge from '../components/StatusBadge';
import StatusTracker from '../components/StatusTracker';
import LocationInfo from '../components/LocationInfo';
import { getReportByComplaintId } from '../utils/storage';
import { formatDate } from '../utils/helpers';
import { useAuth } from '../context/AuthContext';

export default function TrackReport() {
  const { session } = useAuth();
  const [complaintId, setComplaintId] = useState('');
  const [report, setReport] = useState(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    // Always read fresh data, so a status changed by the officer shows up here
    // Citizens can only look up their own reports
    const found = getReportByComplaintId(complaintId);
    setReport(found && found.userId === session.userId ? found : null);
    setSearched(true);
  };

  return (
    <div className="container">
      <div className="page-head">
        <span className="section-eyebrow">Track a report</span>
        <h1>Track Your Report</h1>
        <p>Enter the complaint ID of one of your reports (for example CC-2026-1001) to see its current status.</p>
      </div>

      <form className="track-search" onSubmit={handleSearch}>
        <label htmlFor="track-id" className="visually-hidden">Complaint ID</label>
        <input
          id="track-id"
          type="text"
          className="search-input"
          placeholder="Complaint ID, e.g. CC-2026-1001"
          value={complaintId}
          onChange={(e) => setComplaintId(e.target.value)}
        />
        <button type="submit" className="btn btn-primary">Search</button>
      </form>

      {searched && !report && (
        <div className="empty-state">
          <h3>Complaint ID not found</h3>
          <p>Check the ID and try again. Reports are stored in the browser they were submitted from.</p>
        </div>
      )}

      {report && (
        <div className="track-result">
          <div className="report-card-top">
            <h2 className="no-margin">{report.complaintId}</h2>
            <StatusBadge status={report.status} />
          </div>

          <StatusTracker status={report.status} />

          <div className="track-meta-grid">
            <div className="track-meta-item">
              <div className="label">Issue Type</div>
              <div className="value">{report.issueType}</div>
            </div>
            <div className="track-meta-item">
              <div className="label">Submitted</div>
              <div className="value">{formatDate(report.createdAt)}</div>
            </div>
            <div className="track-meta-item">
              <div className="label">Description</div>
              <div className="value">{report.description || '—'}</div>
            </div>
            <div className="track-meta-item">
              <div className="label">Location</div>
              <div className="value"><LocationInfo report={report} /></div>
            </div>
          </div>

          {report.image && <img src={report.image} alt="Reported issue" className="track-image" />}
        </div>
      )}
    </div>
  );
}
