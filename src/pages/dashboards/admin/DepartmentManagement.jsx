import { useEffect, useState } from "react";
import axios from "axios";
import {
  Building2, Plus, Loader2, Trash2, Pencil, Search, X,
  RefreshCw, MoreHorizontal, Users, Briefcase, AlertTriangle,
  CheckCircle2, TrendingUp, Building, Hash
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";

// ── Helpers ────────────────────────────────────────────────────────────────
const authH = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });

const EMPTY_FORM = {
  name: "",
  code: "",
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
          <p className="text-4xl font-extrabold tracking-tight">{value}</p>
          {sub && <p className="text-xs text-white/50 mt-1">{sub}</p>}
        </div>
        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  );
}

// ── Department Form Modal ──────────────────────────────────────────────────
function DepartmentFormModal({ open, onClose, onSaved, editDept }) {
  const isEdit = Boolean(editDept);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(editDept ? {
      name: editDept.name ?? "",
      code: editDept.code ?? "",
    } : EMPTY_FORM);
  }, [open, editDept]);

  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = isEdit
        ? await axios.put(`/api/departments/${editDept.id}`, form, authH())
        : await axios.post("/api/departments", form, authH());
      
      toast.success(isEdit ? "Department Updated!" : "Department Created!", {
        description: response.data.message,
      });
      
      onSaved();
      onClose();
    } catch (err) {
      const errs = err.response?.data?.errors;
      const errorMessage = errs ? Object.values(errs).flat().join("\n") : err.response?.data?.message ?? "An error occurred.";
      
      toast.error("Error", {
        description: errorMessage,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="bg-white border-0 shadow-2xl sm:max-w-[480px] p-0 rounded-2xl gap-0">
        
        {/* Header */}
        <div className="bg-gradient-to-br from-[#0f2d5e] via-[#153d80] to-[#1e4db7] px-6 py-5 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              {isEdit ? <Pencil className="w-5 h-5 text-white" /> : <Building2 className="w-5 h-5 text-white" />}
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-white">
                {isEdit ? "Edit Department" : "Add New Department"}
              </DialogTitle>
              <DialogDescription className="text-blue-200 text-xs mt-0.5">
                {isEdit ? "Update department information" : "Create a new academic department"}
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 space-y-4">
            
            <div className="space-y-1">
              <Label className="text-slate-700 font-semibold text-xs">
                Department Name <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  value={form.name}
                  onChange={set("name")}
                  placeholder="e.g. College of Engineering"
                  required
                  className="pl-9 border-slate-200 focus:border-[#1e4db7] bg-white h-10"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-slate-700 font-semibold text-xs">
                Department Code <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  value={form.code}
                  onChange={set("code")}
                  placeholder="e.g. COE"
                  required
                  className="pl-9 border-slate-200 focus:border-[#1e4db7] bg-white h-10 uppercase"
                  maxLength={50}
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Unique code for identification</p>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 rounded-b-2xl flex items-center justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}
              className="border-slate-200 text-slate-600 hover:bg-slate-100 h-9">
              Cancel
            </Button>
            <Button type="submit" disabled={saving}
              className="bg-[#0f2d5e] hover:bg-[#1e4db7] text-white min-w-[120px] h-9">
              {saving
                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</>
                : <><CheckCircle2 className="mr-2 h-4 w-4" />{isEdit ? "Update" : "Create"}</>
              }
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Delete Confirmation ────────────────────────────────────────────────────
function DeleteDialog({ open, onClose, onConfirm, department }) {
  const canDelete = department && department.students_count === 0 && department.organizations_count === 0;

  return (
    <AlertDialog open={open} onOpenChange={v => !v && onClose()}>
      <AlertDialogContent className="rounded-2xl border-0 shadow-2xl max-w-sm">
        <AlertDialogHeader>
          <div className="flex justify-center mb-3">
            <div className={`w-14 h-14 rounded-2xl ${canDelete ? 'bg-red-50 ring-8 ring-red-50/50' : 'bg-amber-50 ring-8 ring-amber-50/50'} flex items-center justify-center`}>
              <AlertTriangle className={`w-7 h-7 ${canDelete ? 'text-red-500' : 'text-amber-500'}`} />
            </div>
          </div>
          <AlertDialogTitle className="text-center text-slate-900">
            {canDelete ? "Delete this department?" : "Cannot Delete Department"}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center text-slate-500 text-sm">
            {canDelete ? (
              <>
                This will permanently delete <strong className="text-slate-700">{department?.name}</strong>. This action cannot be undone.
              </>
            ) : (
              <>
                <strong className="text-slate-700">{department?.name}</strong> has{' '}
                <strong className="text-amber-600">{department?.students_count || 0} student(s)</strong> and{' '}
                <strong className="text-amber-600">{department?.organizations_count || 0} organization(s)</strong>. 
                Remove all associations before deleting.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex gap-2 mt-1">
          <AlertDialogCancel className="flex-1 rounded-xl border-slate-200">
            {canDelete ? "Cancel" : "Close"}
          </AlertDialogCancel>
          {canDelete && (
            <AlertDialogAction onClick={onConfirm}
              className="flex-1 rounded-xl bg-red-600 hover:bg-red-700 text-white">
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function DepartmentManagement() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editDept, setEditDept] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/departments", authH());
      setDepartments(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Error", {
        description: "Failed to load departments. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDepartments(); }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await axios.delete(`/api/departments/${deleteTarget.id}`, authH());
      toast.success("Department Deleted", {
        description: "The department has been removed successfully.",
      });
      setDeleteTarget(null);
      fetchDepartments();
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.message || "Failed to delete department.";
      toast.error("Error", {
        description: errorMsg,
      });
    }
  };

  const total = departments.length;
  const totalStudents = departments.reduce((sum, d) => sum + (d.students_count || 0), 0);
  const totalOrgs = departments.reduce((sum, d) => sum + (d.organizations_count || 0), 0);

  const filtered = departments.filter(d => {
    const q = search.toLowerCase();
    return !search
      || d.name?.toLowerCase().includes(q)
      || d.code?.toLowerCase().includes(q);
  });

  return (
    <TooltipProvider>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#0f2d5e] to-[#1e4db7] flex items-center justify-center shadow-lg shadow-[#0f2d5e]/25">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-[#0f2d5e] tracking-tight">Department Management</h1>
              <p className="text-slate-500 text-xs mt-0.5">Manage academic departments and their associations</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={fetchDepartments} disabled={loading}
                  className="border-[#0f2d5e]/20 text-[#0f2d5e] hover:bg-[#0f2d5e]/5 h-9 w-9 rounded-xl bg-white shadow-sm">
                  <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Refresh</TooltipContent>
            </Tooltip>
            <Button onClick={() => { setEditDept(null); setFormOpen(true); }}
              className="bg-gradient-to-r from-[#0f2d5e] to-[#1e4db7] hover:opacity-90 text-white shadow-md shadow-[#0f2d5e]/25 rounded-xl h-9 px-4 font-semibold text-sm">
              <Plus className="mr-2 h-4 w-4" /> Add Department
            </Button>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard icon={Building2} label="Total Departments" value={total} sub="Active departments" grad="from-[#0f2d5e] to-[#1a4a8a]" />
          <StatCard icon={Users} label="Total Students" value={totalStudents} sub="Across all departments" grad="from-[#1e4db7] to-[#3b6fd4]" />
          <StatCard icon={Briefcase} label="Organizations" value={totalOrgs} sub="Department organizations" grad="from-[#2563eb] to-[#5b9ef7]" />
        </div>

        {/* Table card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">

          {/* Toolbar */}
          <div className="px-5 py-3.5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search departments..."
                className="pl-9 pr-8 h-8 border-slate-200 bg-slate-50 focus:bg-white focus:border-[#1e4db7] text-sm rounded-xl" />
              {search && (
                <button onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <TrendingUp className="w-3.5 h-3.5" />
              <span><strong className="text-slate-600">{filtered.length}</strong> result{filtered.length !== 1 ? "s" : ""}</span>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Department</th>
                  <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Code</th>
                  <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Students</th>
                  <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Organizations</th>
                  <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="py-24 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-[#0f2d5e]/5 flex items-center justify-center">
                          <Loader2 className="w-6 h-6 animate-spin text-[#1e4db7]" />
                        </div>
                        <span className="text-sm text-slate-400 font-medium">Loading departments…</span>
                      </div>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-24 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
                          <Building2 className="w-7 h-7 text-slate-300" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-500 text-sm">No departments found</p>
                          <p className="text-xs text-slate-400 mt-0.5">Try adjusting your search or create a new department</p>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => setSearch("")}
                          className="rounded-xl border-slate-200 text-slate-600 text-xs h-8">
                          Clear search
                        </Button>
                      </div>
                    </td>
                  </tr>
                ) : filtered.map(dept => (
                  <tr key={dept.id} className="hover:bg-blue-50/30 transition-colors group">
                    
                    {/* Department */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0f2d5e] to-[#1e4db7] flex items-center justify-center shrink-0 shadow-sm">
                          <Building2 className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 text-sm">{dept.name}</p>
                          <p className="text-xs text-slate-400 mt-0.5">Department ID: {dept.id}</p>
                        </div>
                      </div>
                    </td>

                    {/* Code */}
                    <td className="px-5 py-4">
                      <Badge className="bg-blue-50 text-blue-700 border border-blue-200 font-mono text-xs px-2.5 py-1">
                        {dept.code}
                      </Badge>
                    </td>

                    {/* Students */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-slate-600 font-medium">{dept.students_count || 0}</span>
                      </div>
                    </td>

                    {/* Organizations */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-slate-600 font-medium">{dept.organizations_count || 0}</span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon"
                            className="h-8 w-8 rounded-lg text-slate-400 hover:text-[#0f2d5e] hover:bg-[#0f2d5e]/5 opacity-0 group-hover:opacity-100 transition-all">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40 rounded-xl border-slate-100 shadow-lg p-1">
                          <DropdownMenuItem onClick={() => { setEditDept(dept); setFormOpen(true); }}
                            className="rounded-lg text-slate-700 focus:bg-blue-50 focus:text-[#0f2d5e] gap-2 cursor-pointer text-sm">
                            <Pencil className="w-3.5 h-3.5" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-slate-100 my-1" />
                          <DropdownMenuItem onClick={() => setDeleteTarget(dept)}
                            className="rounded-lg text-red-600 focus:bg-red-50 focus:text-red-600 gap-2 cursor-pointer text-sm">
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-400">
            <span>
              Showing <strong className="text-slate-600">{filtered.length}</strong> of <strong className="text-slate-600">{total}</strong> departments
              {search && ` · "${search}"`}
            </span>
            <span>
              <strong className="text-slate-600">{totalStudents}</strong> total students · <strong className="text-slate-600">{totalOrgs}</strong> organizations
            </span>
          </div>
        </div>
      </div>

      {/* Modals */}
      <DepartmentFormModal
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditDept(null); }}
        onSaved={fetchDepartments}
        editDept={editDept}
      />
      <DeleteDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        department={deleteTarget}
      />
    </TooltipProvider>
  );
}