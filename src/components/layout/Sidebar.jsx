import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  LayoutDashboard, Users, Building2, Briefcase, Calendar,
  FileText, MessageSquare, ClipboardList, Settings, LogOut,
  ChevronRight, User, Shield, TrendingUp, QrCode, CheckCircle,
  Bell, Award, X, ClipboardCheck, AlertTriangle, Wallet, BookOpen, Eye, CreditCard,
  ChevronsUpDown, Check, Repeat2,
} from 'lucide-react';
import bisuLogo from '@/images/bisu-logo.png';
import AvatarImg from '@/components/Avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import PageLoader from '@/components/ui/PageLoader';

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Menu Structures Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

const adminMenuSections = [
  {
    label: 'Overview',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard', badge: null },
      { icon: Calendar, label: 'School Year', path: '/admin/school-years', badge: 'Active' },
    ],
  },
  {
    label: 'Management',
    items: [
      { icon: Users, label: 'Users', path: '/admin/users', badge: null },
      { icon: Building2, label: 'Colleges', path: '/admin/colleges', badge: null },
      { icon: Briefcase, label: 'Organizations', path: '/admin/organizations', badge: null },
      { icon: Calendar, label: 'Events', path: '/admin/events', badge: 'New' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { icon: ClipboardList, label: 'Attendance', path: '/admin/attendance', badge: null },
      { icon: FileText, label: 'Documents', path: '/admin/documents', badge: null },
      { icon: MessageSquare, label: 'Messages', path: '/admin/messages', badge: null },
    ],
  },
];

// Position-based visibility: empty positions array = visible to all officers
// President / Vice President see everything; others see role-specific items
const ALL_POSITIONS = [];  // empty = everyone
const LEADERSHIP = ['President', 'Vice President'];
const ADMIN_ROLES = ['President', 'Vice President', 'Secretary'];
const FINANCE = ['President', 'Vice President', 'Treasurer', 'Auditor'];

const officerMenuBase = [
  {
    label: 'Overview',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/officer/dashboard', badge: null, positions: ALL_POSITIONS },
      { icon: Eye, label: 'Adviser Overview', path: '/officer/adviser-overview', badge: null, positions: ['__adviser__'] },
    ],
  },
  {
    label: 'Organization',
    items: [
      { icon: Users, label: 'Members', path: '/officer/members', badge: null, positions: LEADERSHIP },
      { icon: Calendar, label: 'Events', path: '/officer/events', badge: null, positions: ALL_POSITIONS },
      { icon: ClipboardList, label: 'Attendance', path: '/officer/attendance', badge: null, positions: [...LEADERSHIP, 'Secretary', 'Auditor'] },
      { icon: CreditCard, label: 'RFID Scanner', path: '/officer/rfid-scanner', badge: 'Scan', positions: [...LEADERSHIP, 'Secretary', 'Auditor'] },
      { icon: ClipboardCheck, label: 'Evaluations', path: '/officer/evaluations', badge: null, positions: [...ADMIN_ROLES, 'Auditor'] },
      { icon: FileText, label: 'Documents', path: '/officer/documents', badge: null, positions: ALL_POSITIONS },
    ],
  },
  {
    label: 'Treasury',
    items: [
      { icon: Wallet, label: 'Finance', path: '/officer/finance', badge: null, positions: ['Treasurer', 'Auditor'] },
    ],
  },
  {
    label: 'Secretary',
    items: [
      { icon: BookOpen, label: 'Meeting Minutes', path: '/officer/minutes', badge: null, positions: ['Secretary'] },
    ],
  },
  {
    label: 'Communication',
    items: [
      { icon: Bell, label: 'Announcements', path: '/officer/announcements', badge: null, positions: ALL_POSITIONS },
      { icon: MessageSquare, label: 'Messages', path: '/officer/messages', badge: '2', positions: ALL_POSITIONS },
    ],
  },
  {
    label: 'Compliance',
    items: [
      { icon: AlertTriangle, label: 'Consequence Rules', path: '/officer/consequence-rules', badge: null, positions: LEADERSHIP },
    ],
  },
  {
    label: 'My Student',
    items: [
      { icon: QrCode, label: 'Check In', path: '/officer/checkin', badge: 'Scan', positions: ALL_POSITIONS },
      { icon: Calendar, label: 'My Events', path: '/officer/my-events', badge: null, positions: ALL_POSITIONS },
      { icon: ClipboardList, label: 'My Attendance', path: '/officer/my-attendance', badge: null, positions: ALL_POSITIONS },
      { icon: Award, label: 'Obligations', path: '/officer/obligations', badge: null, positions: ALL_POSITIONS },
    ],
  },
];

// Build filtered officer menu based on position and role
const getOfficerMenu = (position, membershipRole) => {
  const pos = (position || '').trim().toLowerCase();
  const isAdviser = membershipRole === 'adviser';
  return officerMenuBase
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        if (isAdviser) return true; // advisers see everything
        if (!item.positions || item.positions === ALL_POSITIONS || item.positions.length === 0) return true; // visible to all
        return item.positions.some((p) => p.toLowerCase() === pos);
      }),
    }))
    .filter((section) => section.items.length > 0);
};

const studentMenuSections = [
  {
    label: 'Overview',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/student/dashboard', badge: null },
      { icon: QrCode, label: 'Check In', path: '/student/checkin', badge: 'Scan' },
      { icon: User, label: 'My Profile', path: '/student/profile', badge: null },
    ],
  },
  {
    label: 'My Activities',
    items: [
      { icon: Calendar, label: 'Events', path: '/student/events', badge: null },
      { icon: ClipboardList, label: 'My Attendance', path: '/student/attendance', badge: null },
      { icon: ClipboardCheck, label: 'Evaluations', path: '/student/evaluations', badge: null },
    ],
  },
  {
    label: 'Communication',
    items: [
      { icon: Bell, label: 'Announcements', path: '/student/announcements', badge: '3' },
      { icon: MessageSquare, label: 'Messages', path: '/student/messages', badge: '2' },
    ],
  },
  {
    label: 'Requirements',
    items: [
      { icon: Award, label: 'Obligations', path: '/student/obligations', badge: null },
    ],
  },
];

const bottomItems = [
  { icon: Settings, label: 'Settings', path: '/admin/settings' },
];

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Sidebar Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

export default function Sidebar({ onClose }) {
  const location = useLocation();
  const navigate = useNavigate();

  const userRole = localStorage.getItem('user_role') || 'member';
  const isAdmin = userRole === 'admin';
  const isOfficer = userRole === 'officer';

  const [logoutOpen, setLogoutOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Re-read user from localStorage whenever 'userUpdated' is dispatched
  const [storedUser, setStoredUser] = useState(
    () => JSON.parse(localStorage.getItem('user') || '{}')
  );
  useEffect(() => {
    const refresh = () => setStoredUser(JSON.parse(localStorage.getItem('user') || '{}'));
    window.addEventListener('userUpdated', refresh);
    return () => window.removeEventListener('userUpdated', refresh);
  }, []);

  const storedMember = JSON.parse(localStorage.getItem('membership') || 'null');
  const officerDesignation = storedMember?.designation || '';
  const isAdviser = officerDesignation.toLowerCase() === 'adviser';

  const currentUser = isAdmin
    ? { name: 'Admin User', email: storedUser.email ?? '', role: 'System Admin', avatarUrl: null }
    : {
      name: `${storedUser.first_name ?? ''} ${storedUser.last_name ?? ''}`.trim() || 'Student',
      email: storedUser.email ?? '',
      studentId: storedUser.student_number ?? '—',
      role: isOfficer ? (isAdviser ? 'Adviser' : (officerDesignation || 'Officer')) : 'Member',
      yearLevel: storedUser.year_level ?? '—',
      avatarUrl: storedUser.profile_picture_url ?? null,
    };

  const getInitials = (name) =>
    name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  const handleLogout = async () => {
    setIsLoggingOut(true);
    setLogoutOpen(false);
    
    try {
      const token = localStorage.getItem('token');
      if (token) {
        await axios.post('/api/logout', {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } catch (e) {
      // Ignore API errors on logout
    }

    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('user_role');
    localStorage.removeItem('membership');
    localStorage.removeItem('organization_id');
    navigate('/login');
  };

  // ── Org switcher state ──────────────────────────────────────────────────
  const [officerOrgs, setOfficerOrgs] = useState([]);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const currentOrgId = localStorage.getItem('organization_id') || '';

  useEffect(() => {
    if (!isOfficer) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    axios.get('/api/profile/my-organizations', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        // Only include non-Member designations (officer roles)
        const orgs = (res.data || []).filter(d =>
          d.designation && d.designation !== 'Member' && d.status === 'active'
        );
        setOfficerOrgs(orgs);
      })
      .catch(() => {});
  }, [isOfficer]);

  const handleSwitchOrg = (membership) => {
    localStorage.setItem('organization_id', String(membership.organization_id));
    localStorage.setItem('membership', JSON.stringify(membership));
    setSwitcherOpen(false);
    // Force a full reload so every officer page re-reads localStorage
    window.location.href = '/officer/dashboard';
  };

  const activeOrg = officerOrgs.find(o => String(o.organization_id) === currentOrgId);
  const showSwitcher = isOfficer && officerOrgs.length > 1;

  const theme = isAdmin
    ? {
      gradient: 'from-[#0f2d5e] via-[#1a4a8a] to-[#1e4db7]',
      activeGradient: 'from-[#0f2d5e] to-[#1e4db7]',
      activeShadow: 'shadow-[#0f2d5e]/20',
      hoverText: 'hover:text-[#0f2d5e]',
      activeText: 'text-[#0f2d5e]',
      title: 'Admin Portal',
    }
    : isOfficer
      ? {
        gradient: 'from-[#7c3aed] via-[#8b5cf6] to-[#a78bfa]',
        activeGradient: 'from-[#7c3aed] to-[#a78bfa]',
        activeShadow: 'shadow-[#7c3aed]/20',
        hoverText: 'hover:text-[#7c3aed]',
        activeText: 'text-[#7c3aed]',
        title: 'Officer Portal',
      }
      : {
        gradient: 'from-[#2563eb] via-[#3b6fd4] to-[#5b9ef7]',
        activeGradient: 'from-[#2563eb] to-[#5b9ef7]',
        activeShadow: 'shadow-[#2563eb]/20',
        hoverText: 'hover:text-[#2563eb]',
        activeText: 'text-[#2563eb]',
        title: 'Student Portal',
      };

  const menuSections = isAdmin
    ? adminMenuSections
    : isOfficer
      ? getOfficerMenu(officerDesignation, isAdviser ? 'adviser' : '')
      : studentMenuSections;

  const handleNavClick = () => {
    if (onClose) onClose();
  };

  return (
    <div className="w-64 h-screen bg-white border-r border-slate-200 flex flex-col">
      {/* Loading Overlay */}
      {isLoggingOut && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/60 backdrop-blur-sm">
          <PageLoader text="Logging out..." />
        </div>,
        document.body
      )}

      {/* Logo Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-slate-100 shrink-0">
        <div className="flex items-center gap-3">
          <img src={bisuLogo} alt="BISU" className="w-9 h-9 rounded-full object-cover shadow-md shrink-0" />
          <div>
            <h1 className="text-base font-bold tracking-tight text-slate-800">TAPasok</h1>
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

      {/* Org Switcher (officers with multiple orgs) */}
      {showSwitcher && (
        <div className="px-3 py-2 border-b border-slate-100 shrink-0">
          <p className="px-2 mb-1.5 text-[9px] font-bold uppercase tracking-widest text-slate-400">Managing</p>
          <div className="relative">
            <button
              type="button"
              onClick={() => setSwitcherOpen(s => !s)}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-200/60 hover:border-violet-300 transition-all group"
            >
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#7c3aed] to-[#a78bfa] flex items-center justify-center shrink-0 shadow-sm">
                <Building2 className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-xs font-semibold text-slate-800 truncate">
                  {activeOrg?.organization?.name || 'Select Org'}
                </p>
                <p className="text-[10px] text-violet-500 font-medium truncate">
                  {activeOrg?.designation || 'Officer'}
                </p>
              </div>
              <ChevronsUpDown className="w-3.5 h-3.5 text-violet-400 group-hover:text-violet-600 transition-colors shrink-0" />
            </button>

            {switcherOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setSwitcherOpen(false)} />
                <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white rounded-xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
                  <div className="px-3 py-2 border-b border-slate-100 bg-slate-50">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                      <Repeat2 className="w-3 h-3" /> Switch Organization
                    </p>
                  </div>
                  <div className="py-1 max-h-48 overflow-y-auto">
                    {officerOrgs.map((m) => {
                      const isCurrent = String(m.organization_id) === currentOrgId;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => !isCurrent && handleSwitchOrg(m)}
                          className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-all ${
                            isCurrent
                              ? 'bg-violet-50 border-l-2 border-violet-500'
                              : 'hover:bg-slate-50 border-l-2 border-transparent cursor-pointer'
                          }`}
                        >
                          <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${
                            isCurrent ? 'bg-violet-500' : 'bg-slate-200'
                          }`}>
                            {isCurrent
                              ? <Check className="w-3 h-3 text-white" />
                              : <Building2 className="w-3 h-3 text-slate-500" />
                            }
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs font-semibold truncate ${
                              isCurrent ? 'text-violet-700' : 'text-slate-700'
                            }`}>{m.organization?.name || 'Unknown Org'}</p>
                            <p className={`text-[10px] truncate ${
                              isCurrent ? 'text-violet-500' : 'text-slate-400'
                            }`}>{m.designation}</p>
                          </div>
                          {isCurrent && (
                            <span className="text-[9px] font-bold uppercase tracking-wider text-violet-500 shrink-0">Active</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

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
                    className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${isActive
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
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${isActive ? `bg-slate-100 ${theme.activeText}` : `text-slate-600 hover:bg-slate-50 ${theme.hoverText}`
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
                  <AvatarImg
                    src={currentUser.avatarUrl}
                    name={currentUser.name}
                    size={36}
                  />
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-white rounded-full" />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{currentUser.name}</p>
                  <p className="text-xs text-slate-400 truncate flex items-center gap-1">
                    {isAdmin
                      ? <><Shield className="w-3 h-3" />{currentUser.role}</>
                      : isOfficer
                        ? <><TrendingUp className="w-3 h-3" />{currentUser.role}</>
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
              <DropdownMenuItem className="cursor-pointer rounded-lg" onClick={() => navigate(isAdmin ? '/admin/settings' : '/student/profile')}>
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
                onSelect={(e) => {
                  e.preventDefault();
                  // For Radix UI DropdownMenu closing before AlertDialog opens
                  // you can either keep it open (via preventDefault) or close it and timeout.
                  // We'll just let preventDefault handle keeping it open or using document.body trigger.
                  setLogoutOpen(true);
                }}
                className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 rounded-lg"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <AlertDialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <AlertDialogContent className="w-[90vw] sm:max-w-[425px] rounded-2xl p-6">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to log out?</AlertDialogTitle>
            <AlertDialogDescription>
              You will be redirected to the login page and your current session will be closed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="mt-0 w-full sm:w-auto">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout} className="bg-red-600 hover:bg-red-700 text-white w-full sm:w-auto">
              Log out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}