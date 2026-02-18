import { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Search, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

export default function StudentEvents() {
  const [searchQuery, setSearchQuery] = useState('');
  const [events, setEvents]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);

  useEffect(() => { fetchEvents(); }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const token    = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/events`, { headers: { Authorization: `Bearer ${token}` } });
      setEvents(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError('Failed to load events. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const upcomingEvents = events.filter((event) => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return (event.status === 'upcoming' || event.status === 'ongoing') && new Date(event.event_date) >= today;
  });

  const pastEvents = events.filter((event) => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return event.status === 'completed' || event.status === 'cancelled' || new Date(event.event_date) < today;
  });

  const filterEvents = (list) => {
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(e =>
      e.title.toLowerCase().includes(q) ||
      e.organization?.name?.toLowerCase().includes(q) ||
      e.location?.toLowerCase().includes(q)
    );
  };

  const getStatusBadge = (status) => {
    const map = {
      upcoming:  { label: 'Upcoming',  cls: 'bg-blue-100 text-blue-700' },
      ongoing:   { label: 'Ongoing',   cls: 'bg-green-100 text-green-700' },
      completed: { label: 'Completed', cls: 'bg-slate-100 text-slate-600' },
      cancelled: { label: 'Cancelled', cls: 'bg-red-100 text-red-700' },
    };
    const c = map[status] || map.upcoming;
    return <Badge className={c.cls}>{c.label}</Badge>;
  };

  const formatTime = (t) => {
    if (!t) return 'TBA';
    const [h, m] = t.split(':');
    const hour = parseInt(h);
    return `${hour % 12 || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`;
  };

  const EventCard = ({ event, muted = false }) => (
    <Card className={`hover:shadow-md transition-shadow ${muted ? 'opacity-70 hover:opacity-90' : ''}`}>
      <CardContent className="p-4 sm:p-6">
        <div className="flex gap-3 sm:gap-4">
          {/* Date badge */}
          <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl flex flex-col items-center justify-center shadow-sm flex-shrink-0 ${
            muted ? 'bg-slate-100 text-slate-600' : 'bg-gradient-to-br from-blue-500 to-blue-600 text-white'
          }`}>
            <span className="text-[10px] font-semibold uppercase leading-none">
              {new Date(event.event_date).toLocaleDateString('en-US', { month: 'short' })}
            </span>
            <span className="text-xl sm:text-2xl font-bold leading-tight">
              {new Date(event.event_date).getDate()}
            </span>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 line-clamp-1 flex-1">{event.title}</h3>
              <div className="shrink-0">{getStatusBadge(event.status)}</div>
            </div>
            {event.description && (
              <p className="text-xs sm:text-sm text-slate-600 mb-2 line-clamp-2">{event.description}</p>
            )}
            {/* Meta info — wraps on mobile */}
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
              {event.organization?.name && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                  <span className="truncate max-w-[120px]">{event.organization.name}</span>
                </span>
              )}
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                {formatTime(event.event_time)}
              </span>
              {event.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                  <span className="truncate max-w-[150px]">{event.location}</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
          <p className="text-slate-600 text-sm">Loading events...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Events</h1>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-5 pb-5">
            <p className="text-red-800 text-sm">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const filteredUpcoming = filterEvents(upcomingEvents);
  const filteredPast     = filterEvents(pastEvents);

  return (
    <div className="space-y-5 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Events</h1>
        <p className="text-slate-600 mt-1 text-sm">View organization events</p>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-4 pb-4">
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
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="upcoming" className="flex-1 sm:flex-none">
            Upcoming ({filteredUpcoming.length})
          </TabsTrigger>
          <TabsTrigger value="past" className="flex-1 sm:flex-none">
            Past ({filteredPast.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-3 sm:space-y-4 mt-5">
          {filteredUpcoming.length === 0 ? (
            <Card><CardContent className="p-10 text-center">
              <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">{searchQuery ? 'No events found matching your search' : 'No upcoming events'}</p>
            </CardContent></Card>
          ) : (
            filteredUpcoming.map(event => <EventCard key={event.id} event={event} />)
          )}
        </TabsContent>

        <TabsContent value="past" className="space-y-3 sm:space-y-4 mt-5">
          {filteredPast.length === 0 ? (
            <Card><CardContent className="p-10 text-center">
              <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">{searchQuery ? 'No events found matching your search' : 'No past events'}</p>
            </CardContent></Card>
          ) : (
            filteredPast.map(event => <EventCard key={event.id} event={event} muted />)
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}