import { useState, useEffect } from 'react';
import axios from 'axios';
import { CheckCircle, XCircle, Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';

const authH = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

export default function StudentAttendance() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchMyAttendance(); }, []);

  const fetchMyAttendance = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/attendance/my', authH());
      setRecords(res.data);
    } catch { toast.error('Failed to load attendance records'); }
    finally { setLoading(false); }
  };

  const totalEvents = records.length;
  const attended    = records.filter(r => r.status === 'checked_in' || r.status === 'checked_out').length;
  const checkedOut  = records.filter(r => r.status === 'checked_out').length;
  const rate        = totalEvents > 0 ? Math.round((attended / totalEvents) * 100) : 0;

  const formatTime = (dt) => {
    if (!dt) return '—';
    return new Date(dt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dt) => {
    if (!dt) return '—';
    return new Date(dt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const StatusBadge = ({ status }) => (
    <Badge className={status === 'checked_out' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}>
      {status === 'checked_out' ? 'Completed' : 'Checked In'}
    </Badge>
  );

  return (
    <div className="space-y-5 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">My Attendance</h1>
        <p className="text-slate-600 mt-1 text-sm">View your attendance records</p>
      </div>

      {/* Stats — 2 cols on mobile, 4 on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="pb-2 sm:pb-3"><CardDescription className="text-xs sm:text-sm">Attendance Rate</CardDescription></CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl sm:text-3xl font-bold text-slate-900">{rate}%</div>
            <div className="mt-2 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all" style={{ width: `${rate}%` }} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 sm:pb-3"><CardDescription className="text-xs sm:text-sm">Total Records</CardDescription></CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl sm:text-3xl font-bold text-slate-900">{totalEvents}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 sm:pb-3"><CardDescription className="text-xs sm:text-sm">Checked In</CardDescription></CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
              <span className="text-2xl sm:text-3xl font-bold text-slate-900">{attended}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 sm:pb-3"><CardDescription className="text-xs sm:text-sm">Completed</CardDescription></CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center gap-2">
              <XCircle className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
              <span className="text-2xl sm:text-3xl font-bold text-slate-900">{checkedOut}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Records */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Attendance Records</CardTitle>
          <CardDescription>Your complete attendance history</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-12 text-center text-slate-400 text-sm">Loading...</div>
          ) : records.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">No attendance records found.</div>
          ) : (
            <>
              {/* Mobile card view */}
              <div className="sm:hidden space-y-3">
                {records.map((record) => (
                  <div key={record.id} className="rounded-xl border border-slate-200 p-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-800 text-sm truncate">{record.event?.title ?? '—'}</p>
                        <p className="text-xs text-slate-500 truncate">{record.event?.organization?.name ?? '—'}</p>
                      </div>
                      <StatusBadge status={record.status} />
                    </div>
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {formatDate(record.time_in)}
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
                  </div>
                ))}
              </div>

              {/* Desktop table view */}
              <div className="hidden sm:block rounded-lg border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Event</TableHead>
                      <TableHead>Organization</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Check In</TableHead>
                      <TableHead>Check Out</TableHead>
                      <TableHead>Duration</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">{record.event?.title ?? '—'}</TableCell>
                        <TableCell>{record.event?.organization?.name ?? '—'}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            {formatDate(record.time_in)}
                          </div>
                        </TableCell>
                        <TableCell><StatusBadge status={record.status} /></TableCell>
                        <TableCell>{formatTime(record.time_in)}</TableCell>
                        <TableCell>{formatTime(record.time_out)}</TableCell>
                        <TableCell>{record.formatted_duration ?? '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}