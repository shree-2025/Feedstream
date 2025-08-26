import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import NotFound from "./pages/OtherPage/NotFound";
import AppLayout from "./layout/AppLayout";
import ProtectedRoute from "./components/auth/ProtectedRoute";

// Department Admin Dashboard & Pages
import DepartmentAdminDashboard from "./pages/department-admin/DepartmentAdminDashboard";
import QuestionBank from "./pages/department-admin/QuestionBank";
import Subjects from "./pages/department-admin/Subjects";
import FeedbackGeneration from "./pages/department-admin/FeedbackGeneration";
import FeedbackReport from "./pages/department-admin/FeedbackReport";
import FeedbackAnalytics from "./pages/department-admin/FeedbackAnalytics";
import StaffManagement from "./pages/department-admin/StaffManagement";
import DeptAdminAnnouncements from "./pages/department-admin/Announcements";
import SubmitActivity from "./pages/department-admin/SubmitActivity";
import Profile from "./pages/Profile";
import FeedbackForm from "./pages/feedback/FeedbackForm";
import FeedbackResponses from "./pages/department-admin/FeedbackResponses";
import ThankYou from "./pages/feedback/ThankYou";

import { ScrollToTop } from "./components/common/ScrollToTop";
import { UserProvider } from "./context/UserContext";
import { LogProvider } from "./context/LogContext";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { Toaster } from 'react-hot-toast';

export default function App() {
  return (
    <>
      <Toaster position="top-right" reverseOrder={false} containerStyle={{ zIndex: 9999 }} />
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
                {/* Public feedback form route by slug */}
                <Route path="/feedback/:slug" element={<FeedbackForm />} />
                <Route path="/feedback/:slug/thank-you" element={<ThankYou />} />

                {/* Protected Routes Layout */}
                <Route element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }>
                  {/* Redirect from root to department admin dashboard */}
                  <Route index path="/" element={<Navigate to="/department-admin/dashboard" replace />} />
                  <Route path="/dashboard" element={<Navigate to="/department-admin/dashboard" replace />} />

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
                  <Route path="/department-admin/feedback-responses" element={
                    <ProtectedRoute allowedRoles={['DepartmentAdmin']}>
                      <FeedbackResponses />
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
                  {/* Profile */}
                  <Route path="/profile" element={
                    <ProtectedRoute>
                      <Profile />
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
