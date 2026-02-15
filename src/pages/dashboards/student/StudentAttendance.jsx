import { Calendar, Clock, MapPin, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function StudentAttendance() {
  // Mock data - replace with actual API call
  const stats = {
    totalEvents: 20,
    attended: 16,
    missed: 4,
    rate: 80,
  };

  const records = [
    {
      id: 1,
      event: 'Python Programming Bootcamp',
      organization: 'IT Society',
      date: '2026-02-01',
      time: '1:00 PM',
      location: 'IT Lab 201',
      status: 'present',
      checkIn: '12:58 PM',
      checkOut: '5:45 PM',
    },
    {
      id: 2,
      event: 'Leadership Summit 2026',
      organization: 'Student Council',
      date: '2026-02-10',
      time: '9:00 AM',
      location: 'Auditorium',
      status: 'present',
      checkIn: '8:55 AM',
      checkOut: '3:50 PM',
    },
    {
      id: 3,
      event: 'Environmental Campaign',
      organization: 'Green Society',
      date: '2026-02-05',
      time: '9:00 AM',
      location: 'University Park',
      status: 'absent',
      checkIn: null,
      checkOut: null,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">My Attendance</h1>
        <p className="text-slate-600 mt-1">View your attendance records</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Attendance Rate</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{stats.rate}%</div>
            <div className="mt-2 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-blue-600"
                style={{ width: `${stats.rate}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{stats.totalEvents}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Attended</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <span className="text-3xl font-bold text-slate-900">{stats.attended}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Missed</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <XCircle className="w-8 h-8 text-red-600" />
              <span className="text-3xl font-bold text-slate-900">{stats.missed}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Records */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance Records</CardTitle>
          <CardDescription>Your complete attendance history</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Organization</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Check In/Out</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">{record.event}</TableCell>
                    <TableCell>{record.organization}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        {new Date(record.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Clock className="w-4 h-4 text-slate-400" />
                        {record.time}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-slate-400" />
                        {record.location}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          record.status === 'present'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }
                      >
                        {record.status === 'present' ? 'Present' : 'Absent'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {record.checkIn ? (
                        <div className="text-sm">
                          <div>In: {record.checkIn}</div>
                          <div className="text-slate-500">Out: {record.checkOut}</div>
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}