import { Link } from 'react-router-dom';

export default function Hero() {
  return (
    <section className="hero">
      <div className="container hero-grid">
        <div>
          <span className="hero-eyebrow">Citizen Garbage Reporting Portal</span>
          <h1>Report garbage. Improve your city.</h1>
          <p>
            Take a photo of a garbage problem, add its exact GPS location and get a
            complaint ID to track the report until it is resolved.
          </p>
          <div className="hero-actions">
            <Link to="/report" className="btn btn-primary">Report Garbage</Link>
            <Link to="/track" className="btn btn-outline">Track Complaint</Link>
          </div>
        </div>

        <div className="hero-panel">
          <div className="hero-panel-title">How reporting works</div>
          <ol className="hero-steps">
            <li>Add a photo. It is checked to confirm that it shows garbage.</li>
            <li>Share your GPS location, or type it.</li>
            <li>Submit and keep your complaint ID.</li>
            <li>Track the status: Pending, In Progress, Resolved.</li>
          </ol>
        </div>
      </div>
    </section>
  );
}
