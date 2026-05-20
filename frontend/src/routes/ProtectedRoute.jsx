import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useMeQuery } from '@/features/auth/authApi.js';
import { Skeleton } from '@/components/ui/Skeleton.jsx';

export default function ProtectedRoute() {
  const location = useLocation();
  const { data, isLoading, isError } = useMeQuery();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="w-full max-w-sm space-y-3 px-6">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    );
  }

  if (isError || !data?.data?.user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
