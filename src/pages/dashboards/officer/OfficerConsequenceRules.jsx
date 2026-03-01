// pages/dashboards/officer/OfficerConsequenceRules.jsx

import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Pencil, AlertTriangle, Calendar, Loader2, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import axios from 'axios';

// ── Auth axios using your existing proxy ─────────────────────────────────────
const api = () =>
  axios.create({
    baseURL: '/api',
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  });

// Get officer's org id from stored user object
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

const EVENT_CATEGORIES = [
  'Intramurals', 'General Assembly', 'Org Meeting',
  'Community Service', 'Sports Fest', 'Acquaintance Party', 'Seminar', 'Other',
];

const EMPTY_FORM = {
  event_category: '',
  consequence_title: '',
  consequence_description: '',
  due_days: 7,
};

export default function OfficerConsequenceRules() {
  const orgId = getOrgId();

  const [rules, setRules]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState(null);
  const [showForm, setShowForm]   = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [formError, setFormError] = useState(null);

  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchRules = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await api().get(`/organizations/${orgId}/consequence-rules`);
      setRules(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load consequence rules.');
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => { fetchRules(); }, [fetchRules]);

  // ── Form helpers ─────────────────────────────────────────────────────────
  const openCreate = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setFormError(null);
    setShowForm(true);
  };

  const openEdit = (rule) => {
    setForm({
      event_category:          rule.event_category || '',
      consequence_title:       rule.consequence_title,
      consequence_description: rule.consequence_description || '',
      due_days:                rule.due_days,
    });
    setEditingId(rule.id);
    setFormError(null);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormError(null);
  };

  // ── Save ─────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!form.event_category || !form.consequence_title) {
      setFormError('Event category and consequence title are required.');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      if (editingId) {
        const { data } = await api().put(`/consequence-rules/${editingId}`, form);
        setRules((prev) => prev.map((r) => (r.id === editingId ? data : r)));
      } else {
        const { data } = await api().post(`/organizations/${orgId}/consequence-rules`, form);
        setRules((prev) => [data, ...prev]);
      }
      closeForm();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save rule.');
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ───────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this consequence rule?')) return;
    try {
      await api().delete(`/consequence-rules/${id}`);
      setRules((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete rule.');
    }
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
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Consequence Rules</h1>
          <p className="text-slate-600 mt-1">Set what task gets auto-assigned when a student misses an event</p>
        </div>
        <Button onClick={openCreate} className="gap-2 bg-gradient-to-r from-violet-600 to-violet-700">
          <Plus className="w-4 h-4" /> Add Rule
        </Button>
      </div>

      {/* Info */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4 flex gap-3">
          <AlertTriangle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-800">
            When you <strong>close an event</strong>, the system automatically checks who was absent
            and assigns the matching consequence task to each absent student based on these rules.
          </p>
        </CardContent>
      </Card>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <Card className="w-full max-w-lg shadow-2xl">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardDescription className="text-slate-800 font-semibold text-base">
                {editingId ? 'Edit Consequence Rule' : 'New Consequence Rule'}
              </CardDescription>
              <button onClick={closeForm} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent className="space-y-4 pt-2">
              {formError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {formError}
                </p>
              )}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1">
                    Event Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.event_category}
                    onChange={(e) => setForm({ ...form, event_category: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    <option value="">Select category...</option>
                    {EVENT_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1">
                    Consequence Task Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.consequence_title}
                    onChange={(e) => setForm({ ...form, consequence_title: e.target.value })}
                    placeholder="e.g. Community Service"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Description</label>
                <textarea
                  value={form.consequence_description}
                  onChange={(e) => setForm({ ...form, consequence_description: e.target.value })}
                  placeholder="e.g. Must render 3 hours of community service at the campus"
                  rows={2}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                />
              </div>
              <div className="w-48">
                <label className="text-sm font-medium text-slate-700 block mb-1">
                  Due in (days after event)
                </label>
                <input
                  type="number"
                  min={1}
                  value={form.due_days}
                  onChange={(e) => setForm({ ...form, due_days: parseInt(e.target.value) || 1 })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button onClick={handleSubmit} disabled={saving} className="bg-violet-600 hover:bg-violet-700 gap-2">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingId ? 'Save Changes' : 'Add Rule'}
                </Button>
                <Button variant="outline" onClick={closeForm} disabled={saving}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 text-red-700 text-sm">{error}</CardContent>
        </Card>
      )}

      {/* List */}
      {!loading && !error && (
        <div className="space-y-3">
          {rules.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <AlertTriangle className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                <p className="text-slate-500">No consequence rules set yet.</p>
                <p className="text-slate-400 text-sm mt-1">
                  Add a rule to auto-assign tasks when students miss events.
                </p>
              </CardContent>
            </Card>
          ) : (
            rules.map((rule) => (
              <Card key={rule.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <Badge className="bg-purple-100 text-purple-700">
                          {rule.event_category || rule.event?.title || 'All Events'}
                        </Badge>
                        <span className="text-slate-400 text-sm">→</span>
                        <span className="text-slate-900 font-semibold">{rule.consequence_title}</span>
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <Calendar className="w-3 h-3" />
                          Due {rule.due_days} day{rule.due_days !== 1 ? 's' : ''} after event
                        </div>
                      </div>
                      {rule.consequence_description && (
                        <p className="text-sm text-slate-500">{rule.consequence_description}</p>
                      )}
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button size="sm" variant="outline" onClick={() => openEdit(rule)}>
                        <Pencil className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm" variant="outline"
                        className="text-red-600 hover:bg-red-50"
                        onClick={() => handleDelete(rule.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}