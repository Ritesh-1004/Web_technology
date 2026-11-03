import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import BottomNav from '../components/BottomNav';

// Layout for the public / citizen side of the site.
// It has NO link to the officer portal in its menus.
export default function CitizenLayout() {
  return (
    <div className="app-shell">
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <Navbar />
      <main className="app-main" id="main-content">
        <Outlet />
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
}
