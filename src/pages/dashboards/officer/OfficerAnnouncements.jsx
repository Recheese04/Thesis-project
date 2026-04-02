import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Bell, Plus, Calendar, User, Edit, Trash2, Pin, PinOff,
  Loader2, AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';

// ── Auth / fetch helpers (same pattern as OfficerMembers) ──────────────────
const authH = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

const apiFetch = async (path, options = {}) => {
  const method = (options.method ?? 'GET').toUpperCase();
  const body = options.body ? JSON.parse(options.body) : undefined;
  let res;
  if (method === 'GET')    res = await axios.get(`/api${path}`, authH());
  else if (method === 'POST')   res = await axios.post(`/api${path}`, body, authH());
  else if (method === 'PUT')    res = await axios.put(`/api${path}`, body, authH());
  else if (method === 'PATCH')  res = await axios.patch(`/api${path}`, body, authH());
  else if (method === 'DELETE') res = await axios.delete(`/api${path}`, authH());
  return res.data;
};

// ── Toast helper ─────────────────────────────────────────────────────────────
const useToast = () => {
  const [toasts, setToasts] = useState([]);
  const push = (msg, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  };
  return { toasts, push };
};

const ToastContainer = ({ toasts }) => (
  <div className="fixed bottom-4 right-4 z-50 space-y-2">
    {toasts.map(t => (
      <div
        key={t.id}
        className={`px-4 py-2.5 rounded-xl text-sm font-medium shadow-lg border transition-all animate-in slide-in-from-right ${
          t.type === 'error'
            ? 'bg-red-50 text-red-700 border-red-200'
            : 'bg-green-50 text-green-700 border-green-200'
        }`}
      >
        {t.msg}
      </div>
    ))}
  </div>
);

export default function OfficerAnnouncements() {
  // ── resolve orgId from /me (same pattern as OfficerMembers) ────────────
  const [orgId, setOrgId] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const me = await apiFetch('/me');
        if (!me?.organization_id) {
          setAuthError('You are not assigned as an officer in any organization.');
          return;
        }
        setOrgId(me.organization_id);
      } catch (err) {
        setAuthError(err.message);
      } finally {
        setAuthLoading(false);
      }
    })();
  }, []);

  // ── data ──────────────────────────────────────────────────────────────────
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { toasts, push: pushToast } = useToast();

  // ── dialog state ─────────────────────────────────────────────────────────
  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState(null);       // announcement object or null
  const [deleteTarget, setDeleteTarget] = useState(null);    // announcement object or null

  // ── fetch ─────────────────────────────────────────────────────────────────
  const fetchAnnouncements = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch(`/organizations/${orgId}/announcements`);
      setAnnouncements(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => { fetchAnnouncements(); }, [fetchAnnouncements]);

  // ── actions ───────────────────────────────────────────────────────────────
  const handleCreated = (a) => {
    setAnnouncements(prev => [a, ...prev]);
    pushToast('Announcement created!');
  };

  const handleUpdated = (a) => {
    setAnnouncements(prev => prev.map(x => x.id === a.id ? a : x));
    pushToast('Announcement updated!');
  };

  const handleTogglePin = async (a) => {
    try {
      const updated = await apiFetch(`/announcements/${a.id}/pin`, { method: 'PATCH' });
      setAnnouncements(prev => prev.map(x => x.id === updated.id ? updated : x));
      pushToast(updated.is_pinned ? 'Pinned!' : 'Unpinned!');
    } catch (err) {
      pushToast(err.message || 'Failed to toggle pin', 'error');
    }
  };

  const handleDeleted = (id) => {
    setAnnouncements(prev => prev.filter(x => x.id !== id));
    pushToast('Announcement deleted.');
  };

  // ── derived stats ─────────────────────────────────────────────────────────
  const totalCount = announcements.length;
  const pinnedCount = announcements.filter(a => a.is_pinned).length;

  const creatorName = (a) => {
    if (!a.creator) return 'Unknown';
    return `${a.creator.first_name} ${a.creator.last_name}`;
  };

  // ── guards ────────────────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-400 gap-2">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-sm">Loading your organization…</span>
      </div>
    );
  }
  if (authError || !orgId) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-400 gap-3">
        <AlertCircle className="w-8 h-8 text-red-400" />
        <p className="text-sm">{authError ?? 'No organization found for your account.'}</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-3xl font-bold text-slate-900">Announcements</h1>
            <p className="text-slate-600 mt-1 text-sm">Send announcements to organization members</p>
          </div>
          <Button
            onClick={() => setShowCreate(true)}
            className="gap-2 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-md"
          >
            <Plus className="w-4 h-4" />
            Create Announcement
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Announcements</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{totalCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Pinned</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{pinnedCount}</div>
            </CardContent>
          </Card>
        </div>

        {/* Loading / Error / Empty */}
        {loading && (
          <div className="flex items-center justify-center py-16 text-slate-400 gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Loading announcements…</span>
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
            <AlertCircle className="w-8 h-8 text-red-400" />
            <p className="text-sm">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchAnnouncements} className="rounded-xl">Retry</Button>
          </div>
        )}

        {!loading && !error && announcements.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="p-12 text-center">
              <Bell className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 mb-4">No announcements yet</p>
              <Button onClick={() => setShowCreate(true)} className="gap-2 rounded-xl">
                <Plus className="w-4 h-4" />
                Create Announcement
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Announcements List */}
        {!loading && !error && announcements.length > 0 && (
          <div className="space-y-4">
            {announcements.map((announcement) => (
              <Card key={announcement.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        announcement.is_pinned
                          ? 'bg-gradient-to-br from-amber-400 to-amber-500'
                          : 'bg-gradient-to-br from-blue-500 to-blue-600'
                      }`}>
                        {announcement.is_pinned
                          ? <Pin className="w-6 h-6 text-white" />
                          : <Bell className="w-6 h-6 text-white" />
                        }
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h3 className="text-lg font-bold text-slate-900">{announcement.title}</h3>
                          {announcement.is_pinned && (
                            <Badge className="bg-amber-100 text-amber-700 border-amber-200">Pinned</Badge>
                          )}
                        </div>
                      </div>

                      <p className="text-slate-700 mb-4 whitespace-pre-wrap">{announcement.content}</p>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-4 text-sm text-slate-600">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-slate-400" />
                            <span className="font-medium">{creatorName(announcement)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            <span>
                              {new Date(announcement.created_at).toLocaleDateString('en-US', {
                                month: 'long',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </span>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5 rounded-lg"
                            onClick={() => handleTogglePin(announcement)}
                          >
                            {announcement.is_pinned
                              ? <><PinOff className="w-4 h-4" /> Unpin</>
                              : <><Pin className="w-4 h-4" /> Pin</>
                            }
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5 rounded-lg"
                            onClick={() => setEditTarget(announcement)}
                          >
                            <Edit className="w-4 h-4" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5 rounded-lg text-red-600 hover:text-red-700"
                            onClick={() => setDeleteTarget(announcement)}
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* ── Create Dialog ───────────────────────────────────────────────────── */}
      {showCreate && (
        <CreateAnnouncementDialog
          orgId={orgId}
          onClose={() => setShowCreate(false)}
          onCreated={handleCreated}
          pushToast={pushToast}
        />
      )}

      {/* ── Edit Dialog ─────────────────────────────────────────────────────── */}
      {editTarget && (
        <EditAnnouncementDialog
          announcement={editTarget}
          onClose={() => setEditTarget(null)}
          onUpdated={handleUpdated}
          pushToast={pushToast}
        />
      )}

      {/* ── Delete Confirm Dialog ───────────────────────────────────────────── */}
      {deleteTarget && (
        <DeleteAnnouncementDialog
          announcement={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={handleDeleted}
          pushToast={pushToast}
        />
      )}

      <ToastContainer toasts={toasts} />
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Create Announcement Dialog
// ─────────────────────────────────────────────────────────────────────────────
const CreateAnnouncementDialog = ({ orgId, onClose, onCreated, pushToast }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) return;
    setSaving(true);
    try {
      const data = await apiFetch(`/organizations/${orgId}/announcements`, {
        method: 'POST',
        body: JSON.stringify({ title: title.trim(), content: content.trim() }),
      });
      onCreated(data);
      onClose();
    } catch (err) {
      pushToast(err.response?.data?.message || err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-600" />
            Create Announcement
          </DialogTitle>
          <DialogDescription>
            This will be visible to all members of your organization.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input
              placeholder="e.g. Upcoming General Assembly"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label>Content</Label>
            <Textarea
              placeholder="Write your announcement here…"
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={5}
              className="rounded-xl resize-none"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} className="rounded-xl">Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={saving || !title.trim() || !content.trim()}
            className="rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 gap-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Edit Announcement Dialog
// ─────────────────────────────────────────────────────────────────────────────
const EditAnnouncementDialog = ({ announcement, onClose, onUpdated, pushToast }) => {
  const [title, setTitle] = useState(announcement.title);
  const [content, setContent] = useState(announcement.content);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) return;
    setSaving(true);
    try {
      const data = await apiFetch(`/announcements/${announcement.id}`, {
        method: 'PUT',
        body: JSON.stringify({ title: title.trim(), content: content.trim() }),
      });
      onUpdated(data);
      onClose();
    } catch (err) {
      pushToast(err.response?.data?.message || err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="w-5 h-5 text-blue-600" />
            Edit Announcement
          </DialogTitle>
          <DialogDescription>Update the announcement details.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label>Content</Label>
            <Textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={5}
              className="rounded-xl resize-none"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} className="rounded-xl">Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={saving || !title.trim() || !content.trim()}
            className="rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 gap-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Delete Confirmation Dialog
// ─────────────────────────────────────────────────────────────────────────────
const DeleteAnnouncementDialog = ({ announcement, onClose, onDeleted, pushToast }) => {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      await apiFetch(`/announcements/${announcement.id}`, { method: 'DELETE' });
      onDeleted(announcement.id);
      onClose();
    } catch (err) {
      pushToast(err.response?.data?.message || err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle>Delete Announcement</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete <strong>"{announcement.title}"</strong>?
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} className="rounded-xl">Cancel</Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
            className="rounded-xl gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};