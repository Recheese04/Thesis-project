import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import Login from './pages/auth/LoginPage';
import LandingPage from './pages/LandingPage';
import Chatbot from './components/Chatbot';
import { SchoolYearProvider } from './context/SchoolYearContext';

// Admin
import AdminLayout from './components/layout/AdminLayout';
import Dashboard from './pages/dashboards/admin/Dashboard';
import UserManagement from './pages/dashboards/admin/UserManagement';
import SchoolYearManagement from "./pages/dashboards/admin/SchoolYearManagement";
import CollegeManagement from './pages/dashboards/admin/CollegeManagement';
import OrganizationManagement from './pages/dashboards/admin/OrganizationManagement';
import EventManagement from './pages/dashboards/admin/EventManagement';
import Settings from './pages/dashboards/admin/Settings';
import AttendanceManagement from './pages/dashboards/admin/AttendanceManagement';

// Student
import StudentLayout from './components/layout/StudentLayout';
import StudentDashboard from './pages/dashboards/student/StudentDashboard';
import StudentCheckIn from './pages/dashboards/student/StudentCheckin';
import StudentEvents from './pages/dashboards/student/StudentEvents';
import StudentAttendance from './pages/dashboards/student/StudentAttendance';
import StudentAnnouncements from './pages/dashboards/student/StudentAnnouncements';
import StudentMessages from './pages/dashboards/student/StudentMessages';

import StudentObligations from './pages/dashboards/student/StudentObligations';
import StudentEvaluations from './pages/dashboards/student/StudentEvaluations';
import StudentProfile from './pages/dashboards/student/StudentProfile';

// Officer
import OfficerLayout from './components/layout/OfficerLayout';
import OfficerDashboard from './pages/dashboards/officer/OfficerDashboard';
import OfficerMembers from './pages/dashboards/officer/OfficerMembers';
import OfficerEvents from './pages/dashboards/officer/OfficerEvents';
import OfficerAttendance from './pages/dashboards/officer/OfficerAttendance';
import OfficerAnnouncements from './pages/dashboards/officer/OfficerAnnouncements';
import OfficerMessages from './pages/dashboards/officer/OfficerMessages';
import OfficerEvaluations from './pages/dashboards/officer/OfficerEvaluations';
import OfficerConsequenceRules from './pages/dashboards/officer/OfficerConsequenceRules';
import OfficerFinance from './pages/dashboards/officer/OfficerFinance';
import OfficerMinutes from './pages/dashboards/officer/OfficerMinutes';
import OfficerAdviserDashboard from './pages/dashboards/officer/OfficerAdviserDashboard';
import OfficerDocuments from './pages/dashboards/officer/OfficerDocuments';
import RfidScanner from './pages/dashboards/officer/RfidScanner';

function getUserRole() {
  return localStorage.getItem('user_role') || null;
}

function ProtectedRoute({ children, allowedRoles = [] }) {
  const token = localStorage.getItem('token');
  const userRole = getUserRole();
  if (!token) return <Navigate to="/login" replace />;
  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    if (userRole === 'admin') return <Navigate to="/admin/dashboard" replace />;
    if (userRole === 'officer') return <Navigate to="/officer/dashboard" replace />;
    return <Navigate to="/student/dashboard" replace />;
  }
  return children;
}

function PublicRoute({ children }) {
  // Always show the login page when explicitly navigated to —
  // the login handler itself redirects after a successful sign-in.
  return children;
}

function App() {
  return (
    <Router>
      <SchoolYearProvider>
        <Routes>


        <Route path="/" element={<LandingPage />} />


        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />


        <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="users" element={<UserManagement />} />
            <Route path="school-years" element={<SchoolYearManagement />} />
            <Route path="colleges" element={<CollegeManagement />} />
          <Route path="organizations" element={<OrganizationManagement />} />
          <Route path="events" element={<EventManagement />} />
          <Route path="attendance" element={<AttendanceManagement />} />
          <Route path="settings" element={<Settings />} />
        </Route>


        <Route path="/officer" element={<ProtectedRoute allowedRoles={['officer']}><OfficerLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/officer/dashboard" replace />} />
          <Route path="dashboard" element={<OfficerDashboard />} />
          <Route path="members" element={<OfficerMembers />} />
          <Route path="events" element={<OfficerEvents />} />
          <Route path="attendance" element={<OfficerAttendance />} />

          <Route path="announcements" element={<OfficerAnnouncements />} />
          <Route path="messages" element={<OfficerMessages />} />
          <Route path="evaluations" element={<OfficerEvaluations />} />


          <Route path="consequence-rules" element={<OfficerConsequenceRules />} />

          <Route path="checkin" element={<StudentCheckIn />} />
          <Route path="my-events" element={<StudentEvents />} />
          <Route path="my-attendance" element={<StudentAttendance />} />

          <Route path="documents" element={<OfficerDocuments />} />
          <Route path="obligations" element={<StudentObligations />} />

          <Route path="finance" element={<OfficerFinance />} />
          <Route path="minutes" element={<OfficerMinutes />} />
          <Route path="adviser-overview" element={<OfficerAdviserDashboard />} />
          <Route path="rfid-scanner" element={<RfidScanner />} />
        </Route>


        <Route path="/student" element={<ProtectedRoute allowedRoles={['student', 'member', 'officer']}><StudentLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/student/dashboard" replace />} />
          <Route path="dashboard" element={<StudentDashboard />} />
          <Route path="checkin" element={<StudentCheckIn />} />
          <Route path="events" element={<StudentEvents />} />
          <Route path="attendance" element={<StudentAttendance />} />

          <Route path="announcements" element={<StudentAnnouncements />} />
          <Route path="messages" element={<StudentMessages />} />

          <Route path="obligations" element={<StudentObligations />} />
          <Route path="evaluations" element={<StudentEvaluations />} />
          <Route path="profile" element={<StudentProfile />} />
        </Route>


        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
      <Toaster position="top-center" richColors />
      <Chatbot />
      </SchoolYearProvider>
    </Router>
  );
}

export default App;
