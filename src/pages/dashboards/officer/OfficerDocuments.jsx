import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  FileText, Plus, Search, Loader2, Download, Trash2, Calendar, HardDrive
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import PageLoader from '@/components/ui/PageLoader';

export default function OfficerDocuments() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [orgId, setOrgId] = useState(null);

  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [newDoc, setNewDoc] = useState({ title: '', category: 'Academic', file: null });

  const categories = ['Academic', 'Organization', 'Certificate', 'Financial', 'Other'];

  useEffect(() => {
    fetchProfileAndDocs();
  }, []);

  const fetchProfileAndDocs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
      const headers = { Authorization: `Bearer ${token}` };

      // Try localStorage first (set during login), then fall back to API
      let activeOrgId = localStorage.getItem('organization_id');
      
      if (!activeOrgId) {
        const meRes = await axios.get('/api/me', { headers });
        activeOrgId = meRes.data.user?.designations?.[0]?.organization_id;
      }
      
      if (!activeOrgId) {
        toast.error("You are not assigned to an organization.");
        setLoading(false);
        return;
      }
      
      setOrgId(activeOrgId);
      
      const docRes = await axios.get(`/api/organizations/${activeOrgId}/documents`, { headers });
      setDocuments(docRes.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!newDoc.title || !newDoc.file) {
      toast.error('Please provide a title and select a file.');
      return;
    }
    
    // Size check client-side (10MB limit)
    if (newDoc.file.size > 10 * 1024 * 1024) {
      toast.error('File exceeds the 10MB limit.');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('title', newDoc.title);
    formData.append('category', newDoc.category);
    formData.append('file', newDoc.file);

    try {
      const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
      const res = await axios.post(`/api/organizations/${orgId}/documents`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      setDocuments([res.data, ...documents]);
      setIsUploadOpen(false);
      setNewDoc({ title: '', category: 'Academic', file: null });
      toast.success('Document uploaded successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload document.');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (doc) => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
      // Use standard fetch/Blob combo to download securely
      const response = await axios.get(`/api/documents/${doc.id}/download`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      });
      
      // Extract filename from the backend if possible, or fallback
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

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this document?")) return;
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
      await axios.delete(`/api/documents/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDocuments(documents.filter(d => d.id !== id));
      toast.success('Document deleted.');
    } catch (err) {
      toast.error('Failed to delete document.');
    }
  };

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024, sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const filteredDocs = documents.filter(d => {
    const matchSearch = d.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory = categoryFilter === 'All' || d.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Documents</h1>
          <p className="text-slate-500 mt-1">Manage official organization documents and files.</p>
        </div>
        <Button onClick={() => setIsUploadOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Upload Document
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="Search documents by title..." 
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
          <h3 className="text-lg font-semibold text-slate-900">No documents found</h3>
          <p className="text-sm text-slate-500 mt-1">
            {searchTerm || categoryFilter !== 'All' 
              ? 'Try adjusting your search criteria.' 
              : 'Start by uploading your first organizational document.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocs.map(doc => (
            <Card key={doc.id} className="hover:shadow-md transition-shadow group flex flex-col h-full">
              <CardHeader className="pb-3 flex-row items-start justify-between space-y-0 gap-2">
                <div className="flex flex-col gap-1 min-w-0">
                  <Badge variant="outline" className="w-fit text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 whitespace-nowrap bg-violet-50 text-violet-700 border-violet-200">
                    {doc.category}
                  </Badge>
                  <CardTitle className="text-base leading-snug truncate" title={doc.title}>
                    {doc.title}
                  </CardTitle>
                </div>
                <div className="p-2 bg-slate-100 rounded-lg shrink-0">
                  <FileText className="w-5 h-5 text-slate-500" />
                </div>
              </CardHeader>
              <CardContent className="flex flex-col flex-1 pt-0">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-4 mt-auto">
                  <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {new Date(doc.created_at).toLocaleDateString()}</span>
                  <span className="px-1">•</span>
                  <span className="flex items-center gap-1"><HardDrive className="w-3.5 h-3.5" /> {formatSize(doc.file_size)}</span>
                </div>
                
                <div className="flex items-center gap-2 pt-3 border-t">
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    className="flex-1 gap-2"
                    onClick={() => handleDownload(doc)}
                  >
                    <Download className="w-3.5 h-3.5" /> Download
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="shrink-0 text-slate-400 hover:text-red-600 hover:bg-red-50"
                    onClick={() => handleDelete(doc.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Upload Dialog */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>
              Upload official files for members to view and download. Maximum file size is 10MB.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpload} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="title">Document Title</Label>
              <Input 
                id="title" 
                placeholder="e.g. Master Member List" 
                value={newDoc.title}
                onChange={e => setNewDoc({...newDoc, title: e.target.value})}
                autoFocus
              />
            </div>
            
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={newDoc.category} onValueChange={v => setNewDoc({...newDoc, category: v})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="file">File</Label>
              <Input 
                id="file" 
                type="file" 
                onChange={e => setNewDoc({...newDoc, file: e.target.files[0]})} 
                className="cursor-pointer"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
              />
              <p className="text-[10px] text-slate-500">Allowed formats: PDF, DOCX, JPG, PNG.</p>
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={() => setIsUploadOpen(false)} disabled={uploading}>
                Cancel
              </Button>
              <Button type="submit" disabled={uploading} className="bg-violet-600 hover:bg-violet-700 text-white">
                {uploading ? <div className="flex items-center"><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading</div> : 'Upload'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
