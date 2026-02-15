import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Search, Bell, Settings, User, LogOut, ChevronDown,
  Menu, X, Shield, HelpCircle, Moon, Sun, Maximize2,
  Clock, Activity
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';

// Mock data - replace with real data
const NOTIFICATIONS = [
  {
    id: 1,
    title: 'New user registered',
    description: 'John Doe just created an account',
    time: '5 min ago',
    unread: true,
    type: 'user'
  },
  {
    id: 2,
    title: 'Event created',
    description: 'Annual Meeting event has been scheduled',
    time: '1 hour ago',
    unread: true,
    type: 'event'
  },
  {
    id: 3,
    title: 'Department updated',
    description: 'College of Engineering details modified',
    time: '3 hours ago',
    unread: false,
    type: 'update'
  },
];

// Breadcrumb mapping
const BREADCRUMB_MAP = {
  '/admin/dashboard': 'Dashboard',
  '/admin/users': 'User Management',
  '/admin/departments': 'Department Management',
  '/admin/organizations': 'Organization Management',
  '/admin/events': 'Event Management',
  '/admin/attendance': 'Attendance Records',
  '/admin/documents': 'Document Library',
  '/admin/messages': 'Messages',
  '/admin/settings': 'Settings',
};

export default function Navbar({ onMenuClick, isSidebarOpen }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [theme, setTheme] = useState('light');
  
  const currentUser = {
    name: 'Admin User',
    email: 'admin@organization.edu',
    role: 'System Administrator',
    avatar: null,
  };

  const unreadCount = NOTIFICATIONS.filter(n => n.unread).length;
  const currentPage = BREADCRUMB_MAP[location.pathname] || 'Dashboard';

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
    // Add theme toggle logic here
  };

  const formatTime = () => {
    const now = new Date();
    return now.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      console.log('Searching for:', searchQuery);
      // Implement search logic
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <TooltipProvider>
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-40 shadow-sm">
        
        {/* Left Section */}
        <div className="flex items-center gap-4 flex-1">
          {/* Mobile Menu Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="lg:hidden h-9 w-9 text-slate-600 hover:bg-slate-100"
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>

          {/* Breadcrumb */}
          <div className="hidden md:flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-200">
              <Activity className="w-4 h-4 text-[#0f2d5e]" />
              <span className="text-sm font-semibold text-slate-700">{currentPage}</span>
            </div>
          </div>

          {/* Search Bar - Desktop */}
          <div className="hidden lg:flex items-center flex-1 max-w-md">
            <form onSubmit={handleSearch} className="w-full relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Search anything... (Ctrl+K)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 h-9 bg-slate-50 border-slate-200 focus:bg-white focus:border-[#1e4db7] rounded-xl text-sm"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </form>
          </div>

          {/* Search Button - Mobile */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSearchOpen(!searchOpen)}
                className="lg:hidden h-9 w-9 text-slate-600 hover:bg-slate-100"
              >
                <Search className="w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Search</TooltipContent>
          </Tooltip>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2">
          
          {/* Current Time */}
          <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-200">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs font-medium text-slate-600">{formatTime()}</span>
          </div>

          {/* Theme Toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="h-9 w-9 text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Toggle theme</TooltipContent>
          </Tooltip>

          {/* Fullscreen Toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (!document.fullscreenElement) {
                    document.documentElement.requestFullscreen();
                  } else {
                    document.exitFullscreen();
                  }
                }}
                className="hidden md:flex h-9 w-9 text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                <Maximize2 className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Fullscreen</TooltipContent>
          </Tooltip>

          {/* Help */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/admin/help')}
                className="h-9 w-9 text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                <HelpCircle className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Help & Support</TooltipContent>
          </Tooltip>

          {/* Notifications */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative h-9 w-9 text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 rounded-xl border-slate-200 shadow-xl" align="end">
              <div className="p-4 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-slate-900">Notifications</h3>
                  {unreadCount > 0 && (
                    <Badge className="bg-red-500 text-white text-xs px-2 py-0.5">
                      {unreadCount} new
                    </Badge>
                  )}
                </div>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {NOTIFICATIONS.length > 0 ? (
                  NOTIFICATIONS.map((notif) => (
                    <button
                      key={notif.id}
                      className={`w-full p-4 text-left hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 ${
                        notif.unread ? 'bg-blue-50/50' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${
                          notif.unread ? 'bg-blue-500' : 'bg-slate-300'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900">{notif.title}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{notif.description}</p>
                          <p className="text-xs text-slate-400 mt-1">{notif.time}</p>
                        </div>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="p-8 text-center">
                    <Bell className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">No notifications</p>
                  </div>
                )}
              </div>
              {NOTIFICATIONS.length > 0 && (
                <div className="p-3 border-t border-slate-100 bg-slate-50">
                  <button className="w-full text-center text-sm font-medium text-[#0f2d5e] hover:text-[#1e4db7]">
                    View all notifications
                  </button>
                </div>
              )}
            </PopoverContent>
          </Popover>

          <div className="w-px h-6 bg-slate-200 mx-1" />

          {/* User Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors group">
                <div className="relative">
                  <Avatar className="w-8 h-8 ring-2 ring-white shadow-sm">
                    <AvatarFallback className="bg-gradient-to-br from-[#0f2d5e] to-[#1e4db7] text-white text-xs font-bold">
                      {getInitials(currentUser.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 border-2 border-white rounded-full" />
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-semibold text-slate-800">{currentUser.name}</p>
                  <p className="text-xs text-slate-500">{currentUser.role}</p>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400 hidden md:block group-hover:text-slate-600 transition-colors" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 rounded-xl border-slate-200 shadow-xl">
              <DropdownMenuLabel className="font-normal">
                <div className="flex items-center gap-3 py-2">
                  <Avatar className="w-12 h-12 ring-2 ring-slate-100">
                    <AvatarFallback className="bg-gradient-to-br from-[#0f2d5e] to-[#1e4db7] text-white text-sm font-bold">
                      {getInitials(currentUser.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900">{currentUser.name}</p>
                    <p className="text-xs text-slate-500 truncate">{currentUser.email}</p>
                    <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] px-1.5 py-0 mt-1 font-medium">
                      <Shield className="w-3 h-3 mr-1" />
                      {currentUser.role}
                    </Badge>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-slate-100" />
              <DropdownMenuItem 
                onClick={() => navigate('/admin/profile')}
                className="cursor-pointer rounded-lg gap-3 py-2.5"
              >
                <User className="w-4 h-4 text-slate-500" />
                <div>
                  <p className="text-sm font-medium">My Profile</p>
                  <p className="text-xs text-slate-500">View and edit profile</p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => navigate('/admin/settings')}
                className="cursor-pointer rounded-lg gap-3 py-2.5"
              >
                <Settings className="w-4 h-4 text-slate-500" />
                <div>
                  <p className="text-sm font-medium">Settings</p>
                  <p className="text-xs text-slate-500">Manage preferences</p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-slate-100" />
              <DropdownMenuItem 
                onClick={handleLogout}
                className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 rounded-lg gap-3 py-2.5"
              >
                <LogOut className="w-4 h-4" />
                <div>
                  <p className="text-sm font-medium">Log out</p>
                  <p className="text-xs text-red-500/70">Sign out of your account</p>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Mobile Search Overlay */}
        {searchOpen && (
          <div className="lg:hidden absolute top-16 left-0 right-0 bg-white border-b border-slate-200 p-4 shadow-lg z-50">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Search anything..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  className="pl-10 pr-10 h-10 bg-slate-50 border-slate-200 focus:bg-white focus:border-[#1e4db7] rounded-xl"
                />
                <button
                  type="button"
                  onClick={() => setSearchOpen(false)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        )}
      </header>
    </TooltipProvider>
  );
}