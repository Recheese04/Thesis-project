import { useEffect, useState } from 'react';
import axios from 'axios';
import {
  QrCode, Calendar, CheckCircle, Clock, Award,
  TrendingUp, Users, Bell, ArrowRight, Activity
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useNavigate } from 'react-router-dom';

const authH = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });

// Stat Card Component
function StatCard({ icon: Icon, label, value, sub, color, trend }) {
  return (
    <Card className="p-5 border-slate-200 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
            {label}
          </p>
          <p className="text-3xl font-extrabold text-slate-900 mb-1">{value}</p>
          {sub && (
            <p className="text-xs text-slate-400 flex items-center gap-1">
              {trend && <TrendingUp className="w-3 h-3 text-emerald-500" />}
              {sub}
            </p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </Card>
  );
}

// Quick Action Card
function QuickAction({ icon: Icon, title, description, onClick, color }) {
  return (
    <button
      onClick={onClick}
      className="w-full p-4 rounded-xl border-2 border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all text-left group"
    >
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-800 text-sm mb-0.5">{title}</p>
          <p className="text-xs text-slate-500">{description}</p>
        </div>
        <ArrowRight className="w-5 h-5 text-slate-400 shrink-0 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
      </div>
    </button>
  );
}

// Upcoming Event Card
function EventCard({ event }) {
  const eventDate = new Date(event.event_date);
  const isToday = eventDate.toDateString() === new Date().toDateString();
  
  return (
    <div className="p-4 bg-white rounded-xl border border-slate-200 hover:shadow-md transition-all">
      <div className="flex items-start gap-3">
        <div className={`w-12 h-12 rounded-lg flex flex-col items-center justify-center shrink-0 ${
          isToday ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-50 text-blue-600'
        }`}>
          <span className="text-xs font-bold uppercase">
            {eventDate.toLocaleDateString('en-US', { month: 'short' })}
          </span>
          <span className="text-lg font-extrabold leading-none">
            {eventDate.getDate()}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className="font-semibold text-slate-800 text-sm line-clamp-1">{event.name}</h4>
            {isToday && (
              <Badge className="bg-emerald-500 text-white text-[10px] px-2 py-0 h-5 shrink-0">
                Today
              </Badge>
            )}
          </div>
          <p className="text-xs text-slate-500 mb-2 line-clamp-1">{event.description}</p>
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {event.event_time}
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {event.organization?.name}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalEvents: 0,
    attendedEvents: 0,
    upcomingEvents: 0,
    attendanceRate: 0,
  });
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [recentAttendance, setRecentAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch upcoming events
      const eventsRes = await axios.get('/api/events/filter/upcoming', authH());
      setUpcomingEvents(eventsRes.data.slice(0, 3));

      // Fetch my attendance
      const attendanceRes = await axios.get('/api/attendance/my', authH());
      const myAttendance = attendanceRes.data;
      setRecentAttendance(myAttendance.slice(0, 5));

      // Calculate stats
      const attended = myAttendance.filter(a => a.status === 'checked_out').length;
      const rate = myAttendance.length > 0 ? Math.round((attended / myAttendance.length) * 100) : 0;

      setStats({
        totalEvents: myAttendance.length,
        attendedEvents: attended,
        upcomingEvents: eventsRes.data.length,
        attendanceRate: rate,
      });

    } catch (error) {
      console.error('Dashboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Welcome back! 👋</h1>
        <p className="text-slate-500 text-sm mt-1">Here's your organization activity overview</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Calendar}
          label="Total Events"
          value={stats.totalEvents}
          sub="Events registered"
          color="bg-gradient-to-br from-blue-500 to-blue-600"
        />
        <StatCard
          icon={CheckCircle}
          label="Attended"
          value={stats.attendedEvents}
          sub="Successfully completed"
          color="bg-gradient-to-br from-emerald-500 to-emerald-600"
          trend
        />
        <StatCard
          icon={Clock}
          label="Upcoming"
          value={stats.upcomingEvents}
          sub="Events scheduled"
          color="bg-gradient-to-br from-amber-500 to-amber-600"
        />
        <StatCard
          icon={Award}
          label="Attendance Rate"
          value={`${stats.attendanceRate}%`}
          sub="Overall completion"
          color="bg-gradient-to-br from-violet-500 to-violet-600"
        />
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <QuickAction
            icon={QrCode}
            title="Check In Now"
            description="Scan QR code to mark attendance"
            onClick={() => navigate('/student/checkin')}
            color="bg-gradient-to-br from-blue-500 to-blue-600"
          />
          <QuickAction
            icon={Calendar}
            title="Browse Events"
            description="View all upcoming events"
            onClick={() => navigate('/student/events')}
            color="bg-gradient-to-br from-violet-500 to-violet-600"
          />
          <QuickAction
            icon={Activity}
            title="My Attendance"
            description="Track your attendance history"
            onClick={() => navigate('/student/attendance')}
            color="bg-gradient-to-br from-emerald-500 to-emerald-600"
          />
          <QuickAction
            icon={Bell}
            title="Announcements"
            description="Check latest updates"
            onClick={() => navigate('/student/announcements')}
            color="bg-gradient-to-br from-amber-500 to-amber-600"
          />
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Events */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">Upcoming Events</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/student/events')}
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            >
              View All
              <ArrowRight className="ml-1 w-4 h-4" />
            </Button>
          </div>
          
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 bg-slate-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : upcomingEvents.length === 0 ? (
            <Card className="p-8 text-center border-slate-200">
              <Calendar className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p className="font-semibold text-slate-500 text-sm">No upcoming events</p>
              <p className="text-xs text-slate-400 mt-1">Check back later for new events</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {upcomingEvents.map(event => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </div>

        {/* Recent Attendance */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">Recent Attendance</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/student/attendance')}
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            >
              View All
              <ArrowRight className="ml-1 w-4 h-4" />
            </Button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : recentAttendance.length === 0 ? (
            <Card className="p-8 text-center border-slate-200">
              <CheckCircle className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p className="font-semibold text-slate-500 text-sm">No attendance records</p>
              <p className="text-xs text-slate-400 mt-1">Start checking in to events</p>
            </Card>
          ) : (
            <div className="space-y-2">
              {recentAttendance.map(record => (
                <div key={record.id} className="p-3 bg-white rounded-lg border border-slate-200">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-slate-800 truncate">
                        {record.event?.name}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {new Date(record.time_in).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                    <Badge className={`shrink-0 ${
                      record.status === 'checked_out'
                        ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                        : 'bg-blue-100 text-blue-700 border-blue-200'
                    }`}>
                      {record.status === 'checked_out' ? 'Completed' : 'Checked In'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}