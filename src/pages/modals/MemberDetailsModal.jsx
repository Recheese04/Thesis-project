import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Badge } from '@/components/ui/badge';
import AvatarImg from '@/components/Avatar';
import { Mail, Phone, Shield, User, Briefcase, Calendar, Clock, CheckCircle2, XCircle } from 'lucide-react';
import axios from 'axios';

const authH = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

const roleConfig = {
    officer: { label: 'Officer', bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200', Icon: Shield },
    adviser: { label: 'Adviser', bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200', Icon: Briefcase },
    member: { label: 'Member', bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200', Icon: User },
};

const RoleBadge = ({ role }) => {
    const cfg = roleConfig[role] ?? roleConfig.member;
    return (
        <Badge variant="outline" className={`text-xs px-3 py-1 font-semibold ${cfg.bg} ${cfg.text} ${cfg.border}`}>
            {cfg.label}
        </Badge>
    );
};

export default function MemberDetailsModal({ membership, onClose }) {
    const [attendanceHistory, setAttendanceHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (membership) {
            setLoading(true);
            axios.get(`/api/organizations/${membership.organization_id}/members/${membership.student_id}/attendance`, authH())
                .then((res) => setAttendanceHistory(res.data))
                .catch((err) => console.error('Failed to load attendance:', err))
                .finally(() => setLoading(false));
        }
    }, [membership]);

    if (!membership) return null;
    const s = membership.student || {};
    const fullName = `${s.first_name || ''} ${s.last_name || ''}`.trim() || 'Unknown';

    return (
        <Dialog open={!!membership} onOpenChange={(open) => !open && onClose()}>
            <DialogContent aria-describedby={undefined} className="sm:max-w-3xl rounded-2xl overflow-hidden p-0 border-0 shadow-2xl h-[85vh] flex flex-col">
                <VisuallyHidden>
                    <DialogTitle>Member Details</DialogTitle>
                    <DialogDescription>Detailed view of {fullName}'s profile and contact information.</DialogDescription>
                </VisuallyHidden>

                {/* Header Section */}
                <div className="bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 p-8 flex flex-col items-center justify-center text-white relative shrink-0 overflow-hidden">
                    <div className="absolute inset-0 bg-white/5 opacity-50" style={{ backgroundImage: 'radial-gradient(circle at top right, rgba(255,255,255,0.2), transparent 50%)' }}></div>
                    <div className="absolute top-4 left-4 text-white/90 z-10">
                        <RoleBadge role={membership.role} />
                    </div>

                    <AvatarImg name={fullName} src={s.profile_picture_url || null} size={96} className="border-4 border-white/20 shadow-2xl mb-4 relative z-10" />

                    <h2 className="text-3xl font-extrabold text-center tracking-tight text-white mb-1 drop-shadow-md relative z-10">{fullName}</h2>
                    <p className="text-blue-200 font-medium tracking-wide text-sm relative z-10 font-mono">{s.student_number || 'No Student ID'}</p>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto bg-slate-50/80 p-6 space-y-6">

                    {/* Key Info Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center items-center text-center hover:shadow-md transition-shadow">
                            <p className="text-[11px] text-slate-500 uppercase font-bold tracking-wider mb-1">Course</p>
                            <p className="font-semibold text-slate-900 text-sm line-clamp-2">{s.course || '—'}</p>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center items-center text-center hover:shadow-md transition-shadow">
                            <p className="text-[11px] text-slate-500 uppercase font-bold tracking-wider mb-1">Year Level</p>
                            <p className="font-semibold text-slate-900 text-sm">{s.year_level || '—'}</p>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center items-center text-center hover:shadow-md transition-shadow">
                            <p className="text-[11px] text-slate-500 uppercase font-bold tracking-wider mb-1">Position</p>
                            <p className="font-semibold text-slate-900 text-sm truncate w-full">{membership.position || '—'}</p>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center items-center text-center hover:shadow-md transition-shadow">
                            <p className="text-[11px] text-slate-500 uppercase font-bold tracking-wider mb-1">Joined</p>
                            <p className="font-semibold text-slate-900 text-sm">{membership.joined_date ? new Date(membership.joined_date).toLocaleDateString() : '—'}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                        {/* Contact Card */}
                        <div className="md:col-span-7 bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4 flex flex-col justify-center relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-3 opacity-5 pointer-events-none">
                                <User className="w-48 h-48 transform translate-x-12 -translate-y-8" />
                            </div>
                            <h3 className="font-bold text-slate-900 text-sm border-b pb-2 mb-3 z-10 flex items-center gap-2">
                                <Mail className="w-4 h-4 text-slate-400" /> Contact Info
                            </h3>

                            <div className="flex items-center gap-4 z-10 group">
                                <div className="w-10 h-10 rounded-full bg-blue-50/80 flex items-center justify-center shrink-0 group-hover:bg-blue-100 transition-colors">
                                    <Mail className="w-4.5 h-4.5 text-blue-600" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-[11px] text-slate-500 uppercase font-semibold tracking-wider">Email Address</p>
                                    <p className="text-sm font-medium text-slate-900 truncate">{s.user?.email || s.email || '—'}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 z-10 group">
                                <div className="w-10 h-10 rounded-full bg-emerald-50/80 flex items-center justify-center shrink-0 group-hover:bg-emerald-100 transition-colors">
                                    <Phone className="w-4.5 h-4.5 text-emerald-600" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-[11px] text-slate-500 uppercase font-semibold tracking-wider">Phone</p>
                                    <p className="text-sm font-medium text-slate-900">{membership.student?.contact_number || '—'}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 z-10 group">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${s.rfid_uid ? 'bg-purple-50/80 group-hover:bg-purple-100' : 'bg-slate-50 group-hover:bg-slate-100'}`}>
                                    <Shield className={`w-4.5 h-4.5 ${s.rfid_uid ? 'text-purple-600' : 'text-slate-400'}`} />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-[11px] text-slate-500 uppercase font-semibold tracking-wider">RFID Card</p>
                                    <p className={`text-sm font-medium ${s.rfid_uid ? 'text-slate-900 font-mono tracking-tight' : 'text-slate-400 italic'}`}>
                                        {s.rfid_uid || 'Not registered'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Overall Attendance Card */}
                        <div className="md:col-span-5 bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-transparent pointer-events-none"></div>
                            <h3 className="font-bold text-slate-900 text-sm border-b pb-2 mb-4 flex items-center gap-2 z-10">
                                <CheckCircle2 className="w-4 h-4 text-slate-400" /> Overall Engagement
                            </h3>
                            {membership.attendance_rate != null ? (
                                <div className="flex flex-col items-center z-10 py-2">
                                    <div className="relative w-28 h-28 flex items-center justify-center mb-3 group hover:scale-105 transition-transform duration-300">
                                        <svg className="w-full h-full transform -rotate-90">
                                            <circle cx="56" cy="56" r="48" className="text-slate-100" strokeWidth="12" stroke="currentColor" fill="transparent" />
                                            <circle cx="56" cy="56" r="48" className={`transition-all duration-1000 ease-in-out ${membership.attendance_rate >= 75 ? 'text-emerald-500' : membership.attendance_rate >= 50 ? 'text-amber-500' : 'text-rose-500'}`} strokeWidth="12" strokeDasharray="301.59" strokeDashoffset={301.59 - (301.59 * membership.attendance_rate) / 100} strokeLinecap="round" stroke="currentColor" fill="transparent" />
                                        </svg>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/50 rounded-full m-3 backdrop-blur-sm">
                                            <span className="text-3xl font-extrabold text-slate-800">{membership.attendance_rate}%</span>
                                        </div>
                                    </div>
                                    <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Attendance Rate</p>
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center text-center p-4 z-10">
                                    <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                                        <Calendar className="w-6 h-6 text-slate-300" />
                                    </div>
                                    <p className="text-sm font-medium text-slate-500">No attendance data yet.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Event Attendance History Log */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col" style={{ minHeight: '300px' }}>
                        <div className="p-4 border-b border-slate-100 bg-slate-50/80 flex justify-between items-center backdrop-blur-md">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                <Calendar className="w-4.5 h-4.5 text-blue-600" /> Attendance History
                            </h3>
                            <Badge variant="secondary" className="bg-white border text-slate-600 shadow-sm text-xs px-2 py-0.5">
                                {attendanceHistory.length} Events
                            </Badge>
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            {loading ? (
                                <div className="h-full flex justify-center items-center py-16">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                </div>
                            ) : attendanceHistory.length > 0 ? (
                                <ul className="divide-y divide-slate-100/80">
                                    {attendanceHistory.map((log, idx) => (
                                        <li key={idx} className="p-4 hover:bg-slate-50/80 transition-colors flex items-center gap-4 group">
                                            <div className="shrink-0 flex items-center justify-center">
                                                {log.attended ? (
                                                    <div className="w-11 h-11 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center ring-4 ring-emerald-50/50 group-hover:scale-110 transition-transform">
                                                        <CheckCircle2 className="w-6 h-6" />
                                                    </div>
                                                ) : (
                                                    <div className="w-11 h-11 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center ring-4 ring-rose-50/50 group-hover:scale-110 transition-transform">
                                                        <XCircle className="w-5 h-5" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1.5">
                                                    <p className="text-[15px] font-bold text-slate-900 truncate" title={log.event_title}>
                                                        {log.event_title}
                                                    </p>
                                                    {log.event_status === 'ongoing' && (
                                                        <Badge className="px-1.5 py-0 rounded text-[9px] font-bold uppercase tracking-wider bg-green-100 text-green-700 hover:bg-green-200 border-0">Ongoing</Badge>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
                                                    <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-slate-400" /> {log.event_date}</span>
                                                    {log.attended && log.time_in && (
                                                        <span className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                                                            <Clock className="w-3.5 h-3.5" /> {log.time_in}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="shrink-0 text-right">
                                                <Badge variant="outline" className={`border shadow-sm px-3 py-1 text-xs font-bold uppercase tracking-wider ${log.attended ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                                                    {log.attended ? 'Present' : 'Absent'}
                                                </Badge>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="h-full flex flex-col justify-center items-center py-16 text-center">
                                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-300">
                                        <Calendar className="w-8 h-8" />
                                    </div>
                                    <p className="text-slate-600 font-bold">No Events Yet</p>
                                    <p className="text-slate-400 text-sm mt-1 max-w-xs">This organization hasn't hosted any events or recorded attendance.</p>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </DialogContent>
        </Dialog>
    );
}
