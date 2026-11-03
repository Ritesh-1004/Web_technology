import { Link } from 'react-router-dom';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <h4>CleanCity</h4>
            <p>
              A citizen portal for reporting garbage with a photo and an exact
              GPS location, and for tracking each report until it is resolved.
            </p>
          </div>
          <div>
            <h4>Quick Links</h4>
            <ul className="footer-links">
              <li><Link to="/">Home</Link></li>
              <li><Link to="/report">Report Garbage</Link></li>
              <li><Link to="/track">Track Report</Link></li>
              <li><Link to="/dashboard">My Dashboard</Link></li>
            </ul>
          </div>
          <div>
            <h4>About &amp; Contact</h4>
            <p>
              CleanCity is a college project prototype and is not operated by any
              government body. Built with React, an in-browser image model and
              the Geolocation API.
            </p>
                      </div>
        </div>
        <div className="footer-bottom">
          <span>© {year} CleanCity. All rights reserved.</span>
          <span>Smart Waste Management</span>
        </div>
      </div>
    </footer>
  );
}
