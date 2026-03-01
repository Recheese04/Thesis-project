import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { CheckCircle, Clock, AlertCircle, XCircle, Loader2, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

const authH = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

const getStudentId = () => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    return user?.student_id || null;
  } catch { return null; }
};

const getOrgId = () => {
  const orgId = localStorage.getItem('organization_id');
  if (orgId && orgId !== '' && orgId !== 'null' && orgId !== 'undefined') {
    return parseInt(orgId);
  }
  try {
    const membership = JSON.parse(localStorage.getItem('membership') || 'null');
    if (membership?.organization_id) return membership.organization_id;
  } catch { }
  return null;
};

export default function StudentClearance() {
  const studentId = getStudentId();
  const orgId = getOrgId();

  const schoolYear = '2025-2026';
  const semester = '2nd';

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchClearance = useCallback(async () => {
    if (!studentId || !orgId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`/api/students/${studentId}/clearance`, {
        params: { org_id: orgId, school_year: schoolYear, semester },
        ...authH(),
      });
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load clearance data.');
    } finally {
      setLoading(false);
    }
  }, [studentId, orgId]);

  useEffect(() => { fetchClearance(); }, [fetchClearance]);

  // ── Guard: missing IDs ──────────────────────────────────────────────────
  if (!studentId || !orgId) {
    return (
      <div className="flex items-center justify-center h-48">
        <p className="text-slate-500 text-sm">
          No organization found for your account.
        </p>
      </div>
    );
  }

  // ── Derived values ──────────────────────────────────────────────────────
  const overallStatus = data?.overall_status || 'pending';
  const completionRate = data?.completion_rate || 0;
  const completed = data?.completed || 0;
  const pending = data?.pending || 0;
  const requirements = data?.requirements || [];

  const StatusIcon = ({ status }) => {
    if (status === 'cleared') return <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />;
    if (status === 'rejected') return <XCircle className="w-5 h-5 text-red-500   flex-shrink-0 mt-1" />;
    return <Clock className="w-5 h-5 text-amber-600  flex-shrink-0 mt-1" />;
  };

  const statusLabel = (status) => {
    if (status === 'cleared') return 'Cleared';
    if (status === 'rejected') return 'Rejected';
    return 'Pending';
  };

  const statusBadgeClass = (status) => {
    if (status === 'cleared') return 'bg-green-100 text-green-700';
    if (status === 'rejected') return 'bg-red-100 text-red-600';
    return 'bg-amber-100 text-amber-700';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Clearance Status</h1>
          <p className="text-slate-600 mt-1">
            {schoolYear} — {semester} Semester
          </p>
        </div>
        <Button variant="outline" onClick={fetchClearance} disabled={loading} className="gap-2">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-900">Error</AlertTitle>
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {/* Content */}
      {!loading && !error && (
        <>
          {/* Pending alert */}
          {overallStatus === 'pending' && requirements.length > 0 && (
            <Alert className="border-amber-200 bg-amber-50">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertTitle className="text-amber-900">Action Required</AlertTitle>
              <AlertDescription className="text-amber-800">
                You have {pending} pending requirement(s). Please coordinate with your organization officers.
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
                  {completionRate}%
                </div>
                <Progress value={completionRate} className="h-2" />
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
                    {completed}
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
                    {pending}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Requirements list */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900">Requirements</h2>

            {requirements.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <CheckCircle className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                  <p className="text-slate-400">No clearance requirements found for this organization.</p>
                </CardContent>
              </Card>
            ) : (
              requirements.map((item) => {
                const req = item.requirement;
                const status = item.status;

                return (
                  <Card key={req.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <StatusIcon status={status} />
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1 flex-wrap">
                            <h3 className="text-lg font-bold text-slate-900">{req.name}</h3>
                            <Badge className={statusBadgeClass(status)}>
                              {statusLabel(status)}
                            </Badge>
                          </div>
                          {req.type && (
                            <p className="text-sm text-slate-600 mb-2 capitalize">
                              {req.type === 'auto' ? 'Auto-computed (Attendance)' : 'Manual Verification'}
                            </p>
                          )}
                          <div className="bg-slate-50 rounded-lg p-3 border">
                            <p className="text-sm text-slate-600">
                              {item.notes || req.description || 'No additional details'}
                            </p>
                            {item.cleared_at && (
                              <p className="text-xs text-slate-500 mt-1">
                                Cleared: {new Date(item.cleared_at).toLocaleDateString('en-US', {
                                  month: 'long', day: 'numeric', year: 'numeric',
                                })}
                              </p>
                            )}
                            {item.cleared_by && (
                              <p className="text-xs text-slate-500 mt-0.5">
                                By: {item.cleared_by}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>

          {/* Overall cleared banner */}
          {overallStatus === 'cleared' && requirements.length > 0 && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-900">All Clear!</AlertTitle>
              <AlertDescription className="text-green-800">
                You have completed all clearance requirements for {schoolYear} — {semester} Semester.
              </AlertDescription>
            </Alert>
          )}
        </>
      )}
    </div>
  );
}