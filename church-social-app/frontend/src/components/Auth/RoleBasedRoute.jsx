import { Navigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { toast } from 'react-toastify';

const RoleBasedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // If no specific roles are required, allow all authenticated users
  if (!allowedRoles || allowedRoles.length === 0) {
    return children;
  }

  // Check if user's role is in the allowed roles
  if (allowedRoles.includes(user?.role)) {
    return children;
  }

  // User doesn't have permission
  toast.error('You do not have permission to access this page');
  return <Navigate to="/feed" />;
};

export default RoleBasedRoute;
