import { useState } from 'react';
import { Users, Search, Mail, Phone, MoreVertical, UserPlus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export default function OfficerMembers() {
  const [searchQuery, setSearchQuery] = useState('');

  const members = [
    { id: 1, name: 'Sarah Johnson',  studentId: '2021-00123', email: 'sarah.j@university.edu',   phone: '+63 912 345 6789', course: 'Computer Science',      yearLevel: '3rd Year', role: 'Officer', status: 'active', attendanceRate: 95 },
    { id: 2, name: 'Michael Chen',   studentId: '2021-00456', email: 'michael.c@university.edu', phone: '+63 923 456 7890', course: 'Information Technology', yearLevel: '2nd Year', role: 'Member',  status: 'active', attendanceRate: 88 },
    { id: 3, name: 'Emma Davis',     studentId: '2021-00789', email: 'emma.d@university.edu',    phone: '+63 934 567 8901', course: 'Computer Science',      yearLevel: '3rd Year', role: 'Member',  status: 'active', attendanceRate: 72 },
  ];

  const filtered = searchQuery.trim()
    ? members.filter(m => {
        const q = searchQuery.toLowerCase();
        return m.name.toLowerCase().includes(q) || m.studentId.toLowerCase().includes(q) ||
               m.email.toLowerCase().includes(q) || m.course.toLowerCase().includes(q);
      })
    : members;

  const getInitials = (name) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const MemberActions = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <MoreVertical className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="rounded-xl">
        <DropdownMenuItem>View Profile</DropdownMenuItem>
        <DropdownMenuItem>Edit Member</DropdownMenuItem>
        <DropdownMenuItem>Send Message</DropdownMenuItem>
        <DropdownMenuItem className="text-red-600">Remove Member</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className="space-y-5 sm:space-y-6">

      {/* Header */}
      <div className="flex flex-wrap justify-between items-start gap-3">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold text-slate-900">Members</h1>
          <p className="text-slate-600 mt-1 text-sm">Manage organization members</p>
        </div>
        <Button className="gap-2 bg-gradient-to-r from-blue-600 to-blue-700 h-9 text-sm">
          <UserPlus className="w-4 h-4" />
          <span className="hidden sm:inline">Add Member</span>
          <span className="sm:hidden">Add</span>
        </Button>
      </div>

      {/* Stats — 2 cols on mobile, 4 on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: 'Total Members',  value: members.length },
          { label: 'Active Members', value: members.filter(m => m.status === 'active').length },
          { label: 'Officers',       value: members.filter(m => m.role === 'Officer').length },
          { label: 'Avg. Attendance',value: `${Math.round(members.reduce((s, m) => s + m.attendanceRate, 0) / members.length)}%` },
        ].map(({ label, value }) => (
          <Card key={label}>
            <CardHeader className="pb-2 pt-3 px-4"><CardDescription className="text-xs sm:text-sm">{label}</CardDescription></CardHeader>
            <CardContent className="px-4 pb-3">
              <div className="text-2xl sm:text-3xl font-bold text-slate-900">{value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search members by name, ID, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Members */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base sm:text-lg">Member List</CardTitle>
          <CardDescription className="text-xs sm:text-sm">All organization members</CardDescription>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">No members found.</div>
          ) : (
            <>
              {/* Mobile card list */}
              <div className="sm:hidden space-y-3">
                {filtered.map((member) => (
                  <div key={member.id} className="rounded-xl border border-slate-200 p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar className="w-10 h-10 shrink-0">
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-bold text-sm">
                            {getInitials(member.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 text-sm">{member.name}</p>
                          <p className="text-xs text-slate-500 font-mono">{member.studentId}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-5 ${member.role === 'Officer' ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-blue-100 text-blue-700 border-blue-200'}`}>
                          {member.role}
                        </Badge>
                        <MemberActions />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{member.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{member.phone}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600">{member.course} · {member.yearLevel}</span>
                      <Badge className={`${member.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'} text-[10px]`}>
                        {member.status}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-blue-500 to-blue-600" style={{ width: `${member.attendanceRate}%` }} />
                      </div>
                      <span className="text-xs font-semibold text-slate-700 shrink-0">{member.attendanceRate}%</span>
                    </div>
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
                      <TableHead>Contact</TableHead>
                      <TableHead>Course & Year</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Attendance</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="w-10 h-10">
                              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-bold">
                                {getInitials(member.name)}
                              </AvatarFallback>
                            </Avatar>
                            <p className="font-medium text-slate-900">{member.name}</p>
                          </div>
                        </TableCell>
                        <TableCell><span className="font-mono text-sm">{member.studentId}</span></TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm"><Mail className="w-3 h-3 text-slate-400" /><span className="text-slate-600 truncate max-w-[180px]">{member.email}</span></div>
                            <div className="flex items-center gap-2 text-sm"><Phone className="w-3 h-3 text-slate-400" /><span className="text-slate-600">{member.phone}</span></div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="font-medium text-slate-900">{member.course}</p>
                          <p className="text-sm text-slate-600">{member.yearLevel}</p>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={member.role === 'Officer' ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-blue-100 text-blue-700 border-blue-200'}>
                            {member.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-blue-500 to-blue-600" style={{ width: `${member.attendanceRate}%` }} />
                            </div>
                            <span className="text-sm font-medium text-slate-900">{member.attendanceRate}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={member.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}>{member.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right"><MemberActions /></TableCell>
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