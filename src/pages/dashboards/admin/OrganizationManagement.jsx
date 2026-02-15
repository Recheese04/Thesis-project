import { useEffect, useState } from "react";
import axios from "axios";
import {
  Briefcase, Plus, Loader2, Trash2, Pencil, Search, X,
  RefreshCw, MoreHorizontal, Users, Calendar, AlertTriangle,
  CheckCircle2, TrendingUp, Building2, Activity, MapPin, Globe
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
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";

// ── Helpers ────────────────────────────────────────────────────────────────
const authH = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });

const EMPTY_FORM = {
  department_id: "",
  name: "",
  type: "academic",
  scope: "department",
  location: "",
  description: "",
  status: "active",
};

const TYPE_COLORS = {
  academic: "bg-blue-50 text-blue-700 border-blue-200",
  "non-academic": "bg-purple-50 text-purple-700 border-purple-200",
};

const SCOPE_COLORS = {
  department: "bg-emerald-50 text-emerald-700 border-emerald-200",
  location: "bg-amber-50 text-amber-700 border-amber-200",
  independent: "bg-indigo-50 text-indigo-700 border-indigo-200",
};

const STATUS_COLORS = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  inactive: "bg-slate-100 text-slate-500 border-slate-200",
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

// ── Organization Form Modal ────────────────────────────────────────────────
function OrganizationFormModal({ open, onClose, onSaved, editOrg, departments }) {
  const isEdit = Boolean(editOrg);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(editOrg ? {
      department_id: String(editOrg.department_id ?? ""),
      name: editOrg.name ?? "",
      type: editOrg.type ?? "academic",
      scope: editOrg.scope ?? "department",
      location: editOrg.location ?? "",
      description: editOrg.description ?? "",
      status: editOrg.status ?? "active",
    } : EMPTY_FORM);
  }, [open, editOrg]);

  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e?.target?.value ?? e }));

  const handleScopeChange = (newScope) => {
    setForm(p => ({
      ...p,
      scope: newScope,
      department_id: newScope === "department" ? p.department_id : "",
      location: newScope === "location" ? p.location : "",
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Build submit data - only include what backend expects
    const submitData = {
      name: form.name,
      type: form.type,
      description: form.description,
      status: form.status,
    };

    // Handle department_id based on scope
    if (form.scope === "department") {
      if (!form.department_id) {
        toast.error("Validation Error", {
          description: "Please select a department",
        });
        return;
      }
      submitData.department_id = form.department_id;
    } else {
      // For non-department orgs, send empty string or don't send at all
      // This makes it optional in the backend
      submitData.department_id = "";
    }

    // Add scope and location (backend will ignore if not supported)
    submitData.scope = form.scope;
    if (form.scope === "location") {
      if (!form.location) {
        toast.error("Validation Error", {
          description: "Please enter a location",
        });
        return;
      }
      submitData.location = form.location;
    }
    
    setSaving(true);
    try {
      const response = isEdit
        ? await axios.put(`/api/organizations/${editOrg.id}`, submitData, authH())
        : await axios.post("/api/organizations", submitData, authH());
      
      toast.success(isEdit ? "Organization Updated!" : "Organization Created!", {
        description: response.data.message,
      });
      
      onSaved();
      onClose();
    } catch (err) {
      console.error("API Error:", err.response?.data);
      const errs = err.response?.data?.errors;
      const errorMessage = errs ? Object.values(errs).flat().join("\n") : err.response?.data?.message ?? "An error occurred.";
      
      toast.error("Error", {
        description: errorMessage,
      });
    } finally {
      setSaving(false);
    }
  };

  const requiresDepartment = form.scope === "department";
  const requiresLocation = form.scope === "location";

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="bg-white border-0 shadow-2xl sm:max-w-[580px] p-0 rounded-2xl gap-0 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="bg-gradient-to-br from-[#0f2d5e] via-[#153d80] to-[#1e4db7] px-6 py-5 rounded-t-2xl sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              {isEdit ? <Pencil className="w-5 h-5 text-white" /> : <Briefcase className="w-5 h-5 text-white" />}
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-white">
                {isEdit ? "Edit Organization" : "Add New Organization"}
              </DialogTitle>
              <DialogDescription className="text-blue-200 text-xs mt-0.5">
                {isEdit ? "Update organization information" : "Create a new student organization"}
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 space-y-4">
            
            <div className="space-y-1">
              <Label className="text-slate-700 font-semibold text-xs">
                Organization Name <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  value={form.name}
                  onChange={set("name")}
                  placeholder="e.g. Computer Science Society"
                  required
                  className="pl-9 border-slate-200 focus:border-[#1e4db7] bg-white h-10"
                />
              </div>
            </div>

            {/* Scope Selection */}
            <div className="space-y-1">
              <Label className="text-slate-700 font-semibold text-xs">
                Organization Scope <span className="text-red-500">*</span>
              </Label>
              <Select value={form.scope} onValueChange={handleScopeChange} required>
                <SelectTrigger className="border-slate-200 bg-white h-10 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="department">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                      <div>
                        <div className="font-medium">Department-Based</div>
                        <div className="text-xs text-slate-500">Under a specific department</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="location">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-amber-600" />
                      <div>
                        <div className="font-medium">Location-Based</div>
                        <div className="text-xs text-slate-500">Based on town/barangay (e.g., Mabini, Candijay)</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="independent">
                    <div className="flex items-center gap-2">
                      <Globe className="w-3.5 h-3.5 text-indigo-600" />
                      <div>
                        <div className="font-medium">Independent</div>
                        <div className="text-xs text-slate-500">Not tied to department or location</div>
                      </div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Department - only show if scope is department */}
            {requiresDepartment && (
              <div className="space-y-1">
                <Label className="text-slate-700 font-semibold text-xs">
                  Department <span className="text-red-500">*</span>
                </Label>
                <Select value={form.department_id} onValueChange={set("department_id")} required>
                  <SelectTrigger className="border-slate-200 bg-white h-10 text-sm">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {departments.map(dept => (
                      <SelectItem key={dept.id} value={String(dept.id)}>
                        <div className="flex items-center gap-2">
                          <Building2 className="w-3.5 h-3.5 text-slate-500" />
                          {dept.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Location - only show if scope is location */}
            {requiresLocation && (
              <div className="space-y-1">
                <Label className="text-slate-700 font-semibold text-xs">
                  Location <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    value={form.location}
                    onChange={set("location")}
                    placeholder="e.g. Mabini, Candijay, Garcia Hernandez"
                    required
                    className="pl-9 border-slate-200 focus:border-[#1e4db7] bg-white h-10"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">Enter the town, barangay, or area name</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-slate-700 font-semibold text-xs">
                  Type <span className="text-red-500">*</span>
                </Label>
                <Select value={form.type} onValueChange={set("type")} required>
                  <SelectTrigger className="border-slate-200 bg-white h-10 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="academic">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                        Academic
                      </div>
                    </SelectItem>
                    <SelectItem value="non-academic">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0" />
                        Non-Academic
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-slate-700 font-semibold text-xs">Status</Label>
                <Select value={form.status} onValueChange={set("status")}>
                  <SelectTrigger className="border-slate-200 bg-white h-10 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="active">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                        Active
                      </div>
                    </SelectItem>
                    <SelectItem value="inactive">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" />
                        Inactive
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-slate-700 font-semibold text-xs">Description</Label>
              <Textarea
                value={form.description}
                onChange={set("description")}
                placeholder="Brief description of the organization..."
                rows={4}
                className="border-slate-200 focus:border-[#1e4db7] bg-white resize-none"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 rounded-b-2xl flex items-center justify-end gap-3 sticky bottom-0">
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
function DeleteDialog({ open, onClose, onConfirm, organization }) {
  const canDelete = organization && organization.members_count === 0 && organization.events_count === 0;

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
            {canDelete ? "Delete this organization?" : "Cannot Delete Organization"}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center text-slate-500 text-sm">
            {canDelete ? (
              <>
                This will permanently delete <strong className="text-slate-700">{organization?.name}</strong>. This action cannot be undone.
              </>
            ) : (
              <>
                <strong className="text-slate-700">{organization?.name}</strong> has{' '}
                <strong className="text-amber-600">{organization?.members_count || 0} member(s)</strong> and{' '}
                <strong className="text-amber-600">{organization?.events_count || 0} event(s)</strong>. 
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
export default function OrganizationManagement() {
  const [organizations, setOrganizations] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterScope, setFilterScope] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editOrg, setEditOrg] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [orgsRes, deptsRes] = await Promise.all([
        axios.get("/api/organizations", authH()),
        axios.get("/api/departments", authH()),
      ]);
      setOrganizations(orgsRes.data);
      setDepartments(deptsRes.data);
    } catch (err) {
      console.error(err);
      toast.error("Error", {
        description: "Failed to load data. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await axios.delete(`/api/organizations/${deleteTarget.id}`, authH());
      toast.success("Organization Deleted", {
        description: "The organization has been removed successfully.",
      });
      setDeleteTarget(null);
      fetchData();
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.message || "Failed to delete organization.";
      toast.error("Error", {
        description: errorMsg,
      });
    }
  };

  const total = organizations.length;
  const active = organizations.filter(o => o.status === 'active').length;
  const academic = organizations.filter(o => o.type === 'academic').length;
  const nonAcademic = organizations.filter(o => o.type === 'non-academic').length;
  const departmentBased = organizations.filter(o => (o.scope === 'department' || !o.scope)).length;
  const locationBased = organizations.filter(o => o.scope === 'location').length;
  const independent = organizations.filter(o => o.scope === 'independent').length;
  const totalMembers = organizations.reduce((sum, o) => sum + (o.members_count || 0), 0);
  const totalEvents = organizations.reduce((sum, o) => sum + (o.events_count || 0), 0);

  const filtered = organizations.filter(o => {
    const q = search.toLowerCase();
    const orgScope = o.scope || 'department'; // default to department for backward compatibility
    const matchSearch = !search
      || o.name?.toLowerCase().includes(q)
      || o.department?.name?.toLowerCase().includes(q)
      || o.location?.toLowerCase().includes(q);
    const matchType = filterType === "all" || o.type === filterType;
    const matchScope = filterScope === "all" || orgScope === filterScope;
    const matchStatus = filterStatus === "all" || o.status === filterStatus;
    return matchSearch && matchType && matchScope && matchStatus;
  });

  return (
    <TooltipProvider>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#0f2d5e] to-[#1e4db7] flex items-center justify-center shadow-lg shadow-[#0f2d5e]/25">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-[#0f2d5e] tracking-tight">Organization Management</h1>
              <p className="text-slate-500 text-xs mt-0.5">Manage student organizations and their details</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={fetchData} disabled={loading}
                  className="border-[#0f2d5e]/20 text-[#0f2d5e] hover:bg-[#0f2d5e]/5 h-9 w-9 rounded-xl bg-white shadow-sm">
                  <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Refresh</TooltipContent>
            </Tooltip>
            <Button onClick={() => { setEditOrg(null); setFormOpen(true); }}
              className="bg-gradient-to-r from-[#0f2d5e] to-[#1e4db7] hover:opacity-90 text-white shadow-md shadow-[#0f2d5e]/25 rounded-xl h-9 px-4 font-semibold text-sm">
              <Plus className="mr-2 h-4 w-4" /> Add Organization
            </Button>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Briefcase} label="Total Organizations" value={total} sub={`${active} active`} grad="from-[#0f2d5e] to-[#1a4a8a]" />
          <StatCard icon={Activity} label="Academic" value={academic} sub={`${nonAcademic} non-academic`} grad="from-[#1e4db7] to-[#3b6fd4]" />
          <StatCard icon={Users} label="Total Members" value={totalMembers} sub="Across all orgs" grad="from-[#2563eb] to-[#5b9ef7]" />
          <StatCard icon={Calendar} label="Total Events" value={totalEvents} sub="Events organized" grad="from-[#7c3aed] to-[#a78bfa]" />
        </div>

        {/* Scope breakdown */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl p-4 border border-slate-200/60 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Department-Based</p>
                <p className="text-2xl font-bold text-slate-900">{departmentBased}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-slate-200/60 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Location-Based</p>
                <p className="text-2xl font-bold text-slate-900">{locationBased}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-slate-200/60 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center">
                <Globe className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Independent</p>
                <p className="text-2xl font-bold text-slate-900">{independent}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Table card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">

          {/* Toolbar */}
          <div className="px-5 py-3.5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search organizations..."
                  className="pl-9 pr-8 h-8 border-slate-200 bg-slate-50 focus:bg-white focus:border-[#1e4db7] text-sm rounded-xl" />
                {search && (
                  <button onClick={() => setSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-36 h-8 border-slate-200 bg-slate-50 text-sm rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="academic">Academic</SelectItem>
                  <SelectItem value="non-academic">Non-Academic</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterScope} onValueChange={setFilterScope}>
                <SelectTrigger className="w-36 h-8 border-slate-200 bg-slate-50 text-sm rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all">All Scopes</SelectItem>
                  <SelectItem value="department">Department</SelectItem>
                  <SelectItem value="location">Location</SelectItem>
                  <SelectItem value="independent">Independent</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-32 h-8 border-slate-200 bg-slate-50 text-sm rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
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
                  <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Organization</th>
                  <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Scope</th>
                  <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Department/Location</th>
                  <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Type</th>
                  <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Members</th>
                  <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Events</th>
                  <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Status</th>
                  <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="py-24 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-[#0f2d5e]/5 flex items-center justify-center">
                          <Loader2 className="w-6 h-6 animate-spin text-[#1e4db7]" />
                        </div>
                        <span className="text-sm text-slate-400 font-medium">Loading organizations…</span>
                      </div>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-24 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
                          <Briefcase className="w-7 h-7 text-slate-300" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-500 text-sm">No organizations found</p>
                          <p className="text-xs text-slate-400 mt-0.5">Try adjusting your search or create a new organization</p>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => { setSearch(""); setFilterType("all"); setFilterScope("all"); setFilterStatus("all"); }}
                          className="rounded-xl border-slate-200 text-slate-600 text-xs h-8">
                          Clear filters
                        </Button>
                      </div>
                    </td>
                  </tr>
                ) : filtered.map(org => {
                  const orgScope = org.scope || 'department'; // default for backward compatibility
                  return (
                  <tr key={org.id} className="hover:bg-blue-50/30 transition-colors group">
                    
                    {/* Organization */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0f2d5e] to-[#1e4db7] flex items-center justify-center shrink-0 shadow-sm">
                          <Briefcase className="w-5 h-5 text-white" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800 text-sm truncate">{org.name}</p>
                          <p className="text-xs text-slate-400 mt-0.5 truncate">{org.description || "No description"}</p>
                        </div>
                      </div>
                    </td>

                    {/* Scope */}
                    <td className="px-5 py-4">
                      <Badge className={`${SCOPE_COLORS[orgScope]} border text-xs font-semibold px-2.5 py-1 capitalize`}>
                        {orgScope === 'department' && <Building2 className="w-3 h-3 mr-1" />}
                        {orgScope === 'location' && <MapPin className="w-3 h-3 mr-1" />}
                        {orgScope === 'independent' && <Globe className="w-3 h-3 mr-1" />}
                        {orgScope}
                      </Badge>
                    </td>

                    {/* Department/Location */}
                    <td className="px-5 py-4">
                      {orgScope === 'department' && (
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                          <span className="text-sm text-slate-600">{org.department?.name || "—"}</span>
                        </div>
                      )}
                      {orgScope === 'location' && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                          <span className="text-sm text-slate-600">{org.location || "—"}</span>
                        </div>
                      )}
                      {orgScope === 'independent' && (
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4 text-slate-400 shrink-0" />
                          <span className="text-sm text-slate-400 italic">N/A</span>
                        </div>
                      )}
                    </td>

                    {/* Type */}
                    <td className="px-5 py-4">
                      <Badge className={`${TYPE_COLORS[org.type]} border text-xs font-semibold px-2.5 py-1 capitalize`}>
                        {org.type}
                      </Badge>
                    </td>

                    {/* Members */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-slate-600 font-medium">{org.members_count || 0}</span>
                      </div>
                    </td>

                    {/* Events */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-slate-600 font-medium">{org.events_count || 0}</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      <Badge className={`${STATUS_COLORS[org.status]} border text-xs font-semibold px-2.5 py-1 capitalize`}>
                        {org.status}
                      </Badge>
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
                          <DropdownMenuItem onClick={() => { setEditOrg(org); setFormOpen(true); }}
                            className="rounded-lg text-slate-700 focus:bg-blue-50 focus:text-[#0f2d5e] gap-2 cursor-pointer text-sm">
                            <Pencil className="w-3.5 h-3.5" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-slate-100 my-1" />
                          <DropdownMenuItem onClick={() => setDeleteTarget(org)}
                            className="rounded-lg text-red-600 focus:bg-red-50 focus:text-red-600 gap-2 cursor-pointer text-sm">
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-400">
            <span>
              Showing <strong className="text-slate-600">{filtered.length}</strong> of <strong className="text-slate-600">{total}</strong> organizations
              {(filterType !== "all" || filterScope !== "all" || filterStatus !== "all" || search) && " (filtered)"}
            </span>
            <span>
              <strong className="text-slate-600">{departmentBased}</strong> dept · <strong className="text-slate-600">{locationBased}</strong> location · <strong className="text-slate-600">{independent}</strong> independent
            </span>
          </div>
        </div>
      </div>

      {/* Modals */}
      <OrganizationFormModal
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditOrg(null); }}
        onSaved={fetchData}
        editOrg={editOrg}
        departments={departments}
      />
      <DeleteDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        organization={deleteTarget}
      />
    </TooltipProvider>
  );
}