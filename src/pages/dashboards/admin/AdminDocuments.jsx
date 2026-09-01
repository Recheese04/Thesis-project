import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  FileText, Search, Download, Trash2, Calendar, HardDrive,
  RefreshCw, Building2, Loader2, X, AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";

const authH = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});

const formatSize = (bytes) => {
  if (!bytes) return "—";
  const k = 1024, sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

const formatDate = (ts) => {
  if (!ts) return "—";
  return new Date(ts).toLocaleDateString("en-PH", {
    month: "short", day: "numeric", year: "numeric",
  });
};

const CATEGORY_COLORS = {
  Academic:     "bg-blue-50 text-blue-700 border-blue-200",
  Organization: "bg-violet-50 text-violet-700 border-violet-200",
  Certificate:  "bg-emerald-50 text-emerald-700 border-emerald-200",
  Financial:    "bg-amber-50 text-amber-700 border-amber-200",
  Other:        "bg-slate-100 text-slate-600 border-slate-200",
};

// ── Stat Card ──────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, grad }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${grad} p-5 text-white shadow-md`}>
      <div className="absolute -right-5 -top-5 w-28 h-28 rounded-full bg-white/10" />
      <div className="absolute -right-2 -bottom-8 w-36 h-36 rounded-full bg-white/5" />
      <div className="relative z-10 flex items-start justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-white/60 mb-1">{label}</p>
          <p className="text-4xl font-extrabold tracking-tight">{value ?? "—"}</p>
          {sub && <p className="text-xs text-white/50 mt-1">{sub}</p>}
        </div>
        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function AdminDocuments() {
  const [organizations, setOrganizations] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [orgFilter, setOrgFilter] = useState("all");
  const [deleteTarget, setDeleteTarget] = useState(null);

  const categories = ["Academic", "Organization", "Certificate", "Financial", "Other"];

  // ── Fetch all organizations, then fetch docs from each ────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const orgRes = await axios.get("/api/organizations", authH());
      const orgs = orgRes.data;
      setOrganizations(orgs);

      // Fetch documents from each organization in parallel
      const docPromises = orgs.map((org) =>
        axios
          .get(`/api/organizations/${org.id}/documents`, authH())
          .then((res) =>
            (res.data || []).map((doc) => ({
              ...doc,
              organization_name: org.name,
              organization_id: org.id,
            }))
          )
          .catch(() => [])
      );

      const allDocs = (await Promise.all(docPromises)).flat();
      // Sort newest first
      allDocs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setDocuments(allDocs);
    } catch {
      toast.error("Failed to load documents.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Download ──────────────────────────────────────────────────────────
  const handleDownload = async (doc) => {
    try {
      const response = await axios.get(`/api/documents/${doc.id}/download`, {
        ...authH(),
        responseType: "blob",
      });

      const contentDisposition = response.headers["content-disposition"];
      let filename = `${doc.title}.${(doc.file_type || "application/pdf").split("/")[1] || "pdf"}`;
      if (contentDisposition && contentDisposition.indexOf("filename=") !== -1) {
        const regex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
        const matches = regex.exec(contentDisposition);
        if (matches?.[1]) filename = matches[1].replace(/['"]/g, "");
      }

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error("Download failed.");
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await axios.delete(`/api/documents/${deleteTarget.id}`, authH());
      setDocuments((prev) => prev.filter((d) => d.id !== deleteTarget.id));
      toast.success("Document deleted.");
    } catch {
      toast.error("Failed to delete document.");
    } finally {
      setDeleteTarget(null);
    }
  };

  // ── Filter ────────────────────────────────────────────────────────────
  const filtered = documents.filter((d) => {
    const q = search.toLowerCase();
    const matchSearch =
      !search ||
      d.title?.toLowerCase().includes(q) ||
      d.organization_name?.toLowerCase().includes(q) ||
      d.uploader?.first_name?.toLowerCase().includes(q) ||
      d.uploader?.last_name?.toLowerCase().includes(q);
    const matchCategory = categoryFilter === "all" || d.category === categoryFilter;
    const matchOrg = orgFilter === "all" || String(d.organization_id) === orgFilter;
    return matchSearch && matchCategory && matchOrg;
  });

  // ── Stats ─────────────────────────────────────────────────────────────
  const totalDocs = documents.length;
  const totalOrgs = new Set(documents.map((d) => d.organization_id)).size;
  const totalSize = documents.reduce((sum, d) => sum + (d.file_size || 0), 0);
  const categoryBreakdown = categories.reduce((acc, c) => {
    acc[c] = documents.filter((d) => d.category === c).length;
    return acc;
  }, {});
  const topCategory = Object.entries(categoryBreakdown).sort((a, b) => b[1] - a[1])[0];

  // ── Uploader name helper ──────────────────────────────────────────────
  const uploaderName = (doc) => {
    if (!doc.uploader) return "Unknown";
    return `${doc.uploader.first_name || ""} ${doc.uploader.last_name || ""}`.trim() || "Unknown";
  };

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <TooltipProvider>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#0f2d5e] to-[#1e4db7] flex items-center justify-center shadow-lg shadow-[#0f2d5e]/25">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-[#0f2d5e] tracking-tight">Document Management</h1>
              <p className="text-slate-500 text-xs mt-0.5">View and manage documents across all organizations</p>
            </div>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" onClick={fetchAll} disabled={loading}
                className="border-[#0f2d5e]/20 text-[#0f2d5e] hover:bg-[#0f2d5e]/5 h-9 w-9 rounded-xl bg-white shadow-sm">
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Refresh</TooltipContent>
          </Tooltip>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={FileText} label="Total Documents" value={totalDocs}
            sub={`Across ${totalOrgs} organization${totalOrgs !== 1 ? "s" : ""}`}
            grad="from-[#0f2d5e] to-[#1a4a8a]" />
          <StatCard icon={Building2} label="Organizations" value={totalOrgs}
            sub="With documents"
            grad="from-[#059669] to-[#10b981]" />
          <StatCard icon={HardDrive} label="Total Size" value={formatSize(totalSize)}
            sub="Storage used"
            grad="from-[#2563eb] to-[#5b9ef7]" />
          <StatCard icon={Calendar} label="Top Category"
            value={topCategory?.[0] || "—"}
            sub={topCategory ? `${topCategory[1]} document${topCategory[1] !== 1 ? "s" : ""}` : ""}
            grad="from-[#7c3aed] to-[#a78bfa]" />
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by title, organization, or uploader…"
                className="pl-9 pr-8 h-9 border-slate-200 bg-slate-50 focus:bg-white focus:border-[#1e4db7] text-sm rounded-xl"
              />
              {search && (
                <button onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <Select value={orgFilter} onValueChange={setOrgFilter}>
              <SelectTrigger className="w-48 h-9 border-slate-200 bg-slate-50 text-sm rounded-xl">
                <SelectValue placeholder="All Organizations" />
              </SelectTrigger>
              <SelectContent className="rounded-xl max-h-60">
                <SelectItem value="all">All Organizations</SelectItem>
                {organizations.map((org) => (
                  <SelectItem key={org.id} value={String(org.id)}>
                    <div className="flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      {org.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-40 h-9 border-slate-200 bg-slate-50 text-sm rounded-xl">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Document Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center py-24">
              <Loader2 className="w-7 h-7 text-[#1e4db7] animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <FileText className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-700">No documents found</h3>
              <p className="text-sm text-slate-400 mt-1">
                {search || categoryFilter !== "all" || orgFilter !== "all"
                  ? "Try adjusting your filters."
                  : "No documents have been uploaded yet."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="text-left px-5 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">Document</th>
                    <th className="text-left px-5 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">Organization</th>
                    <th className="text-left px-5 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">Category</th>
                    <th className="text-left px-5 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">Uploaded By</th>
                    <th className="text-left px-5 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">Size</th>
                    <th className="text-left px-5 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">Date</th>
                    <th className="text-right px-5 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((doc) => {
                    const catColor = CATEGORY_COLORS[doc.category] || CATEGORY_COLORS.Other;
                    return (
                      <tr key={doc.id} className="hover:bg-slate-50/60 transition-colors">
                        {/* Title */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0f2d5e] to-[#1e4db7] flex items-center justify-center shrink-0">
                              <FileText className="w-4 h-4 text-white" />
                            </div>
                            <span className="font-medium text-slate-800 truncate max-w-[200px]" title={doc.title}>
                              {doc.title}
                            </span>
                          </div>
                        </td>
                        {/* Organization */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <Building2 className="w-3.5 h-3.5 text-slate-400" />
                            <span className="truncate max-w-[140px]">{doc.organization_name}</span>
                          </div>
                        </td>
                        {/* Category */}
                        <td className="px-5 py-3.5">
                          <Badge variant="outline" className={`text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 border ${catColor}`}>
                            {doc.category}
                          </Badge>
                        </td>
                        {/* Uploader */}
                        <td className="px-5 py-3.5 text-slate-600">{uploaderName(doc)}</td>
                        {/* Size */}
                        <td className="px-5 py-3.5 text-slate-500 font-mono text-xs">{formatSize(doc.file_size)}</td>
                        {/* Date */}
                        <td className="px-5 py-3.5 text-slate-500 text-xs">{formatDate(doc.created_at)}</td>
                        {/* Actions */}
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={() => handleDownload(doc)}
                                  className="h-8 w-8 text-slate-400 hover:text-[#1e4db7] hover:bg-blue-50">
                                  <Download className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Download</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(doc)}
                                  className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Delete</TooltipContent>
                            </Tooltip>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer count */}
          {!loading && filtered.length > 0 && (
            <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 text-xs text-slate-500">
              Showing <strong className="text-slate-700">{filtered.length}</strong> of{" "}
              <strong className="text-slate-700">{totalDocs}</strong> documents
            </div>
          )}
        </div>

        {/* Delete Dialog */}
        <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
          <AlertDialogContent className="rounded-2xl border-0 shadow-2xl max-w-sm">
            <AlertDialogHeader>
              <div className="flex justify-center mb-3">
                <div className="w-14 h-14 rounded-2xl bg-red-50 ring-8 ring-red-50/50 flex items-center justify-center">
                  <AlertTriangle className="w-7 h-7 text-red-500" />
                </div>
              </div>
              <AlertDialogTitle className="text-center text-slate-900">Delete this document?</AlertDialogTitle>
              <AlertDialogDescription className="text-center text-slate-500 text-sm">
                Permanently remove <strong className="text-slate-700">{deleteTarget?.title ?? "this document"}</strong>.
                This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex gap-2 mt-1">
              <AlertDialogCancel className="flex-1 rounded-xl border-slate-200">Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete}
                className="flex-1 rounded-xl bg-red-600 hover:bg-red-700 text-white">
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
}
