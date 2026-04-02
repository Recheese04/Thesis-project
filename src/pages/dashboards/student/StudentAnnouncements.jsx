import { useState, useEffect } from 'react';
import axios from 'axios';
import { Bell, Calendar, User, Loader2, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// ── Auth / fetch helpers ───────────────────────────────────────────────────
const authH = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

const apiFetch = async (path) => {
  const res = await axios.get(`/api${path}`, authH());
  return res.data;
};

export default function StudentAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await apiFetch('/student/announcements');
        setAnnouncements(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // announcements from < 24 h ago are "new"
  const isNew = (a) => {
    const created = new Date(a.created_at);
    return (Date.now() - created.getTime()) < 24 * 60 * 60 * 1000;
  };

  const newCount = announcements.filter(isNew).length;

  const creatorName = (a) => {
    if (!a.creator) return 'Unknown';
    return `${a.creator.first_name} ${a.creator.last_name}`;
  };

  // ── loading / error / empty guards ──────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-400 gap-2">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-sm">Loading announcements…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-400 gap-3">
        <AlertCircle className="w-8 h-8 text-red-400" />
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold text-slate-900">Announcements</h1>
          <p className="text-slate-600 mt-1 text-sm">Stay updated with important notices</p>
        </div>
        {newCount > 0 && (
          <Badge className="bg-red-500 text-white">{newCount} New</Badge>
        )}
      </div>

      {announcements.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="p-12 text-center">
            <Bell className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No announcements yet from your organizations.</p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {announcements.map((announcement) => {
          const fresh = isNew(announcement);
          return (
            <Card
              key={announcement.id}
              className={fresh ? 'border-l-4 border-l-blue-500 bg-blue-50/30' : ''}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        fresh
                          ? 'bg-gradient-to-br from-blue-500 to-blue-600'
                          : 'bg-slate-100'
                      }`}
                    >
                      <Bell className={`w-6 h-6 ${fresh ? 'text-white' : 'text-slate-400'}`} />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="text-lg font-bold text-slate-900">{announcement.title}</h3>
                      {fresh && (
                        <Badge className="bg-blue-500 text-white">New</Badge>
                      )}
                      {announcement.is_pinned && (
                        <Badge className="bg-amber-100 text-amber-700 border-amber-200">Pinned</Badge>
                      )}
                      {announcement.organization && (
                        <Badge variant="outline" className="bg-slate-50">
                          {announcement.organization.name}
                        </Badge>
                      )}
                    </div>
                    <p className="text-slate-700 mb-4 whitespace-pre-wrap">{announcement.content}</p>
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
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}