import { CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function StudentClearance() {
  // Mock data - replace with actual API call
  const clearanceStatus = {
    overallStatus: 'pending', // 'cleared', 'pending'
    completionRate: 75,
    completed: 6,
    pending: 2,
    deadline: '2026-03-15',
  };

  const requirements = [
    {
      id: 1,
      name: 'Minimum Attendance (80%)',
      department: 'Student Organizations',
      status: 'completed',
      completedDate: '2026-02-10',
      notes: '16/20 events attended',
    },
    {
      id: 2,
      name: 'Membership Dues Payment',
      department: 'Student Organizations',
      status: 'completed',
      completedDate: '2025-08-15',
      notes: 'Payment verified',
    },
    {
      id: 3,
      name: 'Library - No Pending Books',
      department: 'Library',
      status: 'pending',
      notes: '1 book pending return',
    },
    {
      id: 4,
      name: 'Community Service Hours',
      department: 'Student Affairs',
      status: 'pending',
      notes: '7/10 hours completed',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Clearance Status</h1>
        <p className="text-slate-600 mt-1">Monitor your clearance requirements</p>
      </div>

      {/* Alert */}
      {clearanceStatus.overallStatus === 'pending' && (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-900">Action Required</AlertTitle>
          <AlertDescription className="text-amber-800">
            You have {clearanceStatus.pending} pending requirement(s). Deadline:{' '}
            {new Date(clearanceStatus.deadline).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </AlertDescription>
        </Alert>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Overall Progress</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900 mb-2">
              {clearanceStatus.completionRate}%
            </div>
            <Progress value={clearanceStatus.completionRate} className="h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Completed</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <CheckCircle className="w-10 h-10 text-green-600" />
              <span className="text-3xl font-bold text-slate-900">
                {clearanceStatus.completed}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Pending</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Clock className="w-10 h-10 text-amber-600" />
              <span className="text-3xl font-bold text-slate-900">
                {clearanceStatus.pending}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Requirements */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Requirements</h2>
        {requirements.map((req) => (
          <Card key={req.id}>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                {req.status === 'completed' ? (
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
                ) : (
                  <Clock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-1" />
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-lg font-bold text-slate-900">{req.name}</h3>
                    <Badge
                      className={
                        req.status === 'completed'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-amber-100 text-amber-700'
                      }
                    >
                      {req.status === 'completed' ? 'Cleared' : 'Pending'}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-600 mb-2">{req.department}</p>
                  <div className="bg-slate-50 rounded-lg p-3 border">
                    <p className="text-sm text-slate-600">{req.notes}</p>
                    {req.completedDate && (
                      <p className="text-xs text-slate-500 mt-1">
                        Completed: {new Date(req.completedDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}