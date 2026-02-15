import { Outlet } from 'react-router-dom';
import StudentSidebar from './Sidebar';

export default function StudentLayout() {
  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <StudentSidebar />
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[1400px] mx-auto p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
}