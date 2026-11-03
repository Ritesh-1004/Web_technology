import { Routes, Route, Navigate } from 'react-router-dom';

import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';

import CitizenLayout from './layouts/CitizenLayout';
import OfficerLayout from './layouts/OfficerLayout';
import RequireRole from './components/RequireRole';

import Welcome from './pages/Welcome';
import Home from './pages/Home';
import ReportIssue from './pages/ReportIssue';
import TrackReport from './pages/TrackReport';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import NotFound from './pages/NotFound';

// Visitors first land on /login (log in or register as citizen or officer).
//   Citizen area  -> /, /report, /track, /dashboard   (citizens only)
//   Officer area  -> /officer                          (officers only)
export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Routes>
          <Route path="/login" element={<Welcome />} />

          <Route element={<RequireRole role="citizen" />}>
            <Route element={<CitizenLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/report" element={<ReportIssue />} />
              <Route path="/track" element={<TrackReport />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Route>

          <Route path="/officer" element={<RequireRole role="officer" />}>
            <Route element={<OfficerLayout />}>
              <Route index element={<AdminDashboard />} />
            </Route>
          </Route>

          {/* old addresses */}
          <Route path="/admin" element={<Navigate to="/officer" replace />} />
          <Route path="/officer/login" element={<Navigate to="/login?role=officer" replace />} />
        </Routes>
      </ToastProvider>
    </AuthProvider>
  );
}
