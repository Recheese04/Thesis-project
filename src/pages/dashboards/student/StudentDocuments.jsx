import { FileText, Download, Eye, Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function StudentDocuments() {
  // Mock data
  const documents = [
    {
      id: 1,
      title: 'Certificate of Registration',
      category: 'Academic',
      uploadedBy: 'Registrar',
      date: '2025-08-15',
      size: '245 KB',
    },
    {
      id: 2,
      title: 'Membership Certificate',
      category: 'Organization',
      uploadedBy: 'CS Society',
      date: '2025-09-01',
      size: '180 KB',
    },
    {
      id: 3,
      title: 'Workshop Certificate',
      category: 'Certificate',
      uploadedBy: 'IT Society',
      date: '2026-02-02',
      size: '320 KB',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Documents</h1>
        <p className="text-slate-600 mt-1">Access your submitted documents</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Documents</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{documents.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Certificates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">
              {documents.filter((d) => d.category === 'Certificate').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Academic</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">
              {documents.filter((d) => d.category === 'Academic').length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>My Documents</CardTitle>
          <CardDescription>All your available documents</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-start gap-4 p-4 rounded-lg border hover:bg-slate-50"
            >
              <div className="w-12 h-12 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
                <FileText className="w-6 h-6 text-red-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900 mb-1">{doc.title}</h3>
                <div className="flex items-center gap-3 text-sm text-slate-600 mb-2">
                  <Badge variant="outline">{doc.category}</Badge>
                  <span>{doc.uploadedBy}</span>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(doc.date).toLocaleDateString()}
                  </div>
                  <span>{doc.size}</span>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="gap-2">
                    <Eye className="w-4 h-4" />
                    View
                  </Button>
                  <Button size="sm" className="gap-2">
                    <Download className="w-4 h-4" />
                    Download
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}