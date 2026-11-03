import { useState } from 'react';
import StatusBadge from './StatusBadge';
import LocationInfo from './LocationInfo';
import { formatDate } from '../utils/helpers';

export default function ReportCard({ report }) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="report-card">
      <div className="report-card-top">
        <span className="report-card-id">{report.complaintId}</span>
        <StatusBadge status={report.status} />
      </div>

      <div className="report-card-meta">
        <span>{report.issueType}</span>
        <span>{report.location || 'Location not available'}</span>
        <span>{formatDate(report.createdAt)}</span>
      </div>

      <button className="btn btn-outline btn-sm" onClick={() => setShowDetails(true)}>
        View Details
      </button>

      {showDetails && (
        <div className="modal-backdrop" onClick={() => setShowDetails(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowDetails(false)} aria-label="Close details">✕</button>
            <h3>{report.complaintId}</h3>
            <StatusBadge status={report.status} />
            {report.image && <img src={report.image} alt="Reported issue" className="modal-image" />}
            <div className="modal-details">
              <p><strong>Issue type:</strong> {report.issueType}</p>
              <p><strong>Description:</strong> {report.description || '—'}</p>
              <p><strong>Submitted:</strong> {formatDate(report.createdAt)}</p>
              <div><strong>Location:</strong><LocationInfo report={report} /></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
