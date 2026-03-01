// pages/dashboards/officer/OfficerAdviserDashboard.jsx
// ── Adviser Overview — Org health at a glance ──

import { useState, useEffect, useCallback } from 'react';
import {
    Briefcase, Users, Calendar, TrendingUp, CheckCircle, AlertTriangle,
    Clock, Loader2, RefreshCw, DollarSign, ClipboardList, BarChart3,
    ArrowUpRight, ArrowDownRight, Eye,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
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
        const m = JSON.parse(localStorage.getItem('membership') || 'null');
        if (m?.organization_id) return m.organization_id;
    } catch { }
    return null;
};

const peso = (n) => `₱${(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;

// ── Metric Card ──
const MetricCard = ({ icon: Icon, label, value, sub, color = 'blue', trend }) => (
    <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-5">
            <div className="flex items-start justify-between">
                <div className={`w-10 h-10 rounded-xl bg-${color}-100 flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 text-${color}-600`} />
                </div>
                {trend !== undefined && (
                    <div className={`flex items-center gap-1 text-xs font-medium ${trend >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        {trend >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {Math.abs(trend)}%
                    </div>
                )}
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-3">{value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{label}</p>
            {sub && <p className="text-[11px] text-slate-400 mt-1">{sub}</p>}
        </CardContent>
    </Card>
);

export default function OfficerAdviserDashboard() {
    const orgId = getOrgId();
    const storedMember = JSON.parse(localStorage.getItem('membership') || 'null');
    const orgName = storedMember?.organization?.name || 'Organization';

    const [loading, setLoading] = useState(true);
    const [members, setMembers] = useState([]);
    const [events, setEvents] = useState([]);
    const [clearance, setClearance] = useState([]);
    const [error, setError] = useState(null);

    const fetchAll = useCallback(async () => {
        if (!orgId) return;
        setLoading(true);
        setError(null);
        try {
            const [membersRes, eventsRes, clearanceRes] = await Promise.allSettled([
                api().get(`/organizations/${orgId}/members?status=active`),
                api().get(`/organizations/${orgId}/events`),
                api().get(`/organizations/${orgId}/clearance`, { params: { school_year: '2025-2026', semester: '2nd' } }),
            ]);

            if (membersRes.status === 'fulfilled') setMembers(Array.isArray(membersRes.value.data) ? membersRes.value.data : []);
            if (eventsRes.status === 'fulfilled') setEvents(Array.isArray(eventsRes.value.data) ? eventsRes.value.data : []);
            if (clearanceRes.status === 'fulfilled') setClearance(Array.isArray(clearanceRes.value.data) ? clearanceRes.value.data : []);
        } catch (err) {
            setError('Failed to load some data.');
        } finally {
            setLoading(false);
        }
    }, [orgId]);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    // ── Computations ──
    const totalMembers = members.length;
    const officers = members.filter((m) => m.role === 'officer' || m.role === 'adviser').length;
    const regularMembers = totalMembers - officers;

    const totalEvents = events.length;
    const upcomingEvents = events.filter((e) => new Date(e.start_date || e.date) >= new Date()).length;
    const pastEvents = totalEvents - upcomingEvents;

    const allReqs = clearance.flatMap((m) => m.requirements || []);
    const paymentReqs = allReqs.filter((r) => r.amount && parseFloat(r.amount) > 0);
    const clearedPayments = paymentReqs.filter((r) => r.status === 'cleared');
    const uniqueReqs = {};
    allReqs.forEach((r) => {
        if (r.amount && parseFloat(r.amount) > 0 && !uniqueReqs[r.requirement_id]) {
            uniqueReqs[r.requirement_id] = { name: r.name, amount: parseFloat(r.amount), cleared: 0, total: 0 };
        }
        if (uniqueReqs[r.requirement_id]) {
            uniqueReqs[r.requirement_id].total++;
            if (r.status === 'cleared') uniqueReqs[r.requirement_id].cleared++;
        }
    });
    const reqBreakdown = Object.values(uniqueReqs);
    const targetRevenue = reqBreakdown.reduce((s, r) => s + r.amount * r.total, 0);
    const collectedRevenue = reqBreakdown.reduce((s, r) => s + r.amount * r.cleared, 0);
    const collectionRate = targetRevenue > 0 ? Math.round((collectedRevenue / targetRevenue) * 100) : 0;
    const fullyClearedMembers = clearance.filter((m) => m.overall === 'cleared').length;
    const clearanceRate = clearance.length > 0 ? Math.round((fullyClearedMembers / clearance.length) * 100) : 0;

    // Role distribution
    const roleCounts = {};
    members.forEach((m) => {
        const pos = m.position || m.role || 'member';
        roleCounts[pos] = (roleCounts[pos] || 0) + 1;
    });

    if (!orgId) {
        return (
            <div className="flex items-center justify-center h-48">
                <p className="text-slate-500 text-sm">No organization found for your account.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* ── Header ── */}
            <div className="flex justify-between items-start flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                            <Eye className="w-5 h-5 text-white" />
                        </div>
                        Adviser Overview
                    </h1>
                    <p className="text-slate-500 mt-1 text-sm">{orgName} · Organization Health Dashboard</p>
                </div>
                <Button variant="outline" onClick={fetchAll} disabled={loading} className="gap-2 rounded-xl">
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            {loading && (
                <div className="flex flex-col items-center justify-center h-60 gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                    <p className="text-sm text-slate-400">Loading organization data…</p>
                </div>
            )}

            {error && !loading && (
                <Card className="border-amber-200 bg-amber-50">
                    <CardContent className="p-4 flex items-center gap-3 text-amber-700 text-sm">
                        <AlertTriangle className="w-5 h-5 flex-shrink-0" />{error}
                    </CardContent>
                </Card>
            )}

            {!loading && (
                <>
                    {/* ── Hero Banner ── */}
                    <Card className="bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 text-white border-0 shadow-xl shadow-orange-500/15 overflow-hidden relative">
                        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImEiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNhKSIvPjwvc3ZnPg==')] opacity-50" />
                        <CardContent className="p-6 relative">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Briefcase className="w-5 h-5" />
                                        <Badge className="bg-white/20 text-white border-0 text-xs">Adviser</Badge>
                                    </div>
                                    <h2 className="text-xl sm:text-2xl font-bold">{orgName}</h2>
                                    <p className="text-amber-100 text-sm mt-1">Organization health summary · 2025-2026, 2nd Semester</p>
                                </div>
                                <div className="flex gap-4 text-center">
                                    <div>
                                        <p className="text-3xl font-bold">{totalMembers}</p>
                                        <p className="text-xs text-amber-100">Members</p>
                                    </div>
                                    <div className="w-px bg-white/20" />
                                    <div>
                                        <p className="text-3xl font-bold">{totalEvents}</p>
                                        <p className="text-xs text-amber-100">Events</p>
                                    </div>
                                    <div className="w-px bg-white/20" />
                                    <div>
                                        <p className="text-3xl font-bold">{clearanceRate}%</p>
                                        <p className="text-xs text-amber-100">Cleared</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* ── Key Metrics ── */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <MetricCard icon={Users} label="Total Members" value={totalMembers} sub={`${officers} officers · ${regularMembers} members`} color="blue" />
                        <MetricCard icon={Calendar} label="Events" value={totalEvents} sub={`${upcomingEvents} upcoming · ${pastEvents} past`} color="purple" />
                        <MetricCard icon={DollarSign} label="Revenue Collected" value={peso(collectedRevenue)} sub={`${collectionRate}% of target ${peso(targetRevenue)}`} color="emerald" />
                        <MetricCard icon={CheckCircle} label="Clearance Rate" value={`${clearanceRate}%`} sub={`${fullyClearedMembers} of ${clearance.length} fully cleared`} color="amber" />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* ── Financial Overview ── */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <BarChart3 className="w-5 h-5 text-emerald-600" />
                                    Financial Health
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                                    <div>
                                        <p className="text-xs text-emerald-600 font-medium">Total Collected</p>
                                        <p className="text-2xl font-bold text-emerald-700">{peso(collectedRevenue)}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-slate-400">Target</p>
                                        <p className="text-lg font-semibold text-slate-600">{peso(targetRevenue)}</p>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                                        <span>Collection Progress</span>
                                        <span>{collectionRate}%</span>
                                    </div>
                                    <Progress value={collectionRate} className="h-3" />
                                </div>
                                {reqBreakdown.length > 0 && (
                                    <div className="space-y-3 pt-2">
                                        <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Per-Fee Breakdown</p>
                                        {reqBreakdown.map((r) => {
                                            const pct = r.total > 0 ? Math.round((r.cleared / r.total) * 100) : 0;
                                            return (
                                                <div key={r.name} className="space-y-1">
                                                    <div className="flex justify-between text-xs">
                                                        <span className="text-slate-700 font-medium">{r.name} ({peso(r.amount)})</span>
                                                        <span className="text-slate-500">{r.cleared}/{r.total} paid · {pct}%</span>
                                                    </div>
                                                    <Progress value={pct} className="h-1.5" />
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* ── Member Composition ── */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Users className="w-5 h-5 text-blue-600" />
                                    Organization Composition
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Role distribution */}
                                <div className="space-y-3">
                                    {Object.entries(roleCounts).sort((a, b) => b[1] - a[1]).map(([role, count]) => {
                                        const pct = totalMembers > 0 ? Math.round((count / totalMembers) * 100) : 0;
                                        const colors = {
                                            officer: 'bg-purple-500', adviser: 'bg-amber-500', member: 'bg-blue-500',
                                            President: 'bg-red-500', 'Vice President': 'bg-rose-400', Secretary: 'bg-indigo-500',
                                            Treasurer: 'bg-emerald-500', Auditor: 'bg-teal-500', 'P.R.O.': 'bg-pink-500',
                                        };
                                        return (
                                            <div key={role} className="flex items-center gap-3">
                                                <span className={`w-3 h-3 rounded-full ${colors[role] || 'bg-slate-400'} flex-shrink-0`} />
                                                <span className="text-sm text-slate-700 flex-1 capitalize">{role}</span>
                                                <span className="text-sm font-semibold text-slate-900 tabular-nums">{count}</span>
                                                <span className="text-xs text-slate-400 w-10 text-right">{pct}%</span>
                                                <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full ${colors[role] || 'bg-slate-400'}`}
                                                        style={{ width: `${pct}%` }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Clearance summary */}
                                <div className="pt-4 border-t space-y-3">
                                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Clearance Summary</p>
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="text-center p-3 rounded-lg bg-emerald-50">
                                            <p className="text-xl font-bold text-emerald-600">{fullyClearedMembers}</p>
                                            <p className="text-[10px] text-emerald-500">Cleared</p>
                                        </div>
                                        <div className="text-center p-3 rounded-lg bg-amber-50">
                                            <p className="text-xl font-bold text-amber-600">{clearance.length - fullyClearedMembers}</p>
                                            <p className="text-[10px] text-amber-500">Pending</p>
                                        </div>
                                        <div className="text-center p-3 rounded-lg bg-blue-50">
                                            <p className="text-xl font-bold text-blue-600">{clearance.length}</p>
                                            <p className="text-[10px] text-blue-500">Total</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* ── Upcoming Events ── */}
                    {upcomingEvents > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Calendar className="w-5 h-5 text-purple-600" />
                                    Upcoming Events
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {events
                                        .filter((e) => new Date(e.start_date || e.date) >= new Date())
                                        .sort((a, b) => new Date(a.start_date || a.date) - new Date(b.start_date || b.date))
                                        .slice(0, 5)
                                        .map((e) => (
                                            <div key={e.id} className="flex items-center gap-4 p-3 rounded-xl border hover:shadow-sm transition-shadow">
                                                <div className="w-12 h-12 rounded-lg bg-purple-100 flex flex-col items-center justify-center flex-shrink-0">
                                                    <span className="text-[10px] text-purple-500 uppercase font-medium">
                                                        {new Date(e.start_date || e.date).toLocaleDateString('en', { month: 'short' })}
                                                    </span>
                                                    <span className="text-lg font-bold text-purple-700 leading-none">
                                                        {new Date(e.start_date || e.date).getDate()}
                                                    </span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-slate-900 text-sm truncate">{e.title || e.name}</p>
                                                    <p className="text-xs text-slate-500">{e.location || 'TBA'}</p>
                                                </div>
                                                <Badge variant="outline" className="flex-shrink-0 text-[10px]">
                                                    <Clock className="w-3 h-3 mr-1" />
                                                    {e.start_time || 'TBA'}
                                                </Badge>
                                            </div>
                                        ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </>
            )}
        </div>
    );
}
