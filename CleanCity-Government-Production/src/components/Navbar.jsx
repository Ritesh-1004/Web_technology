import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Top navigation. On small screens the links move into a menu opened by
// the hamburger button.
const LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/report', label: 'Report Garbage' },
  { to: '/track', label: 'Track Report' },
  { to: '/dashboard', label: 'My Dashboard' }
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { session, logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = () => {
    setMenuOpen(false);
    logout();
    navigate('/login', { replace: true });
  };
  const linkClass = ({ isActive }) => `nav-link${isActive ? ' active' : ''}`;

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <NavLink to="/" className="brand" onClick={() => setMenuOpen(false)}>
          <span className="brand-mark" aria-hidden="true">CC</span>
          <span className="brand-text">
            <span className="brand-name">CleanCity</span>
            <span className="brand-tagline">Smart Waste Management</span>
          </span>
        </NavLink>

        <nav className="nav-links" aria-label="Main">
          {LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end} className={linkClass}>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="nav-user">
          {session && <span className="nav-user-name">Hi, {session.name.split(' ')[0]}</span>}
          <button type="button" className="btn btn-outline btn-sm" onClick={handleLogout}>Log out</button>
        </div>

        <button
          className="hamburger"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label="Toggle navigation menu"
          aria-expanded={menuOpen}
        >
          {menuOpen ? '✕' : '☰'}
        </button>
      </div>

      <div className={`mobile-menu container${menuOpen ? ' open' : ''}`}>
        {LINKS.map((link) => (
          <NavLink key={link.to} to={link.to} end={link.end} className={linkClass} onClick={() => setMenuOpen(false)}>
            {link.label}
          </NavLink>
        ))}
        <button type="button" className="nav-link mobile-logout" onClick={handleLogout}>Log out</button>
      </div>
    </header>
  );
}
