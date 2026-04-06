import { useState, useEffect } from 'react';
import axios from 'axios';
import { CheckCircle, Clock, Calendar, DollarSign, AlertTriangle, Loader2, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const authH = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

export default function StudentObligations() {
  const [fees, setFees] = useState([]);
  const [consequences, setConsequences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get('/api/student/obligations', authH());
        setFees(data.fees || []);
        setConsequences(data.consequences || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load obligations.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const allItems = [...fees, ...consequences];
  const pending = allItems.filter(o => o.status === 'pending');
  const completed = allItems.filter(o => o.status === 'completed');
  const total = allItems.length;
  const rate = total > 0 ? Math.round((completed.length / total) * 100) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-400 gap-2">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-sm">Loading obligations…</span>
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
      <div>
        <h1 className="text-xl sm:text-3xl font-bold text-slate-900">Obligations</h1>
        <p className="text-slate-600 mt-1 text-sm">Track your fees and assigned tasks</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardHeader className="pb-2 pt-3 px-4"><CardDescription className="text-xs">Completion</CardDescription></CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="text-2xl font-bold text-slate-900 mb-2">{rate}%</div>
            <Progress value={rate} className="h-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 pt-3 px-4"><CardDescription className="text-xs">Total</CardDescription></CardHeader>
          <CardContent className="px-4 pb-3"><div className="text-2xl font-bold text-slate-900">{total}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 pt-3 px-4"><CardDescription className="text-xs">Completed</CardDescription></CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <span className="text-2xl font-bold text-slate-900">{completed.length}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 pt-3 px-4"><CardDescription className="text-xs">Pending</CardDescription></CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-6 h-6 text-amber-600" />
              <span className="text-2xl font-bold text-slate-900">{pending.length}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">
            Pending
            <Badge className="ml-2 bg-amber-100 text-amber-700">{pending.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed
            <Badge className="ml-2 bg-green-100 text-green-700">{completed.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4 mt-6">
          {pending.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <CheckCircle className="w-12 h-12 text-green-200 mx-auto mb-4" />
                <p className="text-slate-500 font-semibold">All clear!</p>
                <p className="text-slate-400 text-sm mt-1">You have no pending obligations.</p>
              </CardContent>
            </Card>
          ) : (
            pending.map(item => (
              <ObligationCard key={`${item.type}-${item.id}`} item={item} />
            ))
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4 mt-6">
          {completed.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-slate-400 text-sm">No completed obligations yet.</p>
              </CardContent>
            </Card>
          ) : (
            completed.map(item => (
              <ObligationCard key={`${item.type}-${item.id}`} item={item} />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ObligationCard({ item }) {
  const isPending = item.status === 'pending';
  return (
    <Card className={!isPending ? 'opacity-75' : ''}>
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          {item.type === 'fee' ? (
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isPending ? 'bg-emerald-50' : 'bg-green-50'}`}>
              <DollarSign className={`w-5 h-5 ${isPending ? 'text-emerald-600' : 'text-green-600'}`} />
            </div>
          ) : (
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isPending ? 'bg-amber-50' : 'bg-green-50'}`}>
              {isPending ? <AlertTriangle className="w-5 h-5 text-amber-600" /> : <CheckCircle className="w-5 h-5 text-green-600" />}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h3 className="text-base font-bold text-slate-900">{item.title}</h3>
              {item.type === 'fee' ? (
                <Badge className="bg-emerald-100 text-emerald-700">Fee</Badge>
              ) : (
                <Badge className="bg-purple-100 text-purple-700">Consequence</Badge>
              )}
              <Badge className={isPending ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}>
                {isPending ? 'Pending' : 'Completed'}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-sm text-slate-600 flex-wrap">
              <span>{item.organization}</span>
              {item.amount && <span className="font-semibold">₱{parseFloat(item.amount).toFixed(2)}</span>}
              {item.due_date && (
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Due {new Date(item.due_date).toLocaleDateString()}
                </div>
              )}
              {item.event_title && <span>Event: {item.event_title}</span>}
              {item.completed_at && (
                <div className="flex items-center gap-1 text-green-600">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Completed {new Date(item.completed_at).toLocaleDateString()}
                </div>
              )}
            </div>
            {item.description && <p className="text-sm text-slate-500 mt-2">{item.description}</p>}
            {item.notes && <p className="text-xs text-slate-400 mt-1 italic">Note: {item.notes}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}