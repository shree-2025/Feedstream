import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, UserRole } from '../../context/AuthContext';


const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: UserRole[] }) => {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    // Redirect to signin with return url
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // User doesn't have permission, redirect to their appropriate dashboard
    const dashboardRoutes: Record<UserRole, string> = {
      MasterAdmin: "/master-admin/dashboard",
      OrganizationAdmin: "/organization-admin/dashboard", 
      DepartmentAdmin: "/department-admin/dashboard",
      Staff: "/staff/dashboard",
      Student: "/student/dashboard",
      EndUser: "/end-user/dashboard"
    };
    
    return <Navigate to={dashboardRoutes[user.role]} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
