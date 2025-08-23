import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import NotFound from "./pages/OtherPage/NotFound";
import AppLayout from "./layout/AppLayout";
import ProtectedRoute from "./components/auth/ProtectedRoute";

// Role-Based Dashboards
import MasterAdminDashboard from "./pages/master-admin/MasterAdminDashboard";
import OrganizationAdminDashboard from "./pages/organization-admin/OrganizationAdminDashboard";
import StaffDashboard from "./pages/staff/StaffDashboard";
import StudentDashboard from "./pages/student/StudentDashboard";
import DepartmentAdminDashboard from "./pages/department-admin/DepartmentAdminDashboard";
import QuestionBank from "./pages/department-admin/QuestionBank";
import Subjects from "./pages/department-admin/Subjects";
import FeedbackGeneration from "./pages/department-admin/FeedbackGeneration";
import FeedbackReport from "./pages/department-admin/FeedbackReport";
import FeedbackAnalytics from "./pages/department-admin/FeedbackAnalytics";

// Management Pages
import OrganizationManagement from "./pages/master-admin/OrganizationManagement";
import DepartmentManagement from "./pages/organization-admin/DepartmentManagement";
import StaffManagement from "./pages/department-admin/StaffManagement";
import DeptAdminAnnouncements from "./pages/department-admin/Announcements";
import SubmitActivity from "./pages/department-admin/SubmitActivity";
import StudentManagement from "./pages/staff/StudentManagement";
import StudentSubmitActivity from "./pages/student/SubmitActivity";
import ManageActivities from "./pages/student/ManageActivities";
import ViewStudentLogs from "./pages/staff/ViewStudentLogs";
import SubmitStaffActivity from "./pages/staff/SubmitStaffActivity";
import ManageAnnouncements from "./pages/staff/ManageAnnouncements";
import Settings from "./pages/Settings";
import AccountSettings from "./pages/account/AccountSettings";

import { ScrollToTop } from "./components/common/ScrollToTop";
import { UserProvider } from "./context/UserContext";
import { LogProvider } from "./context/LogContext";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { Toaster } from 'react-hot-toast';

export default function App() {
  return (
    <>
      <Toaster position="top-right" reverseOrder={false} />
      <ThemeProvider>
        <AuthProvider>
        <UserProvider>
          <LogProvider>
            <Router>
              <ScrollToTop />
              <Routes>
                {/* Public Routes */}
                <Route path="/signin" element={<SignIn />} />
                <Route path="/signup" element={<SignUp />} />

                {/* Protected Routes Layout */}
                <Route element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }>
                  {/* Redirect from root based on user role */}
                  <Route index path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<Navigate to="/student/dashboard" replace />} />

                  {/* Master Admin Routes */}
                  <Route path="/master-admin/dashboard" element={
                    <ProtectedRoute allowedRoles={['MasterAdmin']}>
                      <MasterAdminDashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="/master-admin/organizations" element={
                    <ProtectedRoute allowedRoles={['MasterAdmin']}>
                      <OrganizationManagement />
                    </ProtectedRoute>
                  } />

                  {/* Organization Admin Routes */}
                  <Route path="/organization-admin/dashboard" element={
                    <ProtectedRoute allowedRoles={['OrganizationAdmin']}>
                      <OrganizationAdminDashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="/organization-admin/departments" element={
                    <ProtectedRoute allowedRoles={['OrganizationAdmin']}>
                      <DepartmentManagement />
                    </ProtectedRoute>
                  } />

                  {/* Department Admin Routes */}
                  <Route path="/department-admin/dashboard" element={
                    <ProtectedRoute allowedRoles={['DepartmentAdmin']}>
                      <DepartmentAdminDashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="/department-admin/staff" element={
                    <ProtectedRoute allowedRoles={['DepartmentAdmin']}>
                      <StaffManagement />
                    </ProtectedRoute>
                  } />
                  <Route path="/department-admin/announcements" element={
                    <ProtectedRoute allowedRoles={['DepartmentAdmin']}>
                      <DeptAdminAnnouncements />
                    </ProtectedRoute>
                  } />
                  <Route path="/department-admin/submit-activity" element={
                    <ProtectedRoute allowedRoles={['DepartmentAdmin']}>
                      <SubmitActivity />
                    </ProtectedRoute>
                  } />
                  <Route path="/department-admin/question-bank" element={
                    <ProtectedRoute allowedRoles={['DepartmentAdmin']}>
                      <QuestionBank />
                    </ProtectedRoute>
                  } />
                  <Route path="/department-admin/subjects" element={
                    <ProtectedRoute allowedRoles={['DepartmentAdmin']}>
                      <Subjects />
                    </ProtectedRoute>
                  } />
                  <Route path="/department-admin/feedback-generation" element={
                    <ProtectedRoute allowedRoles={['DepartmentAdmin']}>
                      <FeedbackGeneration />
                    </ProtectedRoute>
                  } />
                  <Route path="/department-admin/feedback-report" element={
                    <ProtectedRoute allowedRoles={['DepartmentAdmin']}>
                      <FeedbackReport />
                    </ProtectedRoute>
                  } />
                  <Route path="/department-admin/feedback-analytics" element={
                    <ProtectedRoute allowedRoles={['DepartmentAdmin']}>
                      <FeedbackAnalytics />
                    </ProtectedRoute>
                  } />

                  {/* Staff Routes */}
                  <Route path="/staff/dashboard" element={
                    <ProtectedRoute allowedRoles={['Staff']}>
                      <StaffDashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="/staff/student-management" element={
                    <ProtectedRoute allowedRoles={['Staff']}>
                      <StudentManagement />
                    </ProtectedRoute>
                  } />
                  <Route path="/staff/student-logs" element={
                    <ProtectedRoute allowedRoles={['Staff']}>
                      <ViewStudentLogs />
                    </ProtectedRoute>
                  } />
                  <Route path="/staff/submit-activity" element={
                    <ProtectedRoute allowedRoles={['Staff']}>
                      <SubmitStaffActivity />
                    </ProtectedRoute>
                  } />
                  <Route path="/staff/announcements" element={
                    <ProtectedRoute allowedRoles={['Staff']}>
                      <ManageAnnouncements />
                    </ProtectedRoute>
                  } />

                  {/* Student Routes */}
                  <Route path="/student/dashboard" element={
                    <ProtectedRoute allowedRoles={['Student']}>
                      <StudentDashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="/student/submit-activity" element={
                    <ProtectedRoute allowedRoles={['Student']}>
                      <StudentSubmitActivity />
                    </ProtectedRoute>
                  } />
                  <Route path="/student/manage-activities" element={
                    <ProtectedRoute allowedRoles={['Student']}>
                      <ManageActivities />
                    </ProtectedRoute>
                  } />

                  {/* General Routes - Available to all authenticated users */}
                  <Route path="/settings" element={
                    <ProtectedRoute>
                      <Settings />
                    </ProtectedRoute>
                  } />
                  <Route path="/account" element={
                    <ProtectedRoute allowedRoles={['MasterAdmin', 'OrganizationAdmin', 'DepartmentAdmin', 'Staff', 'Student']}>
                      <AccountSettings />
                    </ProtectedRoute>
                  } />
                </Route>
                
                {/* Fallback Routes */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Router>
          </LogProvider>
        </UserProvider>
      </AuthProvider>
      </ThemeProvider>
    </>
  );
}
