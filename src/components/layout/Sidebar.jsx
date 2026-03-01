import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Building2, Briefcase, Calendar,
  FileText, MessageSquare, ClipboardList, Settings, LogOut,
  ChevronRight, User, Shield, TrendingUp, QrCode, CheckCircle,
  Bell, Award, X, ClipboardCheck, AlertTriangle,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// ─── Menu Structures ─────────────────────────────────────────────────────────

const adminMenuSections = [
  {
    label: 'Overview',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard', badge: null },
    ],
  },
  {
    label: 'Management',
    items: [
      { icon: Users,      label: 'Users',         path: '/admin/users',         badge: null },
      { icon: Building2,  label: 'Departments',   path: '/admin/departments',   badge: null },
      { icon: Briefcase,  label: 'Organizations', path: '/admin/organizations', badge: null },
      { icon: Calendar,   label: 'Events',        path: '/admin/events',        badge: 'New' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { icon: ClipboardList, label: 'Attendance', path: '/admin/attendance', badge: null },
      { icon: FileText,      label: 'Documents',  path: '/admin/documents',  badge: null },
      { icon: MessageSquare, label: 'Messages',   path: '/admin/messages',   badge: null },
    ],
  },
];

const officerMenuSections = [
  {
    label: 'Overview',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/officer/dashboard', badge: null },
    ],
  },
  {
    label: 'Organization',
    items: [
      { icon: Users,          label: 'Members',     path: '/officer/members',     badge: null },
      { icon: Calendar,       label: 'Events',      path: '/officer/events',      badge: null },
      { icon: ClipboardList,  label: 'Attendance',  path: '/officer/attendance',  badge: null },
      { icon: ClipboardCheck, label: 'Evaluations', path: '/officer/evaluations', badge: null },
    ],
  },
  {
    label: 'Communication',
    items: [
      { icon: Bell,          label: 'Announcements', path: '/officer/announcements', badge: null },
      { icon: MessageSquare, label: 'Messages',      path: '/officer/messages',      badge: '2' },
      { icon: Award,         label: 'Tasks',         path: '/officer/tasks',         badge: '5' },
    ],
  },
  {
    // ← NEW SECTION
    label: 'Clearance',
    items: [
      { icon: CheckCircle,   label: 'Manage Clearance',  path: '/officer/clearance',         badge: null },
      { icon: AlertTriangle, label: 'Consequence Rules', path: '/officer/consequence-rules', badge: null },
    ],
  },
  {
    label: 'My Student',
    items: [
      { icon: QrCode,        label: 'Check In',      path: '/officer/checkin',       badge: 'Scan' },
      { icon: Calendar,      label: 'My Events',     path: '/officer/my-events',     badge: null },
      { icon: ClipboardList, label: 'My Attendance', path: '/officer/my-attendance', badge: null },
      { icon: CheckCircle,   label: 'My Clearance',  path: '/officer/my-clearance',  badge: null }, // ← officer's OWN clearance status
      { icon: FileText,      label: 'Documents',     path: '/officer/documents',     badge: null },
      { icon: Award,         label: 'Obligations',   path: '/officer/obligations',   badge: null },
    ],
  },
];

const studentMenuSections = [
  {
    label: 'Overview',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/student/dashboard', badge: null },
      { icon: QrCode,          label: 'Check In',  path: '/student/checkin',   badge: 'Scan' },
    ],
  },
  {
    label: 'My Activities',
    items: [
      { icon: Calendar,       label: 'Events',           path: '/student/events',      badge: null },
      { icon: ClipboardList,  label: 'My Attendance',    path: '/student/attendance',  badge: null },
      { icon: CheckCircle,    label: 'Clearance Status', path: '/student/clearance',   badge: null },
      { icon: ClipboardCheck, label: 'Evaluations',      path: '/student/evaluations', badge: null },
    ],
  },
  {
    label: 'Communication',
    items: [
      { icon: Bell,          label: 'Announcements', path: '/student/announcements', badge: '3' },
      { icon: MessageSquare, label: 'Messages',      path: '/student/messages',      badge: '2' },
    ],
  },
  {
    label: 'Requirements',
    items: [
      { icon: FileText, label: 'Documents',   path: '/student/documents',   badge: null },
      { icon: Award,    label: 'Obligations', path: '/student/obligations', badge: null },
    ],
  },
];

const bottomItems = [
  { icon: Settings, label: 'Settings', path: '/admin/settings' },
];

// ─── Sidebar ─────────────────────────────────────────────────────────────────

export default function Sidebar({ onClose }) {
  const location = useLocation();
  const navigate = useNavigate();

  const userRole  = localStorage.getItem('user_role') || 'member';
  const isAdmin   = userRole === 'admin';
  const isOfficer = userRole === 'officer';

  const storedUser = JSON.parse(localStorage.getItem('user') || '{}');

  const currentUser = isAdmin
    ? { name: 'Admin User', email: storedUser.email ?? '', role: 'System Admin' }
    : {
        name: `${storedUser.student?.first_name ?? ''} ${storedUser.student?.last_name ?? ''}`.trim() || 'Student',
        email:     storedUser.email ?? '',
        studentId: storedUser.student?.student_number ?? '—',
        role:      isOfficer ? 'Officer' : 'Member',
        yearLevel: storedUser.student?.year_level ?? '—',
      };

  const getInitials = (name) =>
    name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('user_role');
    navigate('/login');
  };

  const theme = isAdmin
    ? {
        gradient:       'from-[#0f2d5e] via-[#1a4a8a] to-[#1e4db7]',
        activeGradient: 'from-[#0f2d5e] to-[#1e4db7]',
        activeShadow:   'shadow-[#0f2d5e]/20',
        hoverText:      'hover:text-[#0f2d5e]',
        activeText:     'text-[#0f2d5e]',
        title:          'Admin Portal',
      }
    : isOfficer
    ? {
        gradient:       'from-[#7c3aed] via-[#8b5cf6] to-[#a78bfa]',
        activeGradient: 'from-[#7c3aed] to-[#a78bfa]',
        activeShadow:   'shadow-[#7c3aed]/20',
        hoverText:      'hover:text-[#7c3aed]',
        activeText:     'text-[#7c3aed]',
        title:          'Officer Portal',
      }
    : {
        gradient:       'from-[#2563eb] via-[#3b6fd4] to-[#5b9ef7]',
        activeGradient: 'from-[#2563eb] to-[#5b9ef7]',
        activeShadow:   'shadow-[#2563eb]/20',
        hoverText:      'hover:text-[#2563eb]',
        activeText:     'text-[#2563eb]',
        title:          'Student Portal',
      };

  const menuSections = isAdmin
    ? adminMenuSections
    : isOfficer
    ? officerMenuSections
    : studentMenuSections;

  const handleNavClick = () => {
    if (onClose) onClose();
  };

  return (
    <div className="w-64 h-screen bg-white border-r border-slate-200 flex flex-col">
      {/* Logo Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-slate-100 shrink-0">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${theme.gradient} flex items-center justify-center shadow-md shrink-0`}>
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-slate-800">OrgAttend</h1>
            <p className="text-[10px] text-slate-400 font-medium -mt-0.5">{theme.title}</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        {menuSections.map((section, idx) => (
          <div key={section.label} className={idx > 0 ? 'mt-5' : ''}>
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
                    onClick={handleNavClick}
                    className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                      isActive
                        ? `bg-gradient-to-r ${theme.activeGradient} text-white shadow-md ${theme.activeShadow}`
                        : `text-slate-600 hover:bg-slate-50 ${theme.hoverText}`
                    }`}
                  >
                    <item.icon className={`w-4 h-4 shrink-0 transition-transform ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                    <span className="font-medium text-sm flex-1">{item.label}</span>
                    {item.badge && (
                      <Badge className={`text-[10px] px-1.5 py-0 h-5 border-0 ${isActive ? 'bg-white/20 text-white' : 'bg-emerald-500 text-white'}`}>
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
      <div className="border-t border-slate-100 shrink-0">
        {isAdmin && (
          <div className="px-3 py-3">
            {bottomItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={handleNavClick}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                    isActive ? `bg-slate-100 ${theme.activeText}` : `text-slate-600 hover:bg-slate-50 ${theme.hoverText}`
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  <span className="font-medium text-sm">{item.label}</span>
                </Link>
              );
            })}
          </div>
        )}

        {isAdmin && <Separator className="bg-slate-100" />}

        {/* User Profile Dropdown */}
        <div className="p-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors group">
                <div className="relative shrink-0">
                  <Avatar className="w-9 h-9 ring-2 ring-white shadow-sm">
                    <AvatarFallback className={`bg-gradient-to-br ${theme.gradient} text-white text-xs font-bold`}>
                      {getInitials(currentUser.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-white rounded-full" />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{currentUser.name}</p>
                  <p className="text-xs text-slate-400 truncate flex items-center gap-1">
                    {isAdmin
                      ? <><Shield className="w-3 h-3" />{currentUser.role}</>
                      : <span className="font-mono">{currentUser.studentId}</span>
                    }
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors shrink-0" />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" side="top" className="w-56 rounded-xl border-slate-200 shadow-lg mb-1">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-semibold text-slate-900">{currentUser.name}</p>
                  <p className="text-xs text-slate-500">{currentUser.email}</p>
                  {!isAdmin && (
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-[10px] px-2 py-0 h-5">{currentUser.yearLevel}</Badge>
                      <Badge variant="outline" className="text-[10px] px-2 py-0 h-5">{currentUser.role}</Badge>
                    </div>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-slate-100" />
              <DropdownMenuItem className="cursor-pointer rounded-lg">
                <User className="mr-2 h-4 w-4" />
                <span>{isAdmin ? 'Profile' : 'My Profile'}</span>
              </DropdownMenuItem>
              {isAdmin && (
                <DropdownMenuItem className="cursor-pointer rounded-lg">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
              )}
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