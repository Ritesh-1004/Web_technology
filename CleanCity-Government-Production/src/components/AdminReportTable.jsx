import { useState } from 'react';
import StatusBadge from './StatusBadge';
import LocationInfo from './LocationInfo';
import { STATUSES } from '../utils/storage';
import { formatDate } from '../utils/helpers';

// Table of reports for officers. On small screens each row turns into a
// card (see .admin-table in components.css), using the data-label text.
export default function AdminReportTable({ reports, onStatusChange, onDelete }) {
  const [previewImage, setPreviewImage] = useState(null);

  if (reports.length === 0) {
    return (
      <div className="empty-state">
        <h3>No reports to show</h3>
        <p>No report matches this search or filter, or no report has been submitted yet.</p>
      </div>
    );
  }

  return (
    <>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Photo</th>
              <th>Report ID</th>
              <th>Category</th>
              <th>Submitted</th>
              <th>Location</th>
              <th>Status</th>
              <th>Update Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((r) => (
              <tr key={r.id}>
                <td data-label="Photo">
                  {r.image ? (
                    <button type="button" className="thumb-button" onClick={() => setPreviewImage(r.image)} aria-label={`View photo for ${r.complaintId}`}>
                      <img src={r.image} alt="" className="thumb" />
                    </button>
                  ) : (
                    <span className="muted">No photo</span>
                  )}
                </td>
                <td data-label="Report ID"><strong>{r.complaintId}</strong></td>
                <td data-label="Category">{r.issueType}</td>
                <td data-label="Submitted">{formatDate(r.createdAt)}</td>
                <td data-label="Location"><LocationInfo report={r} /></td>
                <td data-label="Status"><StatusBadge status={r.status} /></td>
                <td data-label="Update Status">
                  <select
                    value={r.status}
                    aria-label={`Update status of ${r.complaintId}`}
                    onChange={(e) => onStatusChange(r.complaintId, e.target.value)}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </td>
                <td data-label="Action">
                  <button
                    type="button"
                    className="btn btn-danger-outline btn-sm"
                    onClick={() => onDelete(r)}
                    aria-label={`Delete report ${r.complaintId}`}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {previewImage && (
        <div className="modal-backdrop" onClick={() => setPreviewImage(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setPreviewImage(null)} aria-label="Close photo">✕</button>
            <img src={previewImage} alt="Full size report" className="modal-image" />
          </div>
        </div>
      )}
    </>
  );
}
