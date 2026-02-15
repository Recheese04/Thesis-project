import { useState, useEffect } from 'react';
import { Calendar, Plus, QrCode, Users, Edit, Trash2, Eye } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

export default function OfficerEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/events`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEvents(response.data);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const upcomingEvents = events.filter((e) => e.status === 'upcoming' || e.status === 'ongoing');
  const pastEvents = events.filter((e) => e.status === 'completed' || e.status === 'cancelled');

  const getStatusColor = (status) => {
    const colors = {
      upcoming: 'bg-blue-100 text-blue-700',
      ongoing: 'bg-green-100 text-green-700',
      completed: 'bg-slate-100 text-slate-600',
      cancelled: 'bg-red-100 text-red-700',
    };
    return colors[status] || colors.upcoming;
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'TBA';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const handleGenerateQR = async (eventId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/events/${eventId}/qr`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      // TODO: Show QR code in modal or download
      console.log('QR Code:', response.data);
      alert(`QR Code: ${response.data.qr_code}`);
    } catch (error) {
      console.error('Error generating QR:', error);
    }
  };

  const EventCard = ({ event }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-bold text-slate-900">{event.title}</h3>
              <Badge className={getStatusColor(event.status)}>{event.status}</Badge>
            </div>
            
            {event.description && (
              <p className="text-sm text-slate-600 mb-3 line-clamp-2">{event.description}</p>
            )}

            <div className="grid grid-cols-2 gap-2 text-sm text-slate-600 mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>
                  {new Date(event.event_date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span>{formatTime(event.event_time)}</span>
              </div>
              {event.location && (
                <div className="flex items-center gap-2 col-span-2">
                  <span className="font-medium">{event.location}</span>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="gap-2"
                onClick={() => handleGenerateQR(event.id)}
              >
                <QrCode className="w-4 h-4" />
                QR Code
              </Button>
              <Button size="sm" variant="outline" className="gap-2">
                <Users className="w-4 h-4" />
                Attendance
              </Button>
              <Button size="sm" variant="outline" className="gap-2">
                <Edit className="w-4 h-4" />
                Edit
              </Button>
            </div>
          </div>

          <div className="flex-shrink-0">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white flex flex-col items-center justify-center shadow-md">
              <span className="text-xs font-medium uppercase">
                {new Date(event.event_date).toLocaleDateString('en-US', { month: 'short' })}
              </span>
              <span className="text-2xl font-bold">
                {new Date(event.event_date).getDate()}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Events</h1>
          <p className="text-slate-600 mt-1">Create and manage organization events</p>
        </div>
        <Button className="gap-2 bg-gradient-to-r from-blue-600 to-blue-700">
          <Plus className="w-4 h-4" />
          Create Event
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{events.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Upcoming</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{upcomingEvents.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Completed</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">
              {events.filter((e) => e.status === 'completed').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Events Tabs */}
      <Tabs defaultValue="upcoming">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming ({upcomingEvents.length})</TabsTrigger>
          <TabsTrigger value="past">Past ({pastEvents.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4 mt-6">
          {loading ? (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-slate-500">Loading events...</p>
              </CardContent>
            </Card>
          ) : upcomingEvents.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">No upcoming events</p>
                <Button className="mt-4 gap-2">
                  <Plus className="w-4 h-4" />
                  Create First Event
                </Button>
              </CardContent>
            </Card>
          ) : (
            upcomingEvents.map((event) => <EventCard key={event.id} event={event} />)
          )}
        </TabsContent>

        <TabsContent value="past" className="space-y-4 mt-6">
          {pastEvents.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">No past events</p>
              </CardContent>
            </Card>
          ) : (
            pastEvents.map((event) => (
              <div key={event.id} className="opacity-70">
                <EventCard event={event} />
              </div>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}