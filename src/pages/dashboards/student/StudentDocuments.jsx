import { useState, useEffect } from 'react';
import axios from 'axios';
import { FileText, Download, Calendar, Search, Loader2, HardDrive, Building2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import PageLoader from '@/components/ui/PageLoader';

export default function StudentDocuments() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  const categories = ['Academic', 'Organization', 'Certificate', 'Financial', 'Other'];

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
      const res = await axios.get('/api/student/documents', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDocuments(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (doc) => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
      const response = await axios.get(`/api/documents/${doc.id}/download`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      });
      
      const contentDisposition = response.headers['content-disposition'];
      let filename = `${doc.title}.${doc.file_type.split('/')[1] || 'pdf'}`;
      if (contentDisposition && contentDisposition.indexOf('filename=') !== -1) {
        const regex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
        const matches = regex.exec(contentDisposition);
        if (matches != null && matches[1]) { 
          filename = matches[1].replace(/['"]/g, '');
        }
      }

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      toast.error('Download failed.');
    }
  };

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024, sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const filteredDocs = documents.filter(d => {
    const matchSearch = d.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        d.organization?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory = categoryFilter === 'All' || d.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto w-full">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Documents</h1>
        <p className="text-slate-500 mt-1">Access files shared by your organizations.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="Search documents or organizations..." 
            className="pl-9 bg-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px] bg-white">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Categories</SelectItem>
            {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <PageLoader text="Loading Documents..." />
      ) : filteredDocs.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed">
          <FileText className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-slate-900">No documents available</h3>
          <p className="text-sm text-slate-500 mt-1">
            {documents.length === 0 
              ? "Your organizations haven't shared any documents yet."
              : "No documents match your search criteria."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocs.map(doc => (
            <Card key={doc.id} className="hover:shadow-md transition-shadow group flex flex-col h-full bg-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-violet-50 to-indigo-50/20 rounded-bl-full -z-10 transition-transform group-hover:scale-110" />
              
              <CardHeader className="pb-3 flex-row items-start justify-between space-y-0 gap-2">
                <div className="flex flex-col gap-2 min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Badge variant="outline" className="w-fit text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 bg-violet-50 text-violet-700 border-violet-200">
                      {doc.category}
                    </Badge>
                  </div>
                  <CardTitle className="text-base leading-snug break-words" title={doc.title}>
                    {doc.title}
                  </CardTitle>
                  <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-50 border border-slate-100 px-2 py-1 rounded-md w-fit mt-1">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate max-w-[180px]" title={doc.organization?.name}>{doc.organization?.name}</span>
                  </div>
                </div>
                <div className="p-2 bg-indigo-50 rounded-lg shrink-0">
                  <FileText className="w-5 h-5 text-indigo-500" />
                </div>
              </CardHeader>
              <CardContent className="flex flex-col flex-1 pt-0">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-4 mt-auto">
                  <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {new Date(doc.created_at).toLocaleDateString()}</span>
                  <span className="px-1">•</span>
                  <span className="flex items-center gap-1"><HardDrive className="w-3.5 h-3.5" /> {formatSize(doc.file_size)}</span>
                  <span className="px-1">•</span>
                  <span className="truncate max-w-[80px]" title={`By ${doc.uploader?.first_name} ${doc.uploader?.last_name}`}>By {doc.uploader?.first_name}</span>
                </div>
                
                <div className="pt-3 border-t">
                  <Button 
                    className="w-full gap-2 bg-slate-900 hover:bg-slate-800 text-white"
                    onClick={() => handleDownload(doc)}
                  >
                    <Download className="w-4 h-4" /> Download File
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}