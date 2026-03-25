import { useState, useEffect } from 'react';
import { Users, Calendar, ClipboardList, TrendingUp, Plus, Bell, Loader2, CalendarRange, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import axios from 'axios';
import { useSchoolYear } from '@/context/SchoolYearContext';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

const authH = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
});

export default function OfficerDashboard() {
  const { selectedYearId, setSelectedYearId, schoolYears } = useSchoolYear();
  const selectedYear = schoolYears.find(y => String(y.id) === String(selectedYearId));
  const [stats, setStats] = useState({
    totalMembers: 0,
    activeMembers: 0,
    upcomingEvents: 0,
    pendingTasks: 0,
    totalAttendance: 0,
    totalEvents: 0,
  });
  const [recentEvents, setRecentEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (selectedYearId) {
      fetchDashboardData();
    } else {
      setLoading(false);
    }
  }, [selectedYearId]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch stats
      const statsResponse = await axios.get(`/api/dashboard/officer-stats?school_year_id=${selectedYearId}`, authH());
      const officerStats = statsResponse.data;

      // Fetch events for list
      const eventsResponse = await axios.get(`/api/events?school_year_id=${selectedYearId}`, authH());
      const events = eventsResponse.data;
      
      setStats({
        totalMembers: officerStats.total_members || 0,
        activeMembers: officerStats.total_members || 0, // Simplified for now
        upcomingEvents: events.filter(e => e.status === 'upcoming').length,
        pendingTasks: 0, // Placeholder
        totalAttendance: officerStats.total_attendance || 0,
        totalEvents: officerStats.total_events || 0,
      });

      setRecentEvents(events.slice(0, 5));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-start gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Officer Dashboard</h1>
          <p className="text-slate-600 mt-1">Manage your organization</p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={selectedYearId?.toString()}
            onValueChange={(val) => setSelectedYearId(parseInt(val))}
          >
            <SelectTrigger className="h-9 w-[180px] bg-white border-slate-200 rounded-xl text-sm font-semibold text-[#0f2d5e] shadow-sm focus:ring-[#0f2d5e]">
              <div className="flex items-center gap-2">
                <CalendarRange className="w-4 h-4 text-[#0f2d5e] shrink-0" />
                <span>S.Y. {selectedYear?.name || 'Select'}</span>
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-xl border-slate-200 shadow-xl">
              {schoolYears.map((year) => (
                <SelectItem
                  key={year.id}
                  value={year.id.toString()}
                  className="text-sm font-medium focus:bg-blue-50 focus:text-[#0f2d5e] rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <span>S.Y. {year.name}</span>
                    {year.is_active && (
                      <span className="inline-flex items-center rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                        Active
                      </span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button className="gap-2 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-md">
            <Plus className="w-4 h-4" />
            Create Event
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Members</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                {loading ? (
                  <div className="h-7 bg-slate-200 rounded-lg w-12 animate-pulse" />
                ) : (
                  <div className="text-2xl font-bold text-slate-900">{stats.totalMembers}</div>
                )}
                <div className="text-[10px] text-slate-500 font-medium">Active memberships</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider text-slate-500">Events (S.Y.)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
                <CalendarRange className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                {loading ? (
                  <div className="h-7 bg-slate-200 rounded-lg w-12 animate-pulse" />
                ) : (
                  <div className="text-2xl font-bold text-slate-900">{stats.totalEvents}</div>
                )}
                <div className="text-[10px] text-blue-600 font-medium">{stats.upcomingEvents} upcoming</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider text-slate-500">Attendances</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                {loading ? (
                  <div className="h-7 bg-slate-200 rounded-lg w-12 animate-pulse" />
                ) : (
                  <div className="text-2xl font-bold text-slate-900">{stats.totalAttendance}</div>
                )}
                <div className="text-[10px] text-slate-500 font-medium">Yearly scan records</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider text-slate-500">Pending Actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                <ClipboardList className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                {loading ? (
                  <div className="h-7 bg-slate-200 rounded-lg w-12 animate-pulse" />
                ) : (
                  <div className="text-2xl font-bold text-slate-900">{stats.pendingTasks}</div>
                )}
                <div className="text-[10px] text-amber-600 font-medium">Needs attention</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Events & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Events */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Events</CardTitle>
            <CardDescription>Latest organization events</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentEvents.map((event) => (
              <div
                key={event.id}
                className="flex items-center justify-between p-4 rounded-lg border hover:bg-slate-50"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white flex flex-col items-center justify-center text-xs">
                    <span className="font-medium">
                      {new Date(event.event_date).toLocaleDateString('en-US', { month: 'short' })}
                    </span>
                    <span className="text-lg font-bold">
                      {new Date(event.event_date).getDate()}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{event.title}</h3>
                    <p className="text-sm text-slate-600">
                      {event.location || 'Location TBA'}
                    </p>
                  </div>
                </div>
                <Badge className={
                  event.status === 'upcoming' ? 'bg-blue-100 text-blue-700' :
                  event.status === 'ongoing' ? 'bg-green-100 text-green-700' :
                  'bg-slate-100 text-slate-600'
                }>
                  {event.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start gap-2" variant="outline">
              <Plus className="w-4 h-4" />
              Create Event
            </Button>
            <Button className="w-full justify-start gap-2" variant="outline">
              <Users className="w-4 h-4" />
              Manage Members
            </Button>
            <Button className="w-full justify-start gap-2" variant="outline">
              <Bell className="w-4 h-4" />
              Send Announcement
            </Button>
            <Button className="w-full justify-start gap-2" variant="outline">
              <ClipboardList className="w-4 h-4" />
              Assign Task
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest actions in your organization</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { action: 'New member joined', name: 'Sarah Johnson', time: '2 hours ago' },
              { action: 'Event created', name: 'Web Development Workshop', time: '5 hours ago' },
              { action: 'Task completed', name: 'Michael Chen', time: '1 day ago' },
            ].map((activity, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <p className="font-medium text-slate-900">{activity.action}</p>
                  <p className="text-sm text-slate-600">{activity.name}</p>
                </div>
                <span className="text-sm text-slate-500">{activity.time}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}