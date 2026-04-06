// pages/dashboards/officer/OfficerFinance.jsx
// ── Premium Treasury Dashboard for Treasurer ──

import { useState, useEffect, useCallback } from 'react';
import {
    Wallet, TrendingUp, Users, CheckCircle, Clock, AlertTriangle,
    Loader2, RefreshCw, Search, DollarSign, ArrowUpRight, ArrowDownRight,
    PieChart, Receipt, BadgeCheck, CreditCard, BarChart3, Filter, Plus
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardDescription, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import PageLoader from '@/components/ui/PageLoader';
import axios from 'axios';

const api = () =>
    axios.create({
        baseURL: (import.meta.env.VITE_API_BASE_URL || '') + '/api',
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
    const [expandedMembers, setExpandedMembers] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all'); // all | fully_paid | pending | none
    
    // Gen fee modal
    const [showGenModal, setShowGenModal] = useState(false);
    const [feeName, setFeeName] = useState('');
    const [feeDescription, setFeeDescription] = useState('');
    const [feeAmount, setFeeAmount] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    const schoolYear = '2025-2026';
    const semester = '2nd';

    const fetchFees = useCallback(async () => {
        if (!orgId) return;
        setLoading(true);
        setError(null);
        try {
            const { data } = await api().get(`/organizations/${orgId}/membership-fees`, {
                params: { school_year: schoolYear, semester },
            });
            setMembers(Array.isArray(data) ? data.map(m => ({ ...m, fees: m.fees || [] })) : []);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load financial data.');
        } finally {
            setLoading(false);
        }
    }, [orgId]);

    useEffect(() => { fetchFees(); }, [fetchFees]);
    
    const handleGenerateFees = async (e) => {
        e.preventDefault();
        if(!feeName || !feeAmount || isNaN(feeAmount) || Number(feeAmount) < 0) return;
        
        setIsGenerating(true);
        try {
            await api().post(`/organizations/${orgId}/membership-fees`, {
                name: feeName,
                description: feeDescription,
                amount: parseFloat(feeAmount)
            });
            setShowGenModal(false);
            setFeeName('');
            setFeeDescription('');
            setFeeAmount('');
            fetchFees();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to generate fees.');
        } finally {
            setIsGenerating(false);
        }
    };
    
    const updateFeeStatus = async (feeId, status) => {
        try {
            await api().put(`/membership-fees/${feeId}/status`, { status });
            // local update
            setMembers(prev => prev.map(m => ({
                ...m,
                fees: (m.fees || []).map(f => f.id === feeId ? { ...f, status } : f)
            })));
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to update status.');
        }
    };

    const toggleAccordion = (studentId) => {
        setExpandedMembers(prev => ({ ...prev, [studentId]: !prev[studentId] }));
    };

    // ── Computations ──────────────────────────────────────────────────────────
    const totalMembers = members.length;
    const allFees = members.flatMap(m => m.fees || []);
    const clearedPayments = allFees.filter((f) => f.status === 'paid');
    const pendingPayments = allFees.filter((f) => f.status !== 'paid');

    const targetRevenue = allFees.reduce((s, f) => s + parseFloat(f.amount || 0), 0);
    const collectedRevenue = clearedPayments.reduce((s, f) => s + parseFloat(f.amount || 0), 0);
    const pendingRevenue = targetRevenue - collectedRevenue;
    const collectionRate = targetRevenue > 0 ? (collectedRevenue / targetRevenue) * 100 : 0;

    const fullyClearedMembers = members.filter(m => (m.fees || []).length > 0 && (m.fees || []).every(f => f.status === 'paid')).length;

    // Filter & search
    const filtered = members.filter((m) => {
        const matchName = m.student_name.toLowerCase().includes(search.toLowerCase());
        const fees = m.fees || [];
        const isFullyPaid = fees.length > 0 && fees.every(f => f.status === 'paid');
        const isPending = fees.some(f => f.status !== 'paid');
        const hasNoFee = fees.length === 0;
        
        if (filter === 'fully_paid') return matchName && isFullyPaid;
        if (filter === 'pending') return matchName && isPending;
        if (filter === 'none') return matchName && hasNoFee;
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
                    <p className="text-slate-500 mt-1 text-sm">Membership Fees Tracker</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button onClick={() => setShowGenModal(true)} className="gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white">
                        <Plus className="w-4 h-4" />
                        Generate Fees
                    </Button>
                    <Button variant="outline" onClick={fetchFees} disabled={loading} className="gap-2 rounded-xl">
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* ── Gen Fees Modal ── */}
            <Dialog open={showGenModal} onOpenChange={setShowGenModal}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Generate Membership Fees</DialogTitle>
                        <DialogDescription>
                            This will create a pending fee record for all active members who don't have one yet.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleGenerateFees} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Fee Name (e.g. 2nd Sem Reg Fee)</label>
                            <input
                                type="text"
                                value={feeName}
                                onChange={e => setFeeName(e.target.value)}
                                placeholder="Membership Fee"
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Description (Optional)</label>
                            <textarea
                                value={feeDescription}
                                onChange={e => setFeeDescription(e.target.value)}
                                placeholder="What is this fee for?"
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                rows={2}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Fee Amount (₱)</label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={feeAmount}
                                    onChange={e => setFeeAmount(e.target.value)}
                                    placeholder="0.00"
                                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    required
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setShowGenModal(false)}>Cancel</Button>
                            <Button type="submit" disabled={isGenerating} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
                                {isGenerating && <Loader2 className="w-4 h-4 animate-spin" />}
                                Generate Fees
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ── Loading ── */}
            {loading && (
                <PageLoader text="Loading Treasury Data..." />
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
                                            <p className="text-xs text-amber-500 mt-1">{pendingPayments.length} pending</p>
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
                                                <span className="text-xs font-medium text-purple-700">Fully Paid</span>
                                            </div>
                                            <p className="text-xl font-bold text-purple-700">{fullyClearedMembers}</p>
                                            <p className="text-xs text-purple-500 mt-1">cleared members</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* ── Member Payment Tracker ── */}
                    <Card>
                        <CardHeader>
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <Receipt className="w-5 h-5 text-emerald-600" />
                                        Membership Fees Status
                                    </CardTitle>
                                    <CardDescription className="mt-1">Individual payment breakdown per member</CardDescription>
                                </div>

                                {/* Filter buttons */}
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                                        {[
                                            { key: 'all', label: 'All', count: totalMembers },
                                            { key: 'fully_paid', label: 'Fully Paid', count: fullyClearedMembers },
                                            { key: 'pending', label: 'Pending', count: members.filter(m => (m.fees || []).some(f => f.status !== 'paid')).length },
                                            { key: 'none', label: 'No Fees', count: members.filter(m => (m.fees || []).length === 0).length },
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
                                <div className="space-y-4">
                                    {filtered.map((member) => {
                                        const totalFees = member.fees.length;
                                        const paidFees = member.fees.filter(f => f.status === 'paid').length;
                                        const isExpanded = expandedMembers[member.student_id] || search !== '';
                                        const pct = totalFees > 0 ? (paidFees / totalFees) * 100 : 0;
                                        const isFullyPaid = totalFees > 0 && paidFees === totalFees;

                                        return (
                                            <div key={member.student_id} className={`border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm transition-all ${isFullyPaid ? 'border-emerald-200' : ''}`}>
                                                
                                                {/* Member Header (Accordion toggle) */}
                                                <div 
                                                    onClick={() => toggleAccordion(member.student_id)} 
                                                    className={`flex flex-wrap items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors gap-4 ${isFullyPaid ? 'bg-emerald-50/30' : ''}`}
                                                >
                                                    <div className="flex items-center gap-3 min-w-[200px] flex-1">
                                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-inner ${isFullyPaid
                                                            ? 'bg-gradient-to-br from-emerald-500 to-emerald-600'
                                                            : 'bg-gradient-to-br from-slate-500 to-slate-600'}`}
                                                        >
                                                            {member.student_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                                                {member.student_name}
                                                                {isFullyPaid && <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-none px-1.5 py-0 shadow-none"><CheckCircle className="w-3 h-3 mr-1" /> Cleared</Badge>}
                                                            </h3>
                                                            <p className="text-xs text-slate-500 mt-0.5">{member.student_number || 'No ID'}</p>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="flex items-center gap-6">
                                                        <div className="text-right hidden sm:block w-32">
                                                            <p className="text-sm font-semibold text-slate-700">{paidFees} / {totalFees} Fees Paid</p>
                                                            <div className="w-full h-1.5 bg-slate-100 rounded-full mt-1.5 overflow-hidden">
                                                                <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                                                            </div>
                                                        </div>
                                                        <div className={`p-2 rounded-full transition-all ${isExpanded ? 'bg-slate-100 text-slate-900 rotate-180' : 'text-slate-400 hover:bg-slate-100'}`}>
                                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Expanded Fees List for this Member */}
                                                {isExpanded && (
                                                    <div className="border-t border-slate-100 bg-slate-50/50 p-4 space-y-2">
                                                        {member.fees.length === 0 ? (
                                                            <p className="text-xs text-slate-400 italic text-center py-2">No fees assigned.</p>
                                                        ) : (
                                                            member.fees.map((fee) => {
                                                                const isPaid = fee.status === 'paid';

                                                                return (
                                                                    <div
                                                                        key={fee.id}
                                                                        className={`flex items-center justify-between gap-4 p-3 rounded-lg border transition-all hover:shadow-sm ${isPaid ? 'bg-emerald-50/40 border-emerald-200' : 'bg-white border-slate-200 hover:border-slate-300'}`}
                                                                    >
                                                                        <div className="flex-1 min-w-0">
                                                                            <div className="flex items-center justify-between">
                                                                                <p className="font-semibold text-slate-900 text-sm">{fee.name}</p>
                                                                                <span className={`text-sm font-bold ${isPaid ? 'text-emerald-700' : 'text-slate-700'}`}>
                                                                                    {peso(parseFloat(fee.amount))}
                                                                                </span>
                                                                            </div>
                                                                            <div className="flex items-center gap-2 mt-1">
                                                                                {isPaid ? (
                                                                                    <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Paid</span>
                                                                                ) : (
                                                                                    <span className="text-[11px] text-amber-600 font-medium flex items-center gap-1"><Clock className="w-3 h-3" /> Pending</span>
                                                                                )}
                                                                                {fee.description && (
                                                                                    <span className="text-[11px] text-slate-400 border-l border-slate-200 pl-2 truncate">{fee.description}</span>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                        
                                                                        <div className="flex-shrink-0 ml-2">
                                                                            {isPaid ? (
                                                                                <Button size="sm" variant="outline" onClick={() => updateFeeStatus(fee.id, 'pending')} className="h-8 text-xs font-medium px-3 text-slate-600 hover:text-slate-900">
                                                                                    Undo
                                                                                </Button>
                                                                            ) : (
                                                                                <Button size="sm" onClick={() => updateFeeStatus(fee.id, 'paid')} className="h-8 text-xs font-semibold px-4 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm hover:shadow">
                                                                                    Mark as Paid
                                                                                </Button>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })
                                                        )}
                                                    </div>
                                                )}
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
