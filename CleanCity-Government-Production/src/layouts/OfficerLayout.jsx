import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Layout for the officer portal. It has its own header and no citizen
// menus or bottom bar, so the two sides never mix.
export default function OfficerLayout() {
  const navigate = useNavigate();
  const { session, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login?role=officer', { replace: true });
  };

  return (
    <div className="app-shell officer-shell">
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <header className="navbar officer-navbar">
        <div className="container navbar-inner">
          <div className="brand">
            <span className="brand-mark" aria-hidden="true">CC</span>
            <span className="brand-text">
              <span className="brand-name">CleanCity Officer Portal</span>
              <span className="brand-tagline">Authorised staff only</span>
            </span>
          </div>
          <div className="officer-nav-actions">
            {session && <span className="officer-id">{session.name} ({session.identifier})</span>}
            <button type="button" className="btn btn-outline btn-sm" onClick={handleLogout}>Log out</button>
          </div>
        </div>
      </header>
      <main className="app-main" id="main-content">
        <Outlet />
      </main>
    </div>
  );
}
