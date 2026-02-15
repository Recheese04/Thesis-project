import { CheckCircle, Clock, Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function StudentObligations() {
  // Mock data
  const stats = {
    total: 8,
    completed: 6,
    pending: 2,
    rate: 75,
  };

  const obligations = [
    {
      id: 1,
      title: 'Attend General Assembly',
      organization: 'Student Council',
      dueDate: '2026-02-20',
      status: 'pending',
    },
    {
      id: 2,
      title: 'Pay Membership Dues',
      organization: 'CS Society',
      dueDate: '2026-03-01',
      status: 'completed',
      completedDate: '2025-08-15',
    },
    {
      id: 3,
      title: 'Complete Community Service',
      organization: 'Student Affairs',
      dueDate: '2026-03-15',
      status: 'pending',
      progress: 70,
      notes: '7/10 hours completed',
    },
  ];

  const pending = obligations.filter((o) => o.status === 'pending');
  const completed = obligations.filter((o) => o.status === 'completed');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Obligations</h1>
        <p className="text-slate-600 mt-1">Track your requirements</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Completion</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900 mb-2">{stats.rate}%</div>
            <Progress value={stats.rate} className="h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Completed</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <span className="text-3xl font-bold text-slate-900">{stats.completed}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Pending</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="w-8 h-8 text-amber-600" />
              <span className="text-3xl font-bold text-slate-900">{stats.pending}</span>
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
          {pending.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Clock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-slate-900">{item.title}</h3>
                      <Badge className="bg-amber-100 text-amber-700">Pending</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-600 mb-3">
                      <span>{item.organization}</span>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Due {new Date(item.dueDate).toLocaleDateString()}
                      </div>
                    </div>
                    {item.progress && (
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-slate-600">{item.notes}</span>
                          <span className="font-bold">{item.progress}%</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full">
                          <div
                            className="h-full bg-blue-600 rounded-full"
                            style={{ width: `${item.progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4 mt-6">
          {completed.map((item) => (
            <Card key={item.id} className="opacity-80">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-slate-900">{item.title}</h3>
                      <Badge className="bg-green-100 text-green-700">Completed</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-600">
                      <span>{item.organization}</span>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Completed {new Date(item.completedDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}