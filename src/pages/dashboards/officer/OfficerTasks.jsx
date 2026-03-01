// pages/dashboards/officer/OfficerTasks.jsx

import { useState, useEffect, useCallback } from 'react';
import {
  ClipboardList, Plus, Calendar, User, CheckCircle, Clock,
  AlertTriangle, Filter, Loader2, RefreshCw, X, Search,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
  if (orgId && orgId !== '' && orgId !== 'null' && orgId !== 'undefined') {
    return parseInt(orgId);
  }
  try {
    const membership = JSON.parse(localStorage.getItem('membership') || 'null');
    if (membership?.organization_id) return membership.organization_id;
  } catch {}
  return null;
};

const STATUS_CONFIG = {
  pending:     { label: 'Pending',     className: 'bg-amber-100 text-amber-700' },
  in_progress: { label: 'In Progress', className: 'bg-blue-100 text-blue-700' },
  completed:   { label: 'Completed',   className: 'bg-green-100 text-green-700' },
  cancelled:   { label: 'Cancelled',   className: 'bg-slate-100 text-slate-500' },
};

const EMPTY_FORM = {
  assigned_to: '',
  title:       '',
  description: '',
  due_date:    '',
};

export default function OfficerTasks() {
  const orgId = getOrgId();

  const [tasks, setTasks]           = useState([]);
  const [members, setMembers]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [typeFilter, setTypeFilter] = useState('all');
  const [search, setSearch]         = useState('');
  const [showForm, setShowForm]     = useState(false);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [formError, setFormError]   = useState(null);
  const [saving, setSaving]         = useState(false);
  const [actionId, setActionId]     = useState(null);

  // ── Fetch tasks ──────────────────────────────────────────────────────────
  const fetchTasks = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    setError(null);
    try {
      const params = typeFilter !== 'all' ? { type: typeFilter } : {};
      const { data } = await api().get(`/organizations/${orgId}/tasks`, { params });
      setTasks(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load tasks.');
    } finally {
      setLoading(false);
    }
  }, [orgId, typeFilter]);

  // ── Fetch members for dropdown ───────────────────────────────────────────
  const fetchMembers = useCallback(async () => {
    if (!orgId) return;
    try {
      const { data } = await api().get(`/organizations/${orgId}/members`);
      setMembers(data);
    } catch {
      // non-critical
    }
  }, [orgId]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);
  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  // ── Mark complete ────────────────────────────────────────────────────────
  const markComplete = async (id) => {
    setActionId(id);
    try {
      const { data } = await api().put(`/tasks/${id}/complete`);
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...data } : t)));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update task.');
    } finally {
      setActionId(null);
    }
  };

  // ── Assign task ──────────────────────────────────────────────────────────
  const handleAssign = async () => {
    if (!form.assigned_to || !form.title) {
      setFormError('Please select a member and enter a title.');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const { data } = await api().post(`/organizations/${orgId}/tasks`, form);
      setTasks((prev) => [data, ...prev]);
      setShowForm(false);
      setForm(EMPTY_FORM);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create task.');
    } finally {
      setSaving(false);
    }
  };

  // ── Derived ──────────────────────────────────────────────────────────────
  const searched = tasks.filter(
    (t) =>
      t.title?.toLowerCase().includes(search.toLowerCase()) ||
      t.assignedTo?.toLowerCase().includes(search.toLowerCase()) ||
      t.assigned_to_name?.toLowerCase().includes(search.toLowerCase())
  );

  const byStatus    = (s)  => searched.filter((t) => t.status === s);
  const pending     = byStatus('pending');
  const inProgress  = byStatus('in_progress');
  const completed   = byStatus('completed');
  const consequence = tasks.filter((t) => t.type === 'consequence' && t.status !== 'completed').length;

  const getInitials = (name = '') =>
    name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  // ── Task Card ────────────────────────────────────────────────────────────
  const TaskCard = ({ task }) => {
    const statusCfg    = STATUS_CONFIG[task.status] || STATUS_CONFIG.pending;
    const busy         = actionId === task.id;
    const assignedName = task.assignedTo || task.assigned_to_name || '';

    return (
      <Card className={`hover:shadow-md transition-shadow ${task.type === 'consequence' ? 'border-l-4 border-l-orange-400' : ''}`}>
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <Avatar className="w-10 h-10 flex-shrink-0">
              <AvatarFallback className="bg-gradient-to-br from-violet-500 to-violet-600 text-white text-xs font-bold">
                {getInitials(assignedName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 flex-wrap mb-1">
                <div className="flex items-center gap-2 flex-wrap">
                  {task.type === 'consequence' && (
                    <Badge className="bg-orange-100 text-orange-700 text-xs gap-1">
                      <AlertTriangle className="w-3 h-3" /> Consequence
                    </Badge>
                  )}
                  <h3 className="text-base font-bold text-slate-900 break-words">{task.title}</h3>
                </div>
                <Badge className={statusCfg.className}>{statusCfg.label}</Badge>
              </div>

              {task.event && (
                <p className="text-xs text-orange-600 mb-1 font-medium">
                  Auto-assigned — missed: {task.event.title}
                </p>
              )}

              {task.description && (
                <p className="text-sm text-slate-500 mb-3">{task.description}</p>
              )}

              <div className="flex items-center gap-4 text-sm text-slate-500 mb-3 flex-wrap">
                {assignedName && (
                  <div className="flex items-center gap-1.5">
                    <User className="w-4 h-4 text-slate-400" />
                    <span className="font-medium text-slate-700">{assignedName}</span>
                  </div>
                )}
                {task.due_date && (
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span>
                      Due {new Date(task.due_date).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric',
                      })}
                    </span>
                  </div>
                )}
              </div>

              {task.status !== 'completed' && task.status !== 'cancelled' && (
                <Button
                  size="sm" disabled={busy}
                  className="bg-green-600 hover:bg-green-700 text-white gap-1.5"
                  onClick={() => markComplete(task.id)}
                >
                  {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                  Mark Complete
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const EmptyState = ({ icon: Icon, message }) => (
    <Card>
      <CardContent className="p-12 text-center">
        <Icon className="w-12 h-12 text-slate-200 mx-auto mb-4" />
        <p className="text-slate-400">{message}</p>
      </CardContent>
    </Card>
  );

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
          <h1 className="text-3xl font-bold text-slate-900">Tasks</h1>
          <p className="text-slate-600 mt-1">Manage general and consequence tasks</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchTasks} disabled={loading} className="gap-2">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={() => { setShowForm(true); setFormError(null); setForm(EMPTY_FORM); }}
            className="gap-2 bg-gradient-to-r from-violet-600 to-violet-700"
          >
            <Plus className="w-4 h-4" /> Assign Task
          </Button>
        </div>
      </div>

      {/* Consequence alert */}
      {consequence > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0" />
            <p className="text-sm text-orange-800">
              <strong>{consequence}</strong> consequence task{consequence > 1 ? 's' : ''} pending — auto-assigned to students who missed events.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      {!loading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total',       value: tasks.length },
            { label: 'Pending',     value: tasks.filter((t) => t.status === 'pending').length,     icon: Clock,         color: 'text-amber-500' },
            { label: 'In Progress', value: tasks.filter((t) => t.status === 'in_progress').length, icon: ClipboardList, color: 'text-blue-500' },
            { label: 'Completed',   value: tasks.filter((t) => t.status === 'completed').length,   icon: CheckCircle,   color: 'text-green-500' },
          ].map(({ label, value, icon: Icon, color }) => (
            <Card key={label}>
              <CardHeader className="pb-2"><CardDescription>{label}</CardDescription></CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  {Icon && <Icon className={`w-7 h-7 ${color}`} />}
                  <span className="text-3xl font-bold text-slate-900">{value}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Assign Task Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <Card className="w-full max-w-lg shadow-2xl">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardDescription className="text-slate-800 font-semibold text-base">
                Assign New Task
              </CardDescription>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent className="space-y-4 pt-2">
              {formError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {formError}
                </p>
              )}
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">
                  Assign To <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.assigned_to}
                  onChange={(e) => setForm({ ...form, assigned_to: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  <option value="">Select member...</option>
                  {members.map((m) => (
                    <option key={m.user_id || m.id} value={m.user_id || m.id}>
                      {m.student?.first_name} {m.student?.last_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">
                  Task Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Design event poster"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Task details..."
                  rows={2}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Due Date</label>
                <input
                  type="date"
                  value={form.due_date}
                  onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button onClick={handleAssign} disabled={saving} className="bg-violet-600 hover:bg-violet-700 gap-2">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  Assign Task
                </Button>
                <Button variant="outline" onClick={() => setShowForm(false)} disabled={saving}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search + Type Filter */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search task or member..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          {[
            { key: 'all',         label: 'All' },
            { key: 'general',     label: 'General' },
            { key: 'consequence', label: '⚠ Consequence' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTypeFilter(key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                ${typeFilter === key ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 flex items-center gap-3 text-red-700 text-sm">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />{error}
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      {!loading && !error && (
        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">All ({searched.length})</TabsTrigger>
            <TabsTrigger value="pending">Pending ({pending.length})</TabsTrigger>
            <TabsTrigger value="in_progress">In Progress ({inProgress.length})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({completed.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-3 mt-5">
            {searched.length === 0 ? <EmptyState icon={ClipboardList} message="No tasks found" /> : searched.map((t) => <TaskCard key={t.id} task={t} />)}
          </TabsContent>
          <TabsContent value="pending" className="space-y-3 mt-5">
            {pending.length === 0 ? <EmptyState icon={Clock} message="No pending tasks" /> : pending.map((t) => <TaskCard key={t.id} task={t} />)}
          </TabsContent>
          <TabsContent value="in_progress" className="space-y-3 mt-5">
            {inProgress.length === 0 ? <EmptyState icon={ClipboardList} message="No tasks in progress" /> : inProgress.map((t) => <TaskCard key={t.id} task={t} />)}
          </TabsContent>
          <TabsContent value="completed" className="space-y-3 mt-5">
            {completed.length === 0
              ? <EmptyState icon={CheckCircle} message="No completed tasks yet" />
              : completed.map((t) => <div key={t.id} className="opacity-60"><TaskCard task={t} /></div>)}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}