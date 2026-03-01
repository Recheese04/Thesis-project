// pages/dashboards/officer/OfficerMinutes.jsx
// Secretary — Meeting minutes & records

import { useState } from 'react';
import {
    FileText, Plus, Calendar, Clock, Users, Loader2,
    ChevronDown, ChevronUp, Pencil, Trash2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import axios from 'axios';

const api = () =>
    axios.create({
        baseURL: '/api',
        headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
    });

const getOrgId = () => {
    const orgId = localStorage.getItem('organization_id');
    if (orgId && orgId !== '' && orgId !== 'null' && orgId !== 'undefined') return parseInt(orgId);
    try {
        const membership = JSON.parse(localStorage.getItem('membership') || 'null');
        if (membership?.organization_id) return membership.organization_id;
    } catch { }
    return null;
};

export default function OfficerMinutes() {
    const orgId = getOrgId();

    // Local state — minutes are stored locally for now (can be wired to an API later)
    const [minutes, setMinutes] = useState([
        {
            id: 1,
            title: 'General Assembly Meeting',
            date: '2026-02-15',
            time: '2:00 PM',
            attendees: 24,
            status: 'approved',
            summary: 'Discussed upcoming events for the second semester. Approved budget allocation for the Sportsfest.',
        },
        {
            id: 2,
            title: 'Officers Meeting',
            date: '2026-02-28',
            time: '4:00 PM',
            attendees: 8,
            status: 'draft',
            summary: 'Planned clearance requirements and membership dues collection schedule.',
        },
    ]);

    const [expandedId, setExpandedId] = useState(null);
    const [showAdd, setShowAdd] = useState(false);
    const [saving, setSaving] = useState(false);
    const [newMinute, setNewMinute] = useState({
        title: '', date: '', time: '', attendees: '', summary: '',
    });

    const handleAddMinute = (e) => {
        e.preventDefault();
        if (!newMinute.title.trim() || !newMinute.date) return;
        setSaving(true);
        setTimeout(() => {
            setMinutes((prev) => [
                {
                    id: Date.now(),
                    ...newMinute,
                    attendees: parseInt(newMinute.attendees) || 0,
                    status: 'draft',
                },
                ...prev,
            ]);
            setNewMinute({ title: '', date: '', time: '', attendees: '', summary: '' });
            setShowAdd(false);
            setSaving(false);
        }, 400);
    };

    const handleDelete = (id) => {
        setMinutes((prev) => prev.filter((m) => m.id !== id));
    };

    const handleApprove = (id) => {
        setMinutes((prev) => prev.map((m) => m.id === id ? { ...m, status: 'approved' } : m));
    };

    if (!orgId) {
        return (
            <div className="flex items-center justify-center h-48">
                <p className="text-slate-500 text-sm">No organization found for your account.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start flex-wrap gap-3">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md">
                            <FileText className="w-5 h-5 text-white" />
                        </div>
                        Meeting Minutes
                    </h1>
                    <p className="text-slate-600 mt-1">Record and manage meeting minutes for the organization</p>
                </div>
                <Button onClick={() => setShowAdd(true)} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                    <Plus className="w-4 h-4" />
                    New Minutes
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="pb-2"><CardDescription>Total Records</CardDescription></CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-slate-900">{minutes.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardDescription>Approved</CardDescription></CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <span className="text-3xl font-bold text-emerald-600">{minutes.filter((m) => m.status === 'approved').length}</span>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardDescription>Drafts</CardDescription></CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <span className="text-3xl font-bold text-amber-600">{minutes.filter((m) => m.status === 'draft').length}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Minutes List */}
            <div className="space-y-3">
                {minutes.length === 0 ? (
                    <Card>
                        <CardContent className="p-12 text-center">
                            <FileText className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                            <p className="text-slate-400">No meeting minutes yet. Click "New Minutes" to create one.</p>
                        </CardContent>
                    </Card>
                ) : (
                    minutes.map((m) => (
                        <Card key={m.id} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-5">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-semibold text-slate-900">{m.title}</span>
                                            <Badge className={m.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}>
                                                {m.status === 'approved' ? 'Approved' : 'Draft'}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-4 mt-1 text-xs text-slate-500">
                                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{m.date}</span>
                                            {m.time && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{m.time}</span>}
                                            <span className="flex items-center gap-1"><Users className="w-3 h-3" />{m.attendees} attendees</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        {m.status === 'draft' && (
                                            <Button size="sm" variant="outline" onClick={() => handleApprove(m.id)} className="text-xs h-7 px-3 text-emerald-700 hover:bg-emerald-50">
                                                Approve
                                            </Button>
                                        )}
                                        <Button size="sm" variant="ghost" onClick={() => handleDelete(m.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50 h-7 w-7 p-0">
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                        <button
                                            onClick={() => setExpandedId(expandedId === m.id ? null : m.id)}
                                            className="text-slate-400 hover:text-slate-600"
                                        >
                                            {expandedId === m.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>

                                {expandedId === m.id && m.summary && (
                                    <div className="mt-4 pt-4 border-t">
                                        <p className="text-sm text-slate-700 leading-relaxed">{m.summary}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Add Minutes Modal */}
            <Dialog open={showAdd} onOpenChange={setShowAdd}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>New Meeting Minutes</DialogTitle>
                        <DialogDescription>Record the details of a meeting.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAddMinute} className="space-y-4 mt-2">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Meeting Title *</label>
                            <input
                                type="text"
                                value={newMinute.title}
                                onChange={(e) => setNewMinute({ ...newMinute, title: e.target.value })}
                                placeholder="e.g. General Assembly Meeting"
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Date *</label>
                                <input
                                    type="date"
                                    value={newMinute.date}
                                    onChange={(e) => setNewMinute({ ...newMinute, date: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Time</label>
                                <input
                                    type="time"
                                    value={newMinute.time}
                                    onChange={(e) => setNewMinute({ ...newMinute, time: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Attendees Count</label>
                            <input
                                type="number"
                                min="0"
                                value={newMinute.attendees}
                                onChange={(e) => setNewMinute({ ...newMinute, attendees: e.target.value })}
                                placeholder="Number of attendees"
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Summary / Notes</label>
                            <textarea
                                rows={3}
                                value={newMinute.summary}
                                onChange={(e) => setNewMinute({ ...newMinute, summary: e.target.value })}
                                placeholder="Key discussion points, decisions made, action items…"
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                            />
                        </div>
                        <DialogFooter className="gap-2 pt-2">
                            <Button type="button" variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
                            <Button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                                Save Minutes
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
