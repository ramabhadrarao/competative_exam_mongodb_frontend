import React, { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from './Sidebar';
import Header from './Header';
import Loading from '../UI/Loading';

interface LayoutProps {
  children: ReactNode;
  requireAuth?: boolean;
  allowedRoles?: ('student' | 'teacher' | 'admin')[];
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  requireAuth = true, 
  allowedRoles = ['student', 'teacher', 'admin'] 
}) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loading />;
  }

  if (requireAuth && !user) {
    return <Navigate to="/login" replace />;
  }

  if (user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  if (!requireAuth) {
    return <div className="min-h-screen bg-gray-50">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;