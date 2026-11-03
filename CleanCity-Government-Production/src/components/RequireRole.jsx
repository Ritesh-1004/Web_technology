import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { homeFor } from '../utils/auth';

// Route guard.
//  - not signed in            -> login / register page
//  - signed in as other role  -> that person's own home (citizens never see
//                                officer pages, officers never see citizen pages)
export default function RequireRole({ role }) {
  const { session } = useAuth();
  if (!session) return <Navigate to="/login" replace />;
  if (session.role !== role) return <Navigate to={homeFor(session.role)} replace />;
  return <Outlet />;
}
