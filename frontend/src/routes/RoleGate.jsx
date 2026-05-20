import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { selectAuthUser } from '@/features/auth/authSlice.js';

export default function RoleGate({ allow = [], children, fallback = null, redirectTo = '/' }) {
  const user = useSelector(selectAuthUser);
  if (!user) return null;
  if (!allow.includes(user.role)) {
    if (fallback !== null) return fallback;
    return <Navigate to={redirectTo} replace />;
  }
  return children;
}
