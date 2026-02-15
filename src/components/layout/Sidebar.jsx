import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Users, Building2, Briefcase, Calendar,
  FileText, MessageSquare, ClipboardList, Settings, LogOut, 
  ChevronRight, User, Shield, TrendingUp
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const menuSections = [
  {
    label: 'Overview',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard', badge: null },
    ]
  },
  {
    label: 'Management',
    items: [
      { icon: Users, label: 'Users', path: '/admin/users', badge: null },
      { icon: Building2, label: 'Departments', path: '/admin/departments', badge: null },
      { icon: Briefcase, label: 'Organizations', path: '/admin/organizations', badge: null },
      { icon: Calendar, label: 'Events', path: '/admin/events', badge: 'New' },
    ]
  },
  {
    label: 'Operations',
    items: [
      { icon: ClipboardList, label: 'Attendance', path: '/admin/attendance', badge: null },
      { icon: FileText, label: 'Documents', path: '/admin/documents', badge: null },
      { icon: MessageSquare, label: 'Messages', path: '/admin/messages', badge: null },
    ]
  },
];

const bottomItems = [
  { icon: Settings, label: 'Settings', path: '/admin/settings' },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const currentUser = {
    name: 'Admin User',
    email: 'admin@organization.edu',
    role: 'System Admin',
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="w-64 h-screen bg-white border-r border-slate-200 flex flex-col">
      
      {/* Logo Header */}
      <div className="h-16 px-6 flex items-center border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0f2d5e] via-[#1a4a8a] to-[#1e4db7] flex items-center justify-center shadow-md">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-[#0f2d5e] tracking-tight">OrgAttend</h1>
            <p className="text-[10px] text-slate-400 font-medium -mt-0.5">Admin Portal</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        {menuSections.map((section, idx) => (
          <div key={section.label} className={idx > 0 ? 'mt-6' : ''}>
            <h3 className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              {section.label}
            </h3>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-[#0f2d5e] to-[#1e4db7] text-white shadow-md shadow-[#0f2d5e]/20'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-[#0f2d5e]'
                    }`}
                  >
                    <item.icon className={`w-4 h-4 shrink-0 transition-transform ${
                      isActive ? 'scale-110' : 'group-hover:scale-110'
                    }`} />
                    <span className="font-medium text-sm flex-1">{item.label}</span>
                    {item.badge && (
                      <Badge className="bg-emerald-500 text-white text-[10px] px-1.5 py-0 h-5 border-0">
                        {item.badge}
                      </Badge>
                    )}
                    {isActive && (
                      <div className="absolute right-3">
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom Section */}
      <div className="border-t border-slate-100">
        {/* Settings Link */}
        <div className="px-3 py-3">
          {bottomItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                  isActive
                    ? 'bg-slate-100 text-[#0f2d5e]'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-[#0f2d5e]'
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span className="font-medium text-sm">{item.label}</span>
              </Link>
            );
          })}
        </div>

        <Separator className="bg-slate-100" />

        {/* User Profile */}
        <div className="p-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors group">
                <div className="relative">
                  <Avatar className="w-9 h-9 ring-2 ring-white shadow-sm">
                    <AvatarFallback className="bg-gradient-to-br from-[#0f2d5e] to-[#1e4db7] text-white text-xs font-bold">
                      {getInitials(currentUser.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-white rounded-full" />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{currentUser.name}</p>
                  <p className="text-xs text-slate-400 truncate flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    {currentUser.role}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-xl border-slate-200 shadow-lg">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-semibold text-slate-900">{currentUser.name}</p>
                  <p className="text-xs text-slate-500">{currentUser.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-slate-100" />
              <DropdownMenuItem className="cursor-pointer rounded-lg">
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer rounded-lg">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-slate-100" />
              <DropdownMenuItem 
                onClick={handleLogout}
                className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 rounded-lg"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}