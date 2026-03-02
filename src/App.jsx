import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import Login from './pages/auth/LoginPage';
import LandingPage from './pages/LandingPage';
import Chatbot from './components/Chatbot';

// Admin
import AdminLayout from './components/layout/AdminLayout';
import Dashboard from './pages/dashboards/admin/Dashboard';
import UserManagement from './pages/dashboards/admin/UserManagement';
import DepartmentManagement from './pages/dashboards/admin/DepartmentManagement';
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
import StudentClearance from './pages/dashboards/student/StudentClearance';
import StudentAnnouncements from './pages/dashboards/student/StudentAnnouncements';
import StudentMessages from './pages/dashboards/student/StudentMessages';
import StudentDocuments from './pages/dashboards/student/StudentDocuments';
import StudentObligations from './pages/dashboards/student/StudentObligations';
import StudentEvaluations from './pages/dashboards/student/StudentEvaluations';
import StudentProfile from './pages/dashboards/student/StudentProfile';

// Officer
import OfficerLayout from './components/layout/OfficerLayout';
import OfficerDashboard from './pages/dashboards/officer/OfficerDashboard';
import OfficerMembers from './pages/dashboards/officer/OfficerMembers';
import OfficerEvents from './pages/dashboards/officer/OfficerEvents';
import OfficerAttendance from './pages/dashboards/officer/OfficerAttendance';
import OfficerTasks from './pages/dashboards/officer/OfficerTasks';
import OfficerAnnouncements from './pages/dashboards/officer/OfficerAnnouncements';
import OfficerMessages from './pages/dashboards/officer/OfficerMessages';
import OfficerEvaluations from './pages/dashboards/officer/OfficerEvaluations';
import OfficerClearance from './pages/dashboards/officer/OfficerClearance';
import OfficerConsequenceRules from './pages/dashboards/officer/OfficerConsequenceRules';
import OfficerFinance from './pages/dashboards/officer/OfficerFinance';
import OfficerMinutes from './pages/dashboards/officer/OfficerMinutes';
import OfficerAdviserDashboard from './pages/dashboards/officer/OfficerAdviserDashboard';

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
  const token = localStorage.getItem('token');
  const userRole = getUserRole();
  if (token) {
    if (userRole === 'admin') return <Navigate to="/admin/dashboard" replace />;
    if (userRole === 'officer') return <Navigate to="/officer/dashboard" replace />;
    return <Navigate to="/student/dashboard" replace />;
  }
  return children;
}

function App() {
  return (
    <Router>
      <Routes>

        {/* ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ Landing ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ */}
        <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} />

        {/* ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ Login ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ */}
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />

        {/* ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ Admin ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ */}
        <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="departments" element={<DepartmentManagement />} />
          <Route path="organizations" element={<OrganizationManagement />} />
          <Route path="events" element={<EventManagement />} />
          <Route path="attendance" element={<AttendanceManagement />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ Officer ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ */}
        <Route path="/officer" element={<ProtectedRoute allowedRoles={['officer']}><OfficerLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/officer/dashboard" replace />} />
          <Route path="dashboard" element={<OfficerDashboard />} />
          <Route path="members" element={<OfficerMembers />} />
          <Route path="events" element={<OfficerEvents />} />
          <Route path="attendance" element={<OfficerAttendance />} />
          <Route path="tasks" element={<OfficerTasks />} />
          <Route path="announcements" element={<OfficerAnnouncements />} />
          <Route path="messages" element={<OfficerMessages />} />
          <Route path="evaluations" element={<OfficerEvaluations />} />
          {/* ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ NEW: Clearance management ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ */}
          <Route path="clearance" element={<OfficerClearance />} />
          <Route path="consequence-rules" element={<OfficerConsequenceRules />} />
          {/* ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ Officer's own student pages ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ */}
          <Route path="checkin" element={<StudentCheckIn />} />
          <Route path="my-events" element={<StudentEvents />} />
          <Route path="my-attendance" element={<StudentAttendance />} />
          <Route path="my-clearance" element={<StudentClearance />} />  {/* officer's OWN clearance status */}
          <Route path="documents" element={<StudentDocuments />} />
          <Route path="obligations" element={<StudentObligations />} />
          {/* ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ Position-specific pages ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ */}
          <Route path="finance" element={<OfficerFinance />} />
          <Route path="minutes" element={<OfficerMinutes />} />
          <Route path="adviser-overview" element={<OfficerAdviserDashboard />} />
        </Route>

        {/* ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ Student / Member ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ */}
        <Route path="/student" element={<ProtectedRoute allowedRoles={['student', 'member', 'officer']}><StudentLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/student/dashboard" replace />} />
          <Route path="dashboard" element={<StudentDashboard />} />
          <Route path="checkin" element={<StudentCheckIn />} />
          <Route path="events" element={<StudentEvents />} />
          <Route path="attendance" element={<StudentAttendance />} />
          <Route path="clearance" element={<StudentClearance />} />
          <Route path="announcements" element={<StudentAnnouncements />} />
          <Route path="messages" element={<StudentMessages />} />
          <Route path="documents" element={<StudentDocuments />} />
          <Route path="obligations" element={<StudentObligations />} />
          <Route path="evaluations" element={<StudentEvaluations />} />
          <Route path="profile" element={<StudentProfile />} />
        </Route>

        {/* ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ 404 ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
      <Toaster position="top-center" richColors />
      <Chatbot />
    </Router>
  );
}

export default App;
