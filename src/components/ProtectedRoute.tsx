import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = () => {
  const { user, loading } = useAuth();

  // Show a loading indicator while session is being checked
  if (loading) {
    return <div>Loading...</div>;
  }

  // If user is logged in, show the nested page content
  // Otherwise, redirect to the login page
  return user ? <Outlet /> : <Navigate to="/login" />;
};

export default ProtectedRoute;