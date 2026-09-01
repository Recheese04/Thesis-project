import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
  Users, CheckCircle, XCircle, Clock, Calendar, Download, RefreshCw,
  Search, ListFilter, LayoutGrid, UserPlus, LogOut, Loader2, Trash2,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

const authH = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

export default function OfficerAttendance() {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [stats, setStats] = useState(null);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grouped');

  // Manual Check-In state
  const [manualOpen, setManualOpen] = useState(false);
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [manualRemarks, setManualRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Check-Out state
  const [checkoutTarget, setCheckoutTarget] = useState(null);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState(null);

  const orgId = localStorage.getItem('organization_id');

  useEffect(() => { fetchEvents(); }, []);
  useEffect(() => { if (selectedEvent) fetchAttendance(selectedEvent.id); }, [selectedEvent]);

  const fetchEvents = async () => {
    try {
      setLoadingEvents(true);
      const res = await axios.get('/api/events?role=officer', authH());
      setEvents(res.data);
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

  // ── Fetch org members for manual check-in ─────────────────────────────
  const fetchMembers = async () => {
    if (!orgId) return;
    setLoadingMembers(true);
    try {
      const res = await axios.get(`/api/organizations/${orgId}/members`, authH());
      // Filter to only active members
      const active = (res.data || []).filter(m => m.status === 'active');
      setMembers(active);
    } catch {
      toast.error('Failed to load members');
    } finally {
      setLoadingMembers(false);
    }
  };

  const openManualDialog = () => {
    setSelectedUserId('');
    setManualRemarks('');
    setMemberSearch('');
    setManualOpen(true);
    fetchMembers();
  };

  // ── Manual Check-In ───────────────────────────────────────────────────
  const handleManualCheckIn = async () => {
    if (!selectedUserId || !selectedEvent) {
      toast.error('Please select a member.');
      return;
    }
    setSubmitting(true);
    try {
      await axios.post('/api/attendance/manual-checkin', {
        event_id: selectedEvent.id,
        user_id: selectedUserId,
        remarks: manualRemarks || null,
      }, authH());
      toast.success('Manual check-in recorded!');
      setManualOpen(false);
      fetchAttendance(selectedEvent.id);
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.errors?.user_id?.[0] || 'Check-in failed.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Manual Check-Out ──────────────────────────────────────────────────
  const handleManualCheckOut = async () => {
    if (!checkoutTarget) return;
    try {
      await axios.post('/api/attendance/manual-checkout', {
        attendance_id: checkoutTarget.id,
      }, authH());
      toast.success('Checked out successfully!');
      setCheckoutTarget(null);
      fetchAttendance(selectedEvent.id);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Check-out failed.');
      setCheckoutTarget(null);
    }
  };

  // ── Delete Attendance ─────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await axios.delete(`/api/attendance/${deleteTarget.id}`, authH());
      toast.success('Record deleted.');
      setDeleteTarget(null);
      fetchAttendance(selectedEvent.id);
    } catch {
      toast.error('Failed to delete record.');
      setDeleteTarget(null);
    }
  };

  const formatTime = (dt) => {
    if (!dt) return '—';
    return new Date(dt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const getInitials = (name) =>
    (name ?? '?').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const StatusBadge = ({ status }) => {
    if (status === 'checked_out') return <Badge className="bg-blue-100 text-blue-700 text-xs">Completed</Badge>;
    if (status === 'checked_in') return <Badge className="bg-green-100 text-green-700 text-xs">Checked In</Badge>;
    return <Badge className="bg-red-100 text-red-700 text-xs">Absent</Badge>;
  };

  const handleExport = () => {
    if (!attendance.length) return;
    const rows = [
      ['Name', 'Student ID', 'Check In', 'Check Out', 'Duration', 'Status'],
      ...attendance.map(r => [
        r.user?.name ?? '—', r.user?.student_number ?? '—',
        formatTime(r.time_in), formatTime(r.time_out),
        r.formatted_duration ?? '—', r.status,
      ])
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement('a'), { href: url, download: `attendance_${selectedEvent?.title ?? 'export'}.csv` });
    a.click(); URL.revokeObjectURL(url);
    toast.success('Exported successfully');
  };

  const filteredAttendance = useMemo(() => {
    if (!searchQuery.trim()) return attendance;
    const q = searchQuery.toLowerCase();
    return attendance.filter(a =>
      a.user?.name?.toLowerCase().includes(q) ||
      a.user?.student_number?.toLowerCase().includes(q)
    );
  }, [attendance, searchQuery]);

  // Filtered member list for the manual check-in dialog
  const filteredMembers = useMemo(() => {
    if (!memberSearch.trim()) return members;
    const q = memberSearch.toLowerCase();
    return members.filter(m => {
      const name = `${m.user?.first_name || ''} ${m.user?.last_name || ''}`.toLowerCase();
      const sid = (m.user?.student_number || '').toLowerCase();
      return name.includes(q) || sid.includes(q);
    });
  }, [members, memberSearch]);

  const AttendanceRow = ({ record }) => (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3">
          <Avatar className="w-9 h-9">
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-bold text-xs">
              {getInitials(record.user?.name)}
            </AvatarFallback>
          </Avatar>
          <span className="font-medium text-slate-900">{record.user?.name ?? '—'}</span>
        </div>
      </TableCell>
      <TableCell><span className="font-mono text-sm">{record.user?.student_number ?? '—'}</span></TableCell>
      <TableCell><Badge variant="outline" className="text-xs capitalize">{record.attendance_type}</Badge></TableCell>
      <TableCell>{formatTime(record.time_in)}</TableCell>
      <TableCell>{formatTime(record.time_out)}</TableCell>
      <TableCell>{record.formatted_duration ?? '—'}</TableCell>
      <TableCell><StatusBadge status={record.status} /></TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          {record.status === 'checked_in' && (
            <Button variant="ghost" size="icon" className="h-7 w-7 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
              onClick={() => setCheckoutTarget(record)} title="Check Out">
              <LogOut className="w-3.5 h-3.5" />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-red-600 hover:bg-red-50"
            onClick={() => setDeleteTarget(record)} title="Delete">
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );

  const AttendanceMobileCard = ({ record }) => (
    <div className="rounded-xl border border-slate-200 p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Avatar className="w-8 h-8 shrink-0">
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-bold text-xs">
              {getInitials(record.user?.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="font-medium text-slate-900 text-sm truncate">{record.user?.name ?? '—'}</p>
            <p className="text-xs text-slate-500 font-mono">{record.user?.student_number ?? '—'}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <StatusBadge status={record.status} />
          {record.status === 'checked_in' && (
            <Button variant="ghost" size="icon" className="h-7 w-7 text-blue-500 hover:text-blue-700"
              onClick={() => setCheckoutTarget(record)}>
              <LogOut className="w-3.5 h-3.5" />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-red-600"
            onClick={() => setDeleteTarget(record)}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
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
  );

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
            <>
              <Button size="sm" onClick={openManualDialog}
                className="bg-violet-600 hover:bg-violet-700 text-white gap-1.5">
                <UserPlus className="w-4 h-4" /> Manual Check-In
              </Button>
              <Button variant="outline" size="sm" onClick={() => fetchAttendance(selectedEvent.id)} disabled={loadingAttendance}>
                <RefreshCw className={`w-4 h-4 mr-1.5 ${loadingAttendance ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
            </>
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
            <div className="py-8 text-center text-slate-400 text-sm">No events found.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {events.map((event) => (
                <button key={event.id} onClick={() => setSelectedEvent(event)}
                  className={`p-3 sm:p-4 rounded-xl border-2 transition-all text-left ${selectedEvent?.id === event.id ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'
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
                { label: 'Total Check-ins', icon: Users, color: 'text-blue-600', value: stats.total },
                { label: 'Currently In', icon: CheckCircle, color: 'text-green-600', value: stats.checked_in },
                { label: 'Checked Out', icon: XCircle, color: 'text-blue-600', value: stats.checked_out },
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
            <CardHeader className="pb-3 border-b border-slate-100 mb-4 sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="text-base sm:text-lg">Live Attendance — {selectedEvent.title}</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Real-time attendance tracking</CardDescription>
              </div>

              {/* Controls */}
              <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Search name or ID..."
                    className="pl-9 h-9 text-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex items-center w-full sm:w-auto p-1 bg-slate-100 rounded-lg shrink-0">
                  <button
                    onClick={() => setViewMode('flat')}
                    className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode === 'flat' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                      }`}
                  >
                    <ListFilter className="w-3.5 h-3.5" /> View All
                  </button>
                  <button
                    onClick={() => setViewMode('grouped')}
                    className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode === 'grouped' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                      }`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" /> Grouped
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loadingAttendance ? (
                <div className="py-12 text-center text-slate-400 text-sm">Loading attendance...</div>
              ) : attendance.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-sm">No check-ins recorded yet.</div>
              ) : filteredAttendance.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-sm">No records match your search.</div>
              ) : viewMode === 'grouped' ? (
                /* GROUPED VIEW */
                <div className="space-y-10">
                  {Object.entries(
                    filteredAttendance.reduce((acc, record) => {
                      const dept = record.user?.college?.name || 'Unknown College';
                      const course = record.user?.course?.name || record.user?.course || 'Unknown Course';
                      const year = record.user?.year_level ? `Year ${record.user.year_level}` : 'Unknown Year';
                      const key = `${dept} — ${course} (${year})`;

                      if (!acc[key]) acc[key] = [];
                      acc[key].push(record);
                      return acc;
                    }, {})
                  ).map(([groupName, groupRecords]) => (
                    <div key={groupName} className="space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b">
                        <h3 className="font-semibold text-slate-800 text-sm sm:text-base">{groupName}</h3>
                        <Badge variant="secondary" className="text-xs bg-slate-100 text-slate-600">
                          {groupRecords.length} {groupRecords.length === 1 ? 'Student' : 'Students'}
                        </Badge>
                      </div>

                      {/* Mobile card list */}
                      <div className="sm:hidden space-y-3">
                        {groupRecords.map((record) => <AttendanceMobileCard key={record.id} record={record} />)}
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
                              <TableHead className="w-20">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {groupRecords.map((record) => <AttendanceRow key={record.id} record={record} />)}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* FLAT VIEW (ALL) */
                <div className="space-y-4">
                  {/* Mobile card list */}
                  <div className="sm:hidden space-y-3">
                    {filteredAttendance.map((record) => <AttendanceMobileCard key={record.id} record={record} />)}
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
                          <TableHead className="w-20">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredAttendance.map((record) => <AttendanceRow key={record.id} record={record} />)}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* ── Manual Check-In Dialog ───────────────────────────────────────── */}
      <Dialog open={manualOpen} onOpenChange={setManualOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-violet-600" /> Manual Check-In
            </DialogTitle>
            <DialogDescription>
              Select a member to manually record their attendance for <strong>{selectedEvent?.title}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Member search + select */}
            <div className="space-y-2">
              <Label>Member</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search by name or student ID…"
                  className="pl-9"
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                />
              </div>

              {loadingMembers ? (
                <div className="py-6 text-center text-slate-400 text-sm flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading members…
                </div>
              ) : (
                <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-200 divide-y divide-slate-100">
                  {filteredMembers.length === 0 ? (
                    <div className="py-6 text-center text-sm text-slate-400">No members found</div>
                  ) : (
                    filteredMembers.map(m => {
                      const name = `${m.user?.first_name || ''} ${m.user?.last_name || ''}`.trim();
                      const userId = String(m.user_id);
                      const isSelected = selectedUserId === userId;
                      return (
                        <button key={m.id} type="button"
                          onClick={() => setSelectedUserId(userId)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-all ${
                            isSelected
                              ? 'bg-violet-50 border-l-3 border-violet-500'
                              : 'hover:bg-slate-50'
                          }`}
                        >
                          <Avatar className="w-8 h-8 shrink-0">
                            <AvatarFallback className={`text-xs font-bold ${isSelected ? 'bg-violet-500 text-white' : 'bg-slate-200 text-slate-600'}`}>
                              {getInitials(name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium truncate ${isSelected ? 'text-violet-700' : 'text-slate-800'}`}>{name || 'Unknown'}</p>
                            <p className="text-xs text-slate-400 font-mono">{m.user?.student_number || '—'}</p>
                          </div>
                          {isSelected && (
                            <CheckCircle className="w-4 h-4 text-violet-600 shrink-0" />
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            {/* Remarks */}
            <div className="space-y-2">
              <Label>Remarks <span className="text-xs text-slate-400">(optional)</span></Label>
              <Textarea
                placeholder="e.g. Late arrival, excused…"
                value={manualRemarks}
                onChange={(e) => setManualRemarks(e.target.value)}
                className="resize-none h-20"
              />
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button variant="ghost" onClick={() => setManualOpen(false)} disabled={submitting}>Cancel</Button>
            <Button onClick={handleManualCheckIn} disabled={submitting || !selectedUserId}
              className="bg-violet-600 hover:bg-violet-700 text-white gap-1.5">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              {submitting ? 'Checking In…' : 'Check In'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Check-Out Confirmation ────────────────────────────────────────── */}
      <AlertDialog open={!!checkoutTarget} onOpenChange={(v) => !v && setCheckoutTarget(null)}>
        <AlertDialogContent className="rounded-2xl max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Check out this student?</AlertDialogTitle>
            <AlertDialogDescription>
              Mark <strong>{checkoutTarget?.user?.name ?? 'this student'}</strong> as checked out from{' '}
              <strong>{selectedEvent?.title}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleManualCheckOut} className="bg-blue-600 hover:bg-blue-700 text-white">
              <LogOut className="mr-2 h-4 w-4" /> Check Out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Delete Confirmation ───────────────────────────────────────────── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-2xl max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this record?</AlertDialogTitle>
            <AlertDialogDescription>
              Permanently remove the attendance record for <strong>{deleteTarget?.user?.name ?? 'this student'}</strong>. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white">
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}