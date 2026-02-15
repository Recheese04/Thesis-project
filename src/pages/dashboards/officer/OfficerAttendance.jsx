import { useState, useEffect } from 'react';
import { Users, CheckCircle, XCircle, Clock, Calendar, Download } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function OfficerAttendance() {
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Mock data - replace with API
  const events = [
    { id: 1, title: 'Web Development Workshop', date: '2026-02-20', status: 'ongoing' },
    { id: 2, title: 'Leadership Summit', date: '2026-02-25', status: 'upcoming' },
  ];

  const attendanceData = [
    {
      id: 1,
      name: 'Sarah Johnson',
      studentId: '2021-00123',
      checkInTime: '1:58 PM',
      checkOutTime: null,
      status: 'present',
    },
    {
      id: 2,
      name: 'Michael Chen',
      studentId: '2021-00456',
      checkInTime: '2:05 PM',
      checkOutTime: null,
      status: 'late',
    },
    {
      id: 3,
      name: 'Emma Davis',
      studentId: '2021-00789',
      checkInTime: null,
      checkOutTime: null,
      status: 'absent',
    },
  ];

  const stats = {
    totalMembers: 45,
    present: 38,
    late: 5,
    absent: 2,
    attendanceRate: 95,
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusBadge = (status) => {
    const config = {
      present: { label: 'Present', className: 'bg-green-100 text-green-700' },
      late: { label: 'Late', className: 'bg-amber-100 text-amber-700' },
      absent: { label: 'Absent', className: 'bg-red-100 text-red-700' },
    };
    const { label, className } = config[status] || config.absent;
    return <Badge className={className}>{label}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Attendance Monitoring</h1>
          <p className="text-slate-600 mt-1">Track member attendance in real-time</p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          Export Report
        </Button>
      </div>

      {/* Event Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Event</CardTitle>
          <CardDescription>Choose an event to monitor attendance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {events.map((event) => (
              <button
                key={event.id}
                onClick={() => setSelectedEvent(event.id)}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  selectedEvent === event.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{event.title}</h3>
                    <p className="text-sm text-slate-600">
                      {new Date(event.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                  <Badge
                    className={
                      event.status === 'ongoing'
                        ? 'bg-green-100 text-green-700 ml-auto'
                        : 'bg-blue-100 text-blue-700 ml-auto'
                    }
                  >
                    {event.status}
                  </Badge>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedEvent && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Attendance Rate</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900">{stats.attendanceRate}%</div>
                <div className="mt-2 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-500 to-green-600"
                    style={{ width: `${stats.attendanceRate}%` }}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Total Members</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Users className="w-8 h-8 text-blue-600" />
                  <span className="text-3xl font-bold text-slate-900">{stats.totalMembers}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Present</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                  <span className="text-3xl font-bold text-slate-900">{stats.present}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Late</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Clock className="w-8 h-8 text-amber-600" />
                  <span className="text-3xl font-bold text-slate-900">{stats.late}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Absent</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <XCircle className="w-8 h-8 text-red-600" />
                  <span className="text-3xl font-bold text-slate-900">{stats.absent}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Attendance Table */}
          <Card>
            <CardHeader>
              <CardTitle>Live Attendance</CardTitle>
              <CardDescription>Real-time attendance tracking</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member</TableHead>
                      <TableHead>Student ID</TableHead>
                      <TableHead>Check In</TableHead>
                      <TableHead>Check Out</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendanceData.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="w-10 h-10">
                              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-bold">
                                {getInitials(record.name)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium text-slate-900">{record.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-sm">{record.studentId}</span>
                        </TableCell>
                        <TableCell>
                          {record.checkInTime ? (
                            <span className="text-slate-900">{record.checkInTime}</span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {record.checkOutTime ? (
                            <span className="text-slate-900">{record.checkOutTime}</span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(record.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}