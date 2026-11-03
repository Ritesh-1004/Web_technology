import { NavLink } from 'react-router-dom';

// Bottom navigation bar, shown only on small (phone) screens.
const ITEMS = [
  { to: '/', label: 'Home', icon: '⌂', end: true },
  { to: '/track', label: 'Track', icon: '⌕' },
  { to: '/report', label: 'Report', icon: '+', primary: true },
  { to: '/dashboard', label: 'My Reports', icon: '▤' }
];

export default function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Primary">
      {ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            `bottom-nav-item${item.primary ? ' primary' : ''}${isActive ? ' active' : ''}`
          }
        >
          <span className="bottom-nav-icon" aria-hidden="true">{item.icon}</span>
          <span className="bottom-nav-label">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
