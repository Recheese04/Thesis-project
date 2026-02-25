import { useEffect, useState } from "react";
import axios from "axios";
import {
  UserPlus, Loader2, Trash2, Mail,
  UserCircle, GraduationCap, Search, X,
  Pencil, Users, Shield, Star,
  RefreshCw, Building2, AlertTriangle,
  ChevronRight, Activity, MoreHorizontal, BookOpen, Filter
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import UserFormModal from "../../modals/UserFormModal";
const authH = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });

const ROLE_META = {
  "1": { label: "Admin",   icon: Shield,       badge: "bg-[#0f2d5e] text-white border-[#0f2d5e]",  grad: "from-[#0f2d5e] to-[#1a4a8a]" },
  "2": { label: "Officer", icon: Star,          badge: "bg-[#1e4db7] text-white border-[#1e4db7]",  grad: "from-[#1e4db7] to-[#3b6fd4]" },
  "3": { label: "Student", icon: GraduationCap, badge: "bg-blue-50 text-blue-700 border-blue-200",  grad: "from-[#2563eb] to-[#5b9ef7]" },
};

const getInitials = (u) =>
  u?.student
    ? `${u.student.first_name?.[0] ?? ""}${u.student.last_name?.[0] ?? ""}`.toUpperCase()
    : u?.email?.[0]?.toUpperCase() ?? "?";

const getFullName = (u) =>
  u?.student ? `${u.student.first_name} ${u.student.last_name}` : "System Admin";

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

// ── Delete Dialog ──────────────────────────────────────────────────────────
function DeleteDialog({ open, onClose, onConfirm, userName }) {
  return (
    <AlertDialog open={open} onOpenChange={v => !v && onClose()}>
      <AlertDialogContent className="rounded-2xl border-0 shadow-2xl max-w-sm">
        <AlertDialogHeader>
          <div className="flex justify-center mb-3">
            <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center ring-8 ring-red-50/50">
              <AlertTriangle className="w-7 h-7 text-red-500" />
            </div>
          </div>
          <AlertDialogTitle className="text-center text-slate-900">Remove this account?</AlertDialogTitle>
          <AlertDialogDescription className="text-center text-slate-500 text-sm">
            This will permanently delete <strong className="text-slate-700">{userName}</strong>'s
            account and revoke all system access. This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex gap-2 mt-1">
          <AlertDialogCancel className="flex-1 rounded-xl border-slate-200">Keep Account</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}
            className="flex-1 rounded-xl bg-red-600 hover:bg-red-700 text-white">
            <Trash2 className="mr-2 h-4 w-4" /> Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function UserManagement() {
  const [users, setUsers]                 = useState([]);
  const [departments, setDepartments]     = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [search, setSearch]               = useState("");
  const [filterRole, setFilterRole]       = useState("all");
  const [filterYear, setFilterYear]       = useState("all");
  const [filterDept, setFilterDept]       = useState("all");
  const [filterCourse, setFilterCourse]   = useState("all");
  const [filterOrg, setFilterOrg]         = useState("all");
  const [showFilters, setShowFilters]     = useState(false);
  const [formOpen, setFormOpen]           = useState(false);
  const [editUser, setEditUser]           = useState(null);
  const [deleteTarget, setDeleteTarget]   = useState(null);

  useEffect(() => {
    Promise.all([
      axios.get("/api/departments", authH()),
      axios.get("/api/organizations", authH()),
    ])
      .then(([deptRes, orgRes]) => {
        setDepartments(deptRes.data);
        setOrganizations(orgRes.data);
      })
      .catch(() => toast.error("Could not load departments/organizations."));
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/users", authH());
      setUsers(res.data);
    } catch {
      toast.error("Error", { description: "Failed to load users. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await axios.delete(`/api/users/${deleteTarget.id}`, authH());
      toast.success("Account Deleted", { description: "The account has been removed successfully." });
      setDeleteTarget(null);
      fetchUsers();
    } catch {
      toast.error("Error", { description: "Failed to delete account. Please try again." });
    }
  };

  const total    = users.length;
  const active   = users.filter(u => u.is_active).length;
  const admins   = users.filter(u => String(u.user_type_id) === "1").length;
  const officers = users.filter(u => String(u.user_type_id) === "2").length;
  const students = users.filter(u => String(u.user_type_id) === "3").length;

  const filtered = users.filter(u => {
    const q           = search.toLowerCase();
    const matchSearch = !search
      || getFullName(u).toLowerCase().includes(q)
      || u.email?.toLowerCase().includes(q)
      || u.student?.student_number?.toLowerCase().includes(q);
    const matchRole   = filterRole === "all" || String(u.user_type_id) === filterRole;
    const matchYear   = filterYear === "all" || u.student?.year_level === filterYear;
    const matchDept   = filterDept === "all" || String(u.student?.department_id) === filterDept;
    const matchCourse = filterCourse === "all" || u.student?.course === filterCourse;
    const matchOrg    = filterOrg === "all"
      || (u.all_memberships ?? []).some(m => String(m.organization_id) === filterOrg);
    return matchSearch && matchRole && matchYear && matchDept && matchCourse && matchOrg;
  });

  const availableYears     = [...new Set(users.map(u => u.student?.year_level).filter(Boolean))].sort();
  const availableCourses   = [...new Set(users.map(u => u.student?.course).filter(Boolean))].sort();
  const activeFiltersCount = [filterYear, filterDept, filterCourse, filterOrg].filter(f => f !== "all").length;

  return (
    <TooltipProvider>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#0f2d5e] to-[#1e4db7] flex items-center justify-center shadow-lg shadow-[#0f2d5e]/25">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-[#0f2d5e] tracking-tight">User Management</h1>
              <p className="text-slate-500 text-xs mt-0.5">Manage system accounts, roles &amp; student profiles</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={fetchUsers} disabled={loading}
                  className="border-[#0f2d5e]/20 text-[#0f2d5e] hover:bg-[#0f2d5e]/5 h-9 w-9 rounded-xl bg-white shadow-sm">
                  <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Refresh</TooltipContent>
            </Tooltip>
            <Button onClick={() => { setEditUser(null); setFormOpen(true); }}
              className="bg-gradient-to-r from-[#0f2d5e] to-[#1e4db7] hover:opacity-90 text-white shadow-md shadow-[#0f2d5e]/25 rounded-xl h-9 px-4 font-semibold text-sm">
              <UserPlus className="mr-2 h-4 w-4" /> Add User
            </Button>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard icon={Users}         label="Total Accounts" value={total}    sub={`${active} active`} grad="from-[#0f2d5e] to-[#1a4a8a]" />
          <StatCard icon={Shield}        label="Admins"         value={admins}   sub="Full access"        grad="from-[#1a3568] to-[#2d5ca8]" />
          <StatCard icon={Star}          label="Officers"       value={officers} sub="Org managers"       grad="from-[#1e4db7] to-[#3b6fd4]" />
          <StatCard icon={GraduationCap} label="Students"       value={students} sub="Enrolled accounts"  grad="from-[#2563eb] to-[#5b9ef7]" />
        </div>

        {/* Table card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">

          {/* Toolbar */}
          <div className="px-5 py-3.5 border-b border-slate-100 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Name, email, student no…"
                    className="pl-9 pr-8 h-8 border-slate-200 bg-slate-50 focus:bg-white focus:border-[#1e4db7] text-sm rounded-xl" />
                  {search && (
                    <button onClick={() => setSearch("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <Select value={filterRole} onValueChange={setFilterRole}>
                  <SelectTrigger className="w-32 h-8 border-slate-200 bg-slate-50 text-sm rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="1">Admin</SelectItem>
                    <SelectItem value="2">Officer</SelectItem>
                    <SelectItem value="3">Student</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}
                  className={`h-8 border-slate-200 text-slate-600 hover:bg-slate-100 ${activeFiltersCount > 0 ? "border-[#1e4db7] text-[#1e4db7] bg-blue-50" : ""}`}>
                  <Filter className="w-3.5 h-3.5 mr-1.5" />
                  Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
                </Button>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Activity className="w-3.5 h-3.5" />
                <span><strong className="text-slate-600">{filtered.length}</strong> result{filtered.length !== 1 ? "s" : ""}</span>
              </div>
            </div>

            {showFilters && (
              <div className="grid grid-cols-4 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="space-y-1.5">
                  <Label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide flex items-center gap-1">
                    <GraduationCap className="w-3 h-3" />Year Level
                  </Label>
                  <Select value={filterYear} onValueChange={setFilterYear}>
                    <SelectTrigger className="h-8 text-xs border-slate-200 bg-white"><SelectValue /></SelectTrigger>
                    <SelectContent className="rounded-lg">
                      <SelectItem value="all" className="text-xs">All Years</SelectItem>
                      {availableYears.map(y => <SelectItem key={y} value={y} className="text-xs">{y}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide flex items-center gap-1">
                    <Building2 className="w-3 h-3" />Department
                  </Label>
                  <Select value={filterDept} onValueChange={setFilterDept}>
                    <SelectTrigger className="h-8 text-xs border-slate-200 bg-white"><SelectValue /></SelectTrigger>
                    <SelectContent className="rounded-lg max-h-52">
                      <SelectItem value="all" className="text-xs">All Departments</SelectItem>
                      {departments.map(d => <SelectItem key={d.id} value={String(d.id)} className="text-xs">{d.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide flex items-center gap-1">
                    <BookOpen className="w-3 h-3" />Course
                  </Label>
                  <Select value={filterCourse} onValueChange={setFilterCourse}>
                    <SelectTrigger className="h-8 text-xs border-slate-200 bg-white"><SelectValue /></SelectTrigger>
                    <SelectContent className="rounded-lg max-h-52">
                      <SelectItem value="all" className="text-xs">All Courses</SelectItem>
                      {availableCourses.map(c => <SelectItem key={c} value={c} className="text-xs truncate">{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide flex items-center gap-1">
                    <Users className="w-3 h-3" />Organization
                  </Label>
                  <Select value={filterOrg} onValueChange={setFilterOrg}>
                    <SelectTrigger className="h-8 text-xs border-slate-200 bg-white"><SelectValue /></SelectTrigger>
                    <SelectContent className="rounded-lg max-h-52">
                      <SelectItem value="all" className="text-xs">All Organizations</SelectItem>
                      {organizations.map(o => <SelectItem key={o.id} value={String(o.id)} className="text-xs">{o.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                {activeFiltersCount > 0 && (
                  <div className="col-span-4">
                    <Button variant="outline" size="sm"
                      onClick={() => { setFilterYear("all"); setFilterDept("all"); setFilterCourse("all"); setFilterOrg("all"); }}
                      className="w-full h-7 text-xs border-slate-200 text-slate-600 hover:bg-slate-100">
                      <X className="w-3 h-3 mr-1.5" />Clear all filters
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  {["User", "Student No.", "Department", "Course", "Role", "Year", "Status", ""].map(h => (
                    <th key={h} className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 whitespace-nowrap">{h}</th>
                  ))}
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
                        <span className="text-sm text-slate-400 font-medium">Loading accounts…</span>
                      </div>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-24 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
                          <UserCircle className="w-7 h-7 text-slate-300" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-500 text-sm">No accounts found</p>
                          <p className="text-xs text-slate-400 mt-0.5">Try adjusting your search or filters</p>
                        </div>
                        <Button variant="outline" size="sm"
                          onClick={() => { setSearch(""); setFilterRole("all"); setFilterYear("all"); setFilterDept("all"); setFilterCourse("all"); setFilterOrg("all"); }}
                          className="rounded-xl border-slate-200 text-slate-600 text-xs h-8">
                          Clear filters
                        </Button>
                      </div>
                    </td>
                  </tr>
                ) : filtered.map(user => {
                  const rk             = String(user.user_type_id);
                  const meta           = ROLE_META[rk];
                  const Ico            = meta?.icon ?? UserCircle;
                  const deptName       = user.student?.department?.name ?? departments.find(d => d.id === user.student?.department_id)?.name ?? null;
                  const allMemberships = user.all_memberships ?? [];

                  return (
                    <tr key={user.id} className="hover:bg-blue-50/30 transition-colors group">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="relative shrink-0">
                            <Avatar className="w-9 h-9 ring-2 ring-white shadow-sm">
                              <AvatarFallback className="bg-gradient-to-br from-[#0f2d5e] to-[#1e4db7] text-white text-xs font-bold">
                                {getInitials(user)}
                              </AvatarFallback>
                            </Avatar>
                            <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${user.is_active ? "bg-emerald-400" : "bg-slate-300"}`} />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-800 text-sm truncate">{getFullName(user)}</p>
                            <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5 truncate">
                              <Mail className="w-3 h-3 shrink-0" />{user.email}
                            </p>
                            {allMemberships.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {allMemberships.map((m, i) => (
                                  <span key={i} className="inline-flex items-center gap-0.5 bg-blue-50 text-blue-600 border border-blue-200 text-[10px] font-medium px-1.5 py-0.5 rounded-full">
                                    <Users className="w-2.5 h-2.5" />
                                    {m.organization?.name ?? "—"}
                                    {rk === "2" && <span className="text-slate-400 capitalize"> · {m.role}</span>}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-sm font-mono text-slate-500">
                          {user.student?.student_number ?? <span className="text-slate-300 text-xs">—</span>}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 max-w-[120px]">
                        {deptName
                          ? <div className="flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" /><span className="text-sm text-slate-600 truncate">{deptName}</span></div>
                          : <span className="text-slate-300 text-xs">—</span>}
                      </td>
                      <td className="px-5 py-3.5 max-w-[160px]">
                        {user.student?.course
                          ? <div className="flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5 text-slate-400 shrink-0" /><span className="text-sm text-slate-600 truncate" title={user.student.course}>{user.student.course}</span></div>
                          : <span className="text-slate-300 text-xs">—</span>}
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge className={`${meta?.badge ?? "bg-slate-100 text-slate-600 border-slate-200"} border flex items-center gap-1 w-fit text-xs font-semibold px-2.5 py-0.5 rounded-full`}>
                          <Ico className="w-3 h-3" />{user.user_type?.name ?? "Unassigned"}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-slate-500 whitespace-nowrap">
                        {user.student?.year_level
                          ? <div className="flex items-center gap-1.5"><GraduationCap className="w-3.5 h-3.5 text-slate-400 shrink-0" />{user.student.year_level}</div>
                          : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${user.is_active ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-500 border-slate-200"}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${user.is_active ? "bg-emerald-500" : "bg-slate-400"}`} />
                          {user.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon"
                              className="h-8 w-8 rounded-lg text-slate-400 hover:text-[#0f2d5e] hover:bg-[#0f2d5e]/5 opacity-0 group-hover:opacity-100 transition-all">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40 rounded-xl border-slate-100 shadow-lg p-1">
                            <DropdownMenuItem onClick={() => { setEditUser(user); setFormOpen(true); }}
                              className="rounded-lg text-slate-700 focus:bg-blue-50 focus:text-[#0f2d5e] gap-2 cursor-pointer text-sm">
                              <Pencil className="w-3.5 h-3.5" /> Edit Account
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-slate-100 my-1" />
                            <DropdownMenuItem onClick={() => setDeleteTarget(user)}
                              className="rounded-lg text-red-600 focus:bg-red-50 focus:text-red-600 gap-2 cursor-pointer text-sm">
                              <Trash2 className="w-3.5 h-3.5" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-400">
            <span>
              Showing <strong className="text-slate-600">{filtered.length}</strong> of{" "}
              <strong className="text-slate-600">{total}</strong> accounts
              {(filterRole !== "all" || activeFiltersCount > 0) && " (filtered)"}
              {search && ` · "${search}"`}
            </span>
            <span>
              <strong className="text-slate-600">{active}</strong> active ·{" "}
              <strong className="text-slate-600">{total - active}</strong> inactive
            </span>
          </div>
        </div>
      </div>

      <UserFormModal
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditUser(null); }}
        onSaved={fetchUsers}
        editUser={editUser}
        departments={departments}
        organizations={organizations}
      />
      <DeleteDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        userName={getFullName(deleteTarget)}
      />
    </TooltipProvider>
  );
}