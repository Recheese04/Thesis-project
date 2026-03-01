// pages/dashboards/officer/OfficerFinance.jsx
// ── Premium Treasury Dashboard for Treasurer ──

import { useState, useEffect, useCallback } from 'react';
import {
    Wallet, TrendingUp, Users, CheckCircle, Clock, AlertTriangle,
    Loader2, RefreshCw, Search, DollarSign, ArrowUpRight, ArrowDownRight,
    PieChart, Receipt, BadgeCheck, CreditCard, BarChart3, Filter,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardDescription, CardTitle } from '@/components/ui/card';
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
        const membership = JSON.parse(localStorage.getItem('membership') || 'null');
        if (membership?.organization_id) return membership.organization_id;
    } catch { }
    return null;
};

const peso = (n) => `₱${(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;

// ── Mini bar chart component ─────────────────────────────────────────────────
const MiniBar = ({ value, max, color = 'bg-emerald-500' }) => (
    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
            className={`h-full rounded-full transition-all duration-700 ${color}`}
            style={{ width: `${max > 0 ? (value / max) * 100 : 0}%` }}
        />
    </div>
);

// ── Donut chart (CSS only) ───────────────────────────────────────────────────
const DonutChart = ({ collected, total, size = 120 }) => {
    const pct = total > 0 ? (collected / total) * 100 : 0;
    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg width={size} height={size} viewBox="0 0 36 36" className="transform -rotate-90">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f1f5f9" strokeWidth="3" />
                <circle
                    cx="18" cy="18" r="15.9" fill="none"
                    stroke="url(#emeraldGrad)" strokeWidth="3"
                    strokeDasharray={`${pct} ${100 - pct}`}
                    strokeLinecap="round"
                    className="transition-all duration-1000"
                />
                <defs>
                    <linearGradient id="emeraldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#10b981" />
                        <stop offset="100%" stopColor="#059669" />
                    </linearGradient>
                </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-bold text-slate-900">{Math.round(pct)}%</span>
                <span className="text-[10px] text-slate-400 leading-tight">collected</span>
            </div>
        </div>
    );
};

export default function OfficerFinance() {
    const orgId = getOrgId();

    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all'); // all | cleared | pending

    const schoolYear = '2025-2026';
    const semester = '2nd';

    const fetchClearance = useCallback(async () => {
        if (!orgId) return;
        setLoading(true);
        setError(null);
        try {
            const { data } = await api().get(`/organizations/${orgId}/clearance`, {
                params: { school_year: schoolYear, semester },
            });
            setMembers(data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load financial data.');
        } finally {
            setLoading(false);
        }
    }, [orgId]);

    useEffect(() => { fetchClearance(); }, [fetchClearance]);

    // ── Computations ──────────────────────────────────────────────────────────
    const totalMembers = members.length;
    const allReqs = members.flatMap((m) => m.requirements || []);
    const paymentReqs = allReqs.filter((r) => r.amount && parseFloat(r.amount) > 0);
    const clearedPayments = paymentReqs.filter((r) => r.status === 'cleared');
    const pendingPayments = paymentReqs.filter((r) => r.status !== 'cleared');

    // Budget = sum of all requirement amounts × members who have that requirement
    // Target revenue = unique requirements with amounts × total members
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
    const pendingRevenue = targetRevenue - collectedRevenue;
    const collectionRate = targetRevenue > 0 ? (collectedRevenue / targetRevenue) * 100 : 0;

    // Per-member clearance: fully cleared count
    const fullyClearedMembers = members.filter((m) => m.overall === 'cleared').length;

    // Filter & search
    const filtered = members.filter((m) => {
        const matchName = m.student_name.toLowerCase().includes(search.toLowerCase());
        if (filter === 'cleared') return matchName && m.overall === 'cleared';
        if (filter === 'pending') return matchName && m.overall !== 'cleared';
        return matchName;
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
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                            <Wallet className="w-5 h-5 text-white" />
                        </div>
                        Treasury Dashboard
                    </h1>
                    <p className="text-slate-500 mt-1 text-sm">{schoolYear} — {semester} Semester</p>
                </div>
                <Button variant="outline" onClick={fetchClearance} disabled={loading} className="gap-2 rounded-xl">
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            {/* ── Loading ── */}
            {loading && (
                <div className="flex flex-col items-center justify-center h-60 gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                    <p className="text-sm text-slate-400">Loading treasury data…</p>
                </div>
            )}

            {/* ── Error ── */}
            {error && !loading && (
                <Card className="border-red-200 bg-red-50">
                    <CardContent className="p-4 flex items-center gap-3 text-red-700 text-sm">
                        <AlertTriangle className="w-5 h-5 flex-shrink-0" />{error}
                    </CardContent>
                </Card>
            )}

            {!loading && !error && (
                <>
                    {/* ── Hero Stats Row ── */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        {/* Total Collected — big hero card */}
                        <Card className="lg:col-span-1 bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 text-white border-0 shadow-xl shadow-emerald-500/20">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                                        <DollarSign className="w-6 h-6" />
                                    </div>
                                    <div className="flex items-center gap-1 text-emerald-100 text-sm">
                                        <ArrowUpRight className="w-4 h-4" />
                                        {Math.round(collectionRate)}%
                                    </div>
                                </div>
                                <p className="text-emerald-100 text-sm font-medium mb-1">Total Collected</p>
                                <p className="text-3xl sm:text-4xl font-bold tracking-tight">{peso(collectedRevenue)}</p>
                                <div className="mt-4 flex items-center gap-2">
                                    <div className="flex-1 h-2 bg-white/20 rounded-full overflow-hidden">
                                        <div className="h-full bg-white rounded-full transition-all duration-700" style={{ width: `${collectionRate}%` }} />
                                    </div>
                                    <span className="text-xs text-emerald-100 whitespace-nowrap">of {peso(targetRevenue)}</span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Donut + Secondary Stats */}
                        <Card className="lg:col-span-2">
                            <CardContent className="p-6">
                                <div className="flex flex-col sm:flex-row items-center gap-6">
                                    <DonutChart collected={collectedRevenue} total={targetRevenue} />

                                    <div className="flex-1 grid grid-cols-2 gap-4 w-full">
                                        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                                            <div className="flex items-center gap-2 mb-2">
                                                <CheckCircle className="w-4 h-4 text-emerald-600" />
                                                <span className="text-xs font-medium text-emerald-700">Collected</span>
                                            </div>
                                            <p className="text-xl font-bold text-emerald-700">{peso(collectedRevenue)}</p>
                                            <p className="text-xs text-emerald-500 mt-1">{clearedPayments.length} payments</p>
                                        </div>

                                        <div className="p-4 rounded-xl bg-amber-50 border border-amber-100">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Clock className="w-4 h-4 text-amber-600" />
                                                <span className="text-xs font-medium text-amber-700">Pending</span>
                                            </div>
                                            <p className="text-xl font-bold text-amber-700">{peso(pendingRevenue)}</p>
                                            <p className="text-xs text-amber-500 mt-1">{pendingPayments.length} payments</p>
                                        </div>

                                        <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Users className="w-4 h-4 text-blue-600" />
                                                <span className="text-xs font-medium text-blue-700">Total Members</span>
                                            </div>
                                            <p className="text-xl font-bold text-blue-700">{totalMembers}</p>
                                        </div>

                                        <div className="p-4 rounded-xl bg-purple-50 border border-purple-100">
                                            <div className="flex items-center gap-2 mb-2">
                                                <BadgeCheck className="w-4 h-4 text-purple-600" />
                                                <span className="text-xs font-medium text-purple-700">Fully Cleared</span>
                                            </div>
                                            <p className="text-xl font-bold text-purple-700">{fullyClearedMembers}</p>
                                            <p className="text-xs text-purple-500 mt-1">of {totalMembers} members</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* ── Revenue Breakdown by Requirement ── */}
                    {reqBreakdown.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <BarChart3 className="w-5 h-5 text-emerald-600" />
                                    Revenue Breakdown
                                </CardTitle>
                                <CardDescription>Collection progress per fee / requirement</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {reqBreakdown.map((r) => {
                                        const pct = r.total > 0 ? (r.cleared / r.total) * 100 : 0;
                                        return (
                                            <div key={r.name} className="space-y-2">
                                                <div className="flex items-center justify-between text-sm">
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <CreditCard className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                                        <span className="font-medium text-slate-800 truncate">{r.name}</span>
                                                        <Badge variant="outline" className="text-[10px] flex-shrink-0">{peso(r.amount)}</Badge>
                                                    </div>
                                                    <div className="flex items-center gap-3 flex-shrink-0 text-xs text-slate-500">
                                                        <span className="text-emerald-600 font-semibold">{peso(r.amount * r.cleared)}</span>
                                                        <span>/</span>
                                                        <span>{peso(r.amount * r.total)}</span>
                                                        <span className="font-medium text-slate-700 tabular-nums w-10 text-right">{Math.round(pct)}%</span>
                                                    </div>
                                                </div>
                                                <MiniBar value={r.cleared} max={r.total} />
                                                <div className="flex justify-between text-[11px] text-slate-400">
                                                    <span>{r.cleared} of {r.total} paid</span>
                                                    <span>{r.total - r.cleared} remaining</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* ── Member Payment Tracker ── */}
                    <Card>
                        <CardHeader>
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <Receipt className="w-5 h-5 text-emerald-600" />
                                        Member Payment Status
                                    </CardTitle>
                                    <CardDescription className="mt-1">Individual payment breakdown per member</CardDescription>
                                </div>

                                {/* Filter buttons */}
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                                        {[
                                            { key: 'all', label: 'All', count: members.length },
                                            { key: 'cleared', label: 'Cleared', count: fullyClearedMembers },
                                            { key: 'pending', label: 'Pending', count: totalMembers - fullyClearedMembers },
                                        ].map((f) => (
                                            <button
                                                key={f.key}
                                                onClick={() => setFilter(f.key)}
                                                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${filter === f.key
                                                        ? 'bg-white text-slate-900 shadow-sm'
                                                        : 'text-slate-500 hover:text-slate-700'
                                                    }`}
                                            >
                                                {f.label} ({f.count})
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Search */}
                            <div className="relative mt-3 max-w-sm">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search member…"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                />
                            </div>
                        </CardHeader>

                        <CardContent>
                            {filtered.length === 0 ? (
                                <div className="text-center py-14 text-slate-400">
                                    <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                    <p className="text-sm">No members match your search.</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {filtered.map((member) => {
                                        const reqs = member.requirements || [];
                                        const paidReqs = reqs.filter((r) => r.status === 'cleared' && r.amount && parseFloat(r.amount) > 0);
                                        const totalFees = reqs.reduce((s, r) => s + (r.amount ? parseFloat(r.amount) : 0), 0);
                                        const paidFees = paidReqs.reduce((s, r) => s + parseFloat(r.amount), 0);
                                        const allClear = member.overall === 'cleared';
                                        const pct = reqs.length > 0 ? (member.cleared / member.total) * 100 : 0;

                                        return (
                                            <div
                                                key={member.student_id}
                                                className={`flex items-center gap-4 p-4 rounded-xl border transition-all hover:shadow-sm ${allClear ? 'bg-emerald-50/40 border-emerald-200' : 'bg-white border-slate-200 hover:border-slate-300'
                                                    }`}
                                            >
                                                {/* Avatar */}
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${allClear
                                                        ? 'bg-gradient-to-br from-emerald-500 to-emerald-600'
                                                        : 'bg-gradient-to-br from-slate-400 to-slate-500'
                                                    }`}>
                                                    {member.student_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                                                </div>

                                                {/* Name + progress */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-semibold text-slate-900 text-sm truncate">{member.student_name}</p>
                                                        {allClear && (
                                                            <Badge className="bg-emerald-100 text-emerald-700 text-[10px] gap-1">
                                                                <CheckCircle className="w-3 h-3" /> Cleared
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-1.5">
                                                        <MiniBar
                                                            value={member.cleared}
                                                            max={member.total}
                                                            color={allClear ? 'bg-emerald-500' : 'bg-amber-500'}
                                                        />
                                                        <span className="text-xs text-slate-400 flex-shrink-0 w-10">{member.cleared}/{member.total}</span>
                                                    </div>
                                                </div>

                                                {/* Amount */}
                                                <div className="text-right flex-shrink-0">
                                                    <p className={`text-sm font-bold ${allClear ? 'text-emerald-600' : 'text-slate-800'}`}>
                                                        {peso(paidFees)}
                                                    </p>
                                                    {totalFees > 0 && !allClear && (
                                                        <p className="text-[11px] text-slate-400">of {peso(totalFees)}</p>
                                                    )}
                                                </div>

                                                {/* Requirement badges */}
                                                <div className="hidden lg:flex items-center gap-1.5 flex-shrink-0 max-w-[300px] flex-wrap justify-end">
                                                    {reqs.map((r) => (
                                                        <Badge
                                                            key={r.requirement_id}
                                                            className={`text-[10px] cursor-default ${r.status === 'cleared'
                                                                    ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                                                                    : r.status === 'rejected'
                                                                        ? 'bg-red-100 text-red-600 border-red-200'
                                                                        : 'bg-slate-100 text-slate-500 border-slate-200'
                                                                }`}
                                                            title={`${r.name}${r.amount ? ` — ${peso(parseFloat(r.amount))}` : ''}`}
                                                        >
                                                            {r.status === 'cleared' ? '✓' : r.status === 'rejected' ? '✗' : '⏳'}{' '}
                                                            {r.name?.length > 12 ? r.name.slice(0, 12) + '…' : r.name}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    );
}
