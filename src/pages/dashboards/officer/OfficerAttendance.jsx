import { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, CheckCircle, XCircle, Clock, Calendar, Download, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';

const authH = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

export default function OfficerAttendance() {
  const [events, setEvents]                       = useState([]);
  const [selectedEvent, setSelectedEvent]         = useState(null);
  const [attendance, setAttendance]               = useState([]);
  const [stats, setStats]                         = useState(null);
  const [loadingEvents, setLoadingEvents]         = useState(true);
  const [loadingAttendance, setLoadingAttendance] = useState(false);

  useEffect(() => { fetchEvents(); }, []);
  useEffect(() => { if (selectedEvent) fetchAttendance(selectedEvent.id); }, [selectedEvent]);

  const fetchEvents = async () => {
    try {
      setLoadingEvents(true);
      const res = await axios.get('/api/events', authH());
      setEvents(res.data.filter(e => e.status === 'ongoing' || e.status === 'upcoming'));
    } catch { toast.error('Failed to load events'); }
    finally { setLoadingEvents(false); }
  };

  const fetchAttendance = async (eventId) => {
    try {
      setLoadingAttendance(true);
      const res = await axios.get(`/api/attendance/event/${eventId}`, authH());
      setAttendance(res.data.attendance ?? []);
      setStats(res.data.stats ?? null);
    } catch { toast.error('Failed to load attendance'); }
    finally { setLoadingAttendance(false); }
  };

  const formatTime = (dt) => {
    if (!dt) return '—';
    return new Date(dt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const getInitials = (name) =>
    (name ?? '?').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const StatusBadge = ({ status }) => {
    if (status === 'checked_out') return <Badge className="bg-blue-100 text-blue-700 text-xs">Completed</Badge>;
    if (status === 'checked_in')  return <Badge className="bg-green-100 text-green-700 text-xs">Checked In</Badge>;
    return <Badge className="bg-red-100 text-red-700 text-xs">Absent</Badge>;
  };

  const handleExport = () => {
    if (!attendance.length) return;
    const rows = [
      ['Name', 'Student ID', 'Check In', 'Check Out', 'Duration', 'Status'],
      ...attendance.map(r => [
        r.student?.name ?? '—', r.student?.student_id ?? '—',
        formatTime(r.time_in), formatTime(r.time_out),
        r.formatted_duration ?? '—', r.status,
      ])
    ];
    const csv  = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = Object.assign(document.createElement('a'), { href: url, download: `attendance_${selectedEvent?.title ?? 'export'}.csv` });
    a.click(); URL.revokeObjectURL(url);
    toast.success('Exported successfully');
  };

  return (
    <div className="space-y-5 sm:space-y-6">

      {/* Header */}
      <div className="flex flex-wrap justify-between items-start gap-3">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold text-slate-900">Attendance Monitoring</h1>
          <p className="text-slate-600 mt-1 text-sm">Track member attendance in real-time</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {selectedEvent && (
            <Button variant="outline" size="sm" onClick={() => fetchAttendance(selectedEvent.id)} disabled={loadingAttendance}>
              <RefreshCw className={`w-4 h-4 mr-1.5 ${loadingAttendance ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleExport} disabled={!attendance.length}>
            <Download className="w-4 h-4 mr-1.5" />
            <span className="hidden sm:inline">Export CSV</span>
            <span className="sm:hidden">Export</span>
          </Button>
        </div>
      </div>

      {/* Event Selection */}
      <Card>
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="text-base sm:text-lg">Select Event</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Choose an event to monitor attendance</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingEvents ? (
            <div className="py-8 text-center text-slate-400 text-sm">Loading events...</div>
          ) : events.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-sm">No ongoing or upcoming events.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {events.map((event) => (
                <button key={event.id} onClick={() => setSelectedEvent(event)}
                  className={`p-3 sm:p-4 rounded-xl border-2 transition-all text-left ${
                    selectedEvent?.id === event.id ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center shrink-0">
                      <Calendar className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-900 text-sm truncate">{event.title}</h3>
                      <p className="text-xs text-slate-600">
                        {new Date(event.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                    <Badge className={`${event.status === 'ongoing' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'} shrink-0 text-xs`}>
                      {event.status}
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats + Attendance */}
      {selectedEvent && (
        <>
          {stats && (
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              {[
                { label: 'Total Check-ins', icon: Users,         color: 'text-blue-600',  value: stats.total },
                { label: 'Currently In',    icon: CheckCircle,   color: 'text-green-600', value: stats.checked_in },
                { label: 'Checked Out',     icon: XCircle,       color: 'text-blue-600',  value: stats.checked_out },
              ].map(({ label, icon: Icon, color, value }) => (
                <Card key={label}>
                  <CardHeader className="pb-1 sm:pb-3 pt-3 sm:pt-4 px-3 sm:px-6">
                    <CardDescription className="text-[10px] sm:text-sm">{label}</CardDescription>
                  </CardHeader>
                  <CardContent className="px-3 sm:px-6 pb-3 sm:pb-4">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <Icon className={`w-5 h-5 sm:w-8 sm:h-8 ${color}`} />
                      <span className="text-xl sm:text-3xl font-bold text-slate-900">{value}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg">Live Attendance — {selectedEvent.title}</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Real-time attendance tracking</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingAttendance ? (
                <div className="py-12 text-center text-slate-400 text-sm">Loading attendance...</div>
              ) : attendance.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-sm">No check-ins recorded yet.</div>
              ) : (
                <>
                  {/* Mobile card list */}
                  <div className="sm:hidden space-y-3">
                    {attendance.map((record) => (
                      <div key={record.id} className="rounded-xl border border-slate-200 p-3 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <Avatar className="w-8 h-8 shrink-0">
                              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-bold text-xs">
                                {getInitials(record.student?.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="font-medium text-slate-900 text-sm truncate">{record.student?.name ?? '—'}</p>
                              <p className="text-xs text-slate-500 font-mono">{record.student?.student_number ?? '—'}</p>
                            </div>
                          </div>
                          <StatusBadge status={record.status} />
                        </div>
                        <div className="grid grid-cols-3 gap-1 text-xs">
                          <div>
                            <p className="text-slate-400 mb-0.5">Check In</p>
                            <p className="font-medium text-slate-700">{formatTime(record.time_in)}</p>
                          </div>
                          <div>
                            <p className="text-slate-400 mb-0.5">Check Out</p>
                            <p className="font-medium text-slate-700">{formatTime(record.time_out)}</p>
                          </div>
                          <div>
                            <p className="text-slate-400 mb-0.5">Duration</p>
                            <p className="font-medium text-slate-700">{record.formatted_duration ?? '—'}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-[10px] capitalize">{record.attendance_type}</Badge>
                      </div>
                    ))}
                  </div>

                  {/* Desktop table */}
                  <div className="hidden sm:block rounded-lg border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Member</TableHead>
                          <TableHead>Student ID</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Check In</TableHead>
                          <TableHead>Check Out</TableHead>
                          <TableHead>Duration</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {attendance.map((record) => (
                          <TableRow key={record.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="w-9 h-9">
                                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-bold text-xs">
                                    {getInitials(record.student?.name)}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="font-medium text-slate-900">{record.student?.name ?? '—'}</span>
                              </div>
                            </TableCell>
                            <TableCell><span className="font-mono text-sm">{record.student?.student_number ?? '—'}</span></TableCell>
                            <TableCell><Badge variant="outline" className="text-xs capitalize">{record.attendance_type}</Badge></TableCell>
                            <TableCell>{formatTime(record.time_in)}</TableCell>
                            <TableCell>{formatTime(record.time_out)}</TableCell>
                            <TableCell>{record.formatted_duration ?? '—'}</TableCell>
                            <TableCell><StatusBadge status={record.status} /></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}