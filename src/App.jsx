import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/auth/LoginPage';
import LandingPage from './pages/LandingPage';

// Admin Components
import AdminLayout from './components/layout/AdminLayout';
import Dashboard from './pages/dashboards/admin/Dashboard';
import UserManagement from './pages/dashboards/admin/UserManagement';
import DepartmentManagement from './pages/dashboards/admin/DepartmentManagement';
import OrganizationManagement from './pages/dashboards/admin/OrganizationManagement';
import EventManagement from './pages/dashboards/admin/EventManagement';
import Settings from './pages/dashboards/admin/Settings';
import AttendanceManagement from './pages/dashboards/admin/AttendanceManagement';

// Student Components
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

// Officer Components
import OfficerLayout from './components/layout/OfficerLayout';
import OfficerDashboard from './pages/dashboards/officer/OfficerDashboard';
import OfficerMembers from './pages/dashboards/officer/OfficerMembers';
import OfficerEvents from './pages/dashboards/officer/OfficerEvents';
import OfficerAttendance from './pages/dashboards/officer/OfficerAttendance';
import OfficerTasks from './pages/dashboards/officer/OfficerTasks';
import OfficerAnnouncements from './pages/dashboards/officer/OfficerAnnouncements';
import OfficerMessages from './pages/dashboards/officer/OfficerMessages';

// Get user role from localStorage
function getUserRole() {
  const role = localStorage.getItem('user_role');
  return role || null;
}

// Protected Route — redirects to /login if no token
function ProtectedRoute({ children, allowedRoles = [] }) {
  const token = localStorage.getItem('token');
  const userRole = getUserRole();

  if (!token) return <Navigate to="/login" replace />;

  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    // Redirect based on role
    if (userRole === 'admin') return <Navigate to="/admin/dashboard" replace />;
    if (userRole === 'officer') return <Navigate to="/officer/dashboard" replace />;
    return <Navigate to="/student/dashboard" replace />;
  }

  return children;
}

// Public Route — if already logged in, skip login/landing and go to dashboard
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
        {/* ── Landing Page ────────────────────────────────────────────── */}
        <Route
          path="/"
          element={
            <PublicRoute>
              <LandingPage />
            </PublicRoute>
          }
        />

        {/* ── Login ───────────────────────────────────────────────────── */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />

        {/* ── Admin Routes ────────────────────────────────────────────── */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="departments" element={<DepartmentManagement />} />
          <Route path="organizations" element={<OrganizationManagement />} />
          <Route path="events" element={<EventManagement />} />
          <Route path="attendance" element={<AttendanceManagement />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* ── Officer Routes ──────────────────────────────────────────── */}
       // ── Officer Routes ──────────────────────────────────────────────────────
<Route
  path="/officer"
  element={
    <ProtectedRoute allowedRoles={['officer']}>
      <OfficerLayout />
    </ProtectedRoute>
  }
>
  <Route index element={<Navigate to="/officer/dashboard" replace />} />
  <Route path="dashboard" element={<OfficerDashboard />} />
  <Route path="members" element={<OfficerMembers />} />
  <Route path="events" element={<OfficerEvents />} />
  <Route path="attendance" element={<OfficerAttendance />} />
  <Route path="tasks" element={<OfficerTasks />} />
  <Route path="announcements" element={<OfficerAnnouncements />} />
  <Route path="messages" element={<OfficerMessages />} />

  {/* ── Merged student routes for officers ── */}
  <Route path="checkin" element={<StudentCheckIn />} />
  <Route path="my-events" element={<StudentEvents />} />
  <Route path="my-attendance" element={<StudentAttendance />} />
  <Route path="clearance" element={<StudentClearance />} />
  <Route path="documents" element={<StudentDocuments />} />
  <Route path="obligations" element={<StudentObligations />} />
</Route>

        {/* ── Student/Member Routes ───────────────────────────────────── */}
        <Route
          path="/student"
          element={
            <ProtectedRoute allowedRoles={['student', 'member', 'officer']}>
              <StudentLayout />
            </ProtectedRoute>
          }
        >
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
        </Route>

        {/* ── 404 fallback ────────────────────────────────────────────── */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
} 

export default App;
