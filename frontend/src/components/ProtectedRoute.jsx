import { Navigate, Outlet } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import useUserStore from '../stores/useUserStore';

const ProtectedRoute = () => {
  const { user, checkingAuth } = useUserStore();


  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
      </div>
    );
  }


  if (!user) {
    return <Navigate to="/login" replace />;
  }


  return <Outlet />;
};

export default ProtectedRoute;