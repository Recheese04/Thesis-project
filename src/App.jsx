import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/auth/LoginPage';
import AdminLayout from './components/layout/AdminLayout';
import Dashboard from './pages/dashboards/admin/Dashboard';
import UserManagement from './pages/dashboards/admin/UserManagement';
import DepartmentManagement from './pages/dashboards/admin/DepartmentManagement';
import OrganizationManagement from './pages/dashboards/admin/OrganizationManagement';
import EventManagement from './pages/dashboards/admin/EventManagement';
import Settings from './pages/dashboards/admin/Settings';
import AttendanceManagement from './pages/dashboards/admin/AttendanceManagement';

// Protected Route Component
function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
}

// Public Route Component (redirect to dashboard if already logged in)
function PublicRoute({ children }) {
  const token = localStorage.getItem('token');
  
  if (token) {
    return <Navigate to="/admin/dashboard" replace />;
  }
  
  return children;
}

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route 
          path="/login" 
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } 
        />
   
        
        
        {/* Protected Admin Routes wrapped in Layout */}
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          {/* Nested routes render inside AdminLayout <Outlet /> */}
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="departments" element={<DepartmentManagement />} />
          <Route path="organizations" element={<OrganizationManagement />} />
          <Route path="events" element={<EventManagement />} />
          <Route path="attendance" element={<AttendanceManagement />} />
          <Route path="settings" element={<Settings />} />
          
          {/* Default admin route */}
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
        </Route>
        
        {/* Default Route */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        {/* 404 Route */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;