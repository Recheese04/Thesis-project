import { useState, useEffect } from 'react';
import { Users, Calendar, ClipboardList, TrendingUp, Plus, Bell } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

export default function OfficerDashboard() {
  const [stats, setStats] = useState({
    totalMembers: 0,
    activeMembers: 0,
    upcomingEvents: 0,
    pendingTasks: 0,
  });
  const [recentEvents, setRecentEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch events and member stats
      const eventsResponse = await axios.get(`${API_URL}/events`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const events = eventsResponse.data;
      const upcoming = events.filter(e => e.status === 'upcoming').length;
      
      setStats({
        totalMembers: 45, // TODO: Replace with actual API call
        activeMembers: 38,
        upcomingEvents: upcoming,
        pendingTasks: 5,
      });

      setRecentEvents(events.slice(0, 3));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Officer Dashboard</h1>
          <p className="text-slate-600 mt-1">Manage your organization</p>
        </div>
        <Button className="gap-2 bg-gradient-to-r from-blue-600 to-blue-700">
          <Plus className="w-4 h-4" />
          Create Event
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Members</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <div className="text-3xl font-bold text-slate-900">{stats.totalMembers}</div>
                <div className="text-sm text-green-600">+3 this month</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Active Members</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <div className="text-3xl font-bold text-slate-900">{stats.activeMembers}</div>
                <div className="text-sm text-slate-600">{Math.round((stats.activeMembers / stats.totalMembers) * 100)}% active</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Upcoming Events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <div className="text-3xl font-bold text-slate-900">{stats.upcomingEvents}</div>
                <div className="text-sm text-slate-600">this month</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Pending Tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                <ClipboardList className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <div className="text-3xl font-bold text-slate-900">{stats.pendingTasks}</div>
                <div className="text-sm text-slate-600">need attention</div>
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