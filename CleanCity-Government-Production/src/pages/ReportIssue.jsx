import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ReportForm from '../components/ReportForm';
import LocationInfo from '../components/LocationInfo';
import { preloadModel } from '../services/imageValidator';

export default function ReportIssue() {
  const [submittedReport, setSubmittedReport] = useState(null);

  // Warm up the garbage-detection model while the user fills the form
  useEffect(() => {
    preloadModel();
  }, []);

  if (submittedReport) {
    return (
      <div className="container">
        <div className="success-box">
          <div className="success-icon" aria-hidden="true">✓</div>
          <h2>Report submitted</h2>
          <p>
            Thank you, {submittedReport.name}. Your report was saved in this browser with the status{' '}
            <strong>Pending</strong>. Keep your complaint ID to track it.
          </p>
          <div className="success-id" data-testid="complaint-id">{submittedReport.complaintId}</div>
          <div className="success-location">
            <LocationInfo report={submittedReport} />
          </div>
          <div className="success-actions">
            <Link to="/track" className="btn btn-primary">Track This Report</Link>
            <button className="btn btn-outline" onClick={() => setSubmittedReport(null)}>Report Another Issue</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="page-head">
        <span className="section-eyebrow">New report</span>
        <h1>Report a Garbage Issue</h1>
        <p>Add a clear photo, your location and a short description. The photo is checked to make sure it shows garbage.</p>
      </div>

      <div className="section report-layout">
        <ReportForm onSubmitted={setSubmittedReport} />

        <aside className="report-tips">
          <h3>Tips for a good report</h3>
          <ul>
            <li>Take the photo in daylight, close enough to see the garbage clearly.</li>
            <li>Press "Use My Current Location" while you are standing at the spot.</li>
            <li>Mention the size and any hazards in the description.</li>
            <li>Report each place separately.</li>
          </ul>
        </aside>
      </div>
    </div>
  );
}
