import { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Users, Search, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

export default function StudentEvents() {
  const [searchQuery, setSearchQuery] = useState('');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.get(`${API_URL}/events`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setEvents(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError('Failed to load events. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Separate events into upcoming and past based on status and date
  const upcomingEvents = events.filter((event) => {
    const eventDate = new Date(event.event_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return (
      (event.status === 'upcoming' || event.status === 'ongoing') &&
      eventDate >= today
    );
  });

  const pastEvents = events.filter((event) => {
    const eventDate = new Date(event.event_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return (
      event.status === 'completed' ||
      event.status === 'cancelled' ||
      eventDate < today
    );
  });

  // Filter events based on search query
  const filterEvents = (eventList) => {
    if (!searchQuery.trim()) return eventList;
    
    const query = searchQuery.toLowerCase();
    return eventList.filter(
      (event) =>
        event.title.toLowerCase().includes(query) ||
        event.organization?.name.toLowerCase().includes(query) ||
        event.location?.toLowerCase().includes(query)
    );
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      upcoming: { label: 'Upcoming', className: 'bg-blue-100 text-blue-700' },
      ongoing: { label: 'Ongoing', className: 'bg-green-100 text-green-700' },
      completed: { label: 'Completed', className: 'bg-slate-100 text-slate-600' },
      cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-700' },
    };
    
    const config = statusConfig[status] || statusConfig.upcoming;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'TBA';
    
    // If it's already in H:i format from API
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading events...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Events</h1>
          <p className="text-slate-600 mt-1">View organization events</p>
        </div>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-800">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const filteredUpcoming = filterEvents(upcomingEvents);
  const filteredPast = filterEvents(pastEvents);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Events</h1>
        <p className="text-slate-600 mt-1">View organization events</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="upcoming">
        <TabsList>
          <TabsTrigger value="upcoming">
            Upcoming ({filteredUpcoming.length})
          </TabsTrigger>
          <TabsTrigger value="past">
            Past ({filteredPast.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4 mt-6">
          {filteredUpcoming.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">
                  {searchQuery ? 'No events found matching your search' : 'No upcoming events'}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredUpcoming.map((event) => (
              <Card key={event.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white flex flex-col items-center justify-center shadow-md flex-shrink-0">
                      <span className="text-xs font-medium uppercase">
                        {new Date(event.event_date).toLocaleDateString('en-US', { month: 'short' })}
                      </span>
                      <span className="text-2xl font-bold">
                        {new Date(event.event_date).getDate()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <h3 className="text-lg font-bold text-slate-900">{event.title}</h3>
                        {getStatusBadge(event.status)}
                      </div>
                      {event.description && (
                        <p className="text-sm text-slate-600 mb-3 line-clamp-2">
                          {event.description}
                        </p>
                      )}
                      <div className="grid grid-cols-2 gap-2 text-sm text-slate-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          <span className="font-medium">
                            {event.organization?.name || 'Organization'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-slate-400" />
                          <span>{formatTime(event.event_time)}</span>
                        </div>
                        {event.location && (
                          <div className="flex items-center gap-2 col-span-2">
                            <MapPin className="w-4 h-4 text-slate-400" />
                            <span>{event.location}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="past" className="space-y-4 mt-6">
          {filteredPast.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">
                  {searchQuery ? 'No events found matching your search' : 'No past events'}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredPast.map((event) => (
              <Card key={event.id} className="opacity-70 hover:opacity-90 transition-opacity">
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    <div className="w-16 h-16 rounded-xl bg-slate-100 text-slate-600 flex flex-col items-center justify-center flex-shrink-0">
                      <span className="text-xs font-medium uppercase">
                        {new Date(event.event_date).toLocaleDateString('en-US', { month: 'short' })}
                      </span>
                      <span className="text-2xl font-bold">
                        {new Date(event.event_date).getDate()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <h3 className="text-lg font-bold text-slate-900">{event.title}</h3>
                        {getStatusBadge(event.status)}
                      </div>
                      {event.description && (
                        <p className="text-sm text-slate-600 mb-3 line-clamp-2">
                          {event.description}
                        </p>
                      )}
                      <div className="grid grid-cols-2 gap-2 text-sm text-slate-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          <span className="font-medium">
                            {event.organization?.name || 'Organization'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-slate-400" />
                          <span>{formatTime(event.event_time)}</span>
                        </div>
                        {event.location && (
                          <div className="flex items-center gap-2 col-span-2">
                            <MapPin className="w-4 h-4 text-slate-400" />
                            <span>{event.location}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}