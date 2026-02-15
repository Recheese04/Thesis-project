import { useEffect, useState } from "react";
import axios from "axios";
import {
  UserPlus, Loader2, Trash2, Mail, ShieldCheck,
  UserCircle, Phone, GraduationCap, Search, X,
  Pencil, Users, Shield, Star, CheckCircle2,
  Eye, EyeOff, RefreshCw, Building2, AlertTriangle,
  Lock, ChevronRight, Activity, MoreHorizontal, BookOpen, Filter
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogTitle, DialogDescription,
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
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";

// ── Constants ──────────────────────────────────────────────────────────────
const YEAR_LEVELS = ["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year"];

const COURSES_BY_DEPARTMENT = {
  "1": [
    "Bachelor of Science in Computer Science",
    "Bachelor of Science in Environmental Science major in Coastal Resource Management"
  ],
  "2": [
    "Bachelor of Science in Fisheries",
    "Bachelor of Science in Marine Biology"
  ],
  "3": [
    "Bachelor of Elementary Education",
    "Bachelor of Secondary Education (BSEd)"
  ],
  "4": [
    "Bachelor of Science in Hospitality Management",
    "Bachelor of Science in Office Administration"
  ]
};

const ROLE_META = {
  "1": { label: "Admin",   icon: Shield, badge: "bg-[#0f2d5e] text-white border-[#0f2d5e]",  grad: "from-[#0f2d5e] to-[#1a4a8a]" },
  "2": { label: "Officer", icon: Star,   badge: "bg-[#1e4db7] text-white border-[#1e4db7]",  grad: "from-[#1e4db7] to-[#3b6fd4]" },
  "3": { label: "Member",  icon: Users,  badge: "bg-blue-50 text-blue-700 border-blue-200",  grad: "from-[#2563eb] to-[#5b9ef7]"  },
};

const EMPTY_FORM = {
  email: "", password: "", user_type_id: "", is_active: "1",
  student_number: "", first_name: "", middle_name: "",
  last_name: "", department_id: "", year_level: "", contact_number: "",
  course: "",
};

// ── Helpers ────────────────────────────────────────────────────────────────
const authH = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });

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

// ── Section label inside form ──────────────────────────────────────────────
function SLabel({ icon: Icon, text }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="w-6 h-6 rounded-md bg-[#0f2d5e]/10 flex items-center justify-center shrink-0">
        <Icon className="w-3.5 h-3.5 text-[#0f2d5e]" />
      </div>
      <span className="text-[11px] font-bold uppercase tracking-widest text-[#0f2d5e]/60">{text}</span>
      <div className="flex-1 h-px bg-slate-100" />
    </div>
  );
}

// ── Password field ─────────────────────────────────────────────────────────
function PwdInput({ value, onChange, required, hint }) {
  const [show, setShow] = useState(false);
  return (
    <>
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          type={show ? "text" : "password"}
          value={value}
          onChange={onChange}
          placeholder="••••••••"
          required={required}
          className="pl-9 pr-10 border-slate-200 focus:border-[#1e4db7] bg-white h-9"
        />
        <button type="button" tabIndex={-1}
          onClick={() => setShow(s => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {hint && <p className="text-[11px] text-slate-400 mt-1">{hint}</p>}
    </>
  );
}

// ── User Form Modal ────────────────────────────────────────────────────────
function UserFormModal({ open, onClose, onSaved, editUser, departments }) {
  const isEdit   = Boolean(editUser);
  const [form, setForm]     = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [step, setStep]     = useState(1);
  const isMember            = form.user_type_id === "3";

  useEffect(() => {
    if (!open) return;
    setStep(1);
    setForm(editUser ? {
      email:          editUser.email ?? "",
      password:       "",
      user_type_id:   String(editUser.user_type_id ?? ""),
      is_active:      editUser.is_active ? "1" : "0",
      student_number: editUser.student?.student_id ?? "",
      first_name:     editUser.student?.first_name ?? "",
      middle_name:    editUser.student?.middle_name ?? "",
      last_name:      editUser.student?.last_name ?? "",
      department_id:  String(editUser.student?.department_id ?? ""),
      year_level:     editUser.student?.year_level ?? "",
      contact_number: editUser.student?.contact_number ?? "",
      course:         editUser.student?.course ?? "",
    } : EMPTY_FORM);
  }, [open, editUser]);

  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e?.target?.value ?? e }));

  const resetRole = (val) =>
    setForm(p => ({ ...EMPTY_FORM, email: p.email, password: p.password, is_active: p.is_active, user_type_id: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = isEdit
        ? await axios.put(`/api/users/${editUser.id}`, form, authH())
        : await axios.post("/api/users", form, authH());
      toast.success(isEdit ? "Account Updated!" : "Account Created!", {
        description: response.data.message,
      });
      onSaved();
      onClose();
    } catch (err) {
      const errs = err.response?.data?.errors;
      toast.error("Error", {
        description: errs ? Object.values(errs).flat().join("\n") : err.response?.data?.message ?? "An error occurred.",
      });
    } finally {
      setSaving(false);
    }
  };

  const selectedDept = departments.find(d => String(d.id) === form.department_id);
  const availableCourses = COURSES_BY_DEPARTMENT[form.department_id] || [];

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="bg-white border-0 shadow-2xl sm:max-w-[520px] p-0 rounded-2xl gap-0 max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="bg-gradient-to-br from-[#0f2d5e] via-[#153d80] to-[#1e4db7] px-6 py-5 rounded-t-2xl sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              {isEdit ? <Pencil className="w-5 h-5 text-white" /> : <ShieldCheck className="w-5 h-5 text-white" />}
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-white">
                {isEdit ? "Edit Account" : "Create New Account"}
              </DialogTitle>
              <DialogDescription className="text-blue-200 text-xs mt-0.5">
                {isEdit ? "Update user details and permissions" : "Register a new system user"}
              </DialogDescription>
            </div>
          </div>

          {isMember && (
            <div className="flex items-center gap-2 mt-4">
              {[{ n: 1, label: "Account" }, { n: 2, label: "Student Profile" }].map(({ n, label }, i, arr) => (
                <div key={n} className="flex items-center gap-1.5">
                  <button type="button" onClick={() => setStep(n)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                      step === n ? "bg-white text-[#0f2d5e]" : "bg-white/15 text-white/70 hover:bg-white/25"
                    }`}>
                    <span className={`w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 ${
                      step === n ? "bg-[#0f2d5e] text-white" : "bg-white/25 text-white"
                    }`}>{n}</span>
                    {label}
                  </button>
                  {i < arr.length - 1 && <ChevronRight className="w-3 h-3 text-white/30" />}
                </div>
              ))}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 space-y-4">

            {step === 1 && (
              <>
                <SLabel icon={Mail} text="Credentials" />
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-slate-700 font-semibold text-xs">Email <span className="text-red-500">*</span></Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input type="email" value={form.email} onChange={set("email")} required
                        placeholder="user@organization.edu"
                        className="pl-9 border-slate-200 focus:border-[#1e4db7] bg-white h-9" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-slate-700 font-semibold text-xs">
                      Password {!isEdit && <span className="text-red-500">*</span>}
                    </Label>
                    <PwdInput value={form.password} onChange={set("password")} required={!isEdit}
                      hint={isEdit ? "Leave blank to keep current password" : null} />
                  </div>
                </div>

                <SLabel icon={Shield} text="Access Control" />
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-slate-700 font-semibold text-xs">Role <span className="text-red-500">*</span></Label>
                    <Select value={form.user_type_id} onValueChange={resetRole} required>
                      <SelectTrigger className="border-slate-200 bg-white h-9 text-sm">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="1"><div className="flex items-center gap-2"><Shield className="w-3.5 h-3.5 text-[#0f2d5e]" />Admin</div></SelectItem>
                        <SelectItem value="2"><div className="flex items-center gap-2"><Star className="w-3.5 h-3.5 text-[#1e4db7]" />Officer</div></SelectItem>
                        <SelectItem value="3"><div className="flex items-center gap-2"><Users className="w-3.5 h-3.5 text-blue-500" />Member</div></SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-slate-700 font-semibold text-xs">Status</Label>
                    <Select value={form.is_active} onValueChange={set("is_active")}>
                      <SelectTrigger className="border-slate-200 bg-white h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="1"><div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />Active</div></SelectItem>
                        <SelectItem value="0"><div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" />Inactive</div></SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}

            {step === 2 && isMember && (
              <>
                <SLabel icon={GraduationCap} text="Student Information" />

                {/* Name row */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { f: "first_name",  label: "First Name",  ph: "Juan",      req: true  },
                    { f: "middle_name", label: "Middle",       ph: "Optional",  req: false },
                    { f: "last_name",   label: "Last Name",   ph: "Dela Cruz", req: true  },
                  ].map(({ f, label, ph, req }) => (
                    <div key={f} className="space-y-1">
                      <Label className="text-slate-700 font-semibold text-xs">
                        {label} {req && <span className="text-red-500">*</span>}
                      </Label>
                      <Input value={form[f]} onChange={set(f)} placeholder={ph} required={req}
                        className="border-slate-200 focus:border-[#1e4db7] bg-white h-9 text-sm" />
                    </div>
                  ))}
                </div>

                {/* Student No. + Department */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-slate-700 font-semibold text-xs">
                      Student No. <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      value={form.student_number}
                      onChange={set("student_number")}
                      placeholder="2024-00001"
                      required
                      className="border-slate-200 focus:border-[#1e4db7] bg-white h-9 font-mono text-sm"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-slate-700 font-semibold text-xs">
                      Department <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={form.department_id}
                      onValueChange={(val) => {
                        setForm(p => ({ ...p, department_id: val, course: "" }));
                      }}
                      required
                    >
                      <SelectTrigger className="border-slate-200 bg-white h-9 text-sm">
                        <SelectValue placeholder={
                          departments.length === 0 ? "No departments…" : "Select department"
                        } />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl max-h-52">
                        {departments.length === 0 ? (
                          <div className="px-3 py-4 text-center text-xs text-slate-400">
                            No departments available
                          </div>
                        ) : departments.map(dept => (
                          <SelectItem key={dept.id} value={String(dept.id)}>
                            <div className="flex items-center gap-2">
                              <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate">{dept.name}</span>
                              {dept.code && (
                                <span className="text-slate-400 text-[10px] font-mono shrink-0">
                                  {dept.code}
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Course Selection */}
                <div className="space-y-1">
                  <Label className="text-slate-700 font-semibold text-xs">
                    Course / Program <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={form.course}
                    onValueChange={set("course")}
                    required
                    disabled={!form.department_id}
                  >
                    <SelectTrigger className="border-slate-200 bg-white h-9 text-sm">
                      <SelectValue placeholder={
                        !form.department_id 
                          ? "Select department first" 
                          : "Select course"
                      } />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl max-h-60">
                      {!form.department_id ? (
                        <div className="px-3 py-4 text-center text-xs text-slate-400">
                          Please select a department first
                        </div>
                      ) : availableCourses.length === 0 ? (
                        <div className="px-3 py-4 text-center text-xs text-slate-400">
                          No courses available for this department
                        </div>
                      ) : availableCourses.map(course => (
                        <SelectItem key={course} value={course}>
                          <div className="flex items-start gap-2 py-1">
                            <BookOpen className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                            <span className="text-xs leading-relaxed">{course}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.course && (
                    <p className="text-[11px] text-slate-400 mt-1">
                      Selected: <strong className="text-slate-600">{form.course}</strong>
                    </p>
                  )}
                </div>

                {/* Year Level + Contact */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-slate-700 font-semibold text-xs">
                      Year Level <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={form.year_level}
                      onValueChange={set("year_level")}
                      required
                    >
                      <SelectTrigger className="border-slate-200 bg-white h-9 text-sm">
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {YEAR_LEVELS.map(y => (
                          <SelectItem key={y} value={y}>
                            <div className="flex items-center gap-2">
                              <GraduationCap className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              {y}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-slate-700 font-semibold text-xs">Contact Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input value={form.contact_number} onChange={set("contact_number")}
                        placeholder="09XX XXX XXXX"
                        className="pl-9 border-slate-200 bg-white h-9 text-sm" />
                    </div>
                  </div>
                </div>

                {/* Selected department preview */}
                {selectedDept && (
                  <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2">
                    <Building2 className="w-3.5 h-3.5 text-[#1e4db7] shrink-0" />
                    <span className="text-xs text-slate-600">
                      Department: <strong className="text-[#0f2d5e]">{selectedDept.name}</strong>
                      {selectedDept.code && (
                        <span className="ml-1.5 font-mono text-slate-400">({selectedDept.code})</span>
                      )}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 rounded-b-2xl flex items-center justify-between gap-3 sticky bottom-0">
            <span className="text-xs text-slate-400">{isMember ? `Step ${step} of 2` : ""}</span>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose}
                className="border-slate-200 text-slate-600 hover:bg-slate-100 h-9">
                Cancel
              </Button>

              {isMember && step === 1 && (
                <Button type="button" onClick={() => setStep(2)}
                  className="bg-[#0f2d5e] hover:bg-[#1e4db7] text-white h-9">
                  Next <ChevronRight className="ml-1 w-4 h-4" />
                </Button>
              )}

              {(!isMember || step === 2) && (
                <Button type="submit" disabled={saving}
                  className="bg-[#0f2d5e] hover:bg-[#1e4db7] text-white min-w-[130px] h-9">
                  {saving
                    ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</>
                    : <><CheckCircle2 className="mr-2 h-4 w-4" />{isEdit ? "Save Changes" : "Create Account"}</>
                  }
                </Button>
              )}
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Delete Confirmation ────────────────────────────────────────────────────
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
  const [users, setUsers]               = useState([]);
  const [departments, setDepartments]   = useState([]);
  const [organizations, setOrganizations] = useState([]); // ✅ ADDED
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState("");
  const [filterRole, setFilterRole]     = useState("all");
  
  // ✅ NEW FILTERS
  const [filterYear, setFilterYear]       = useState("all");
  const [filterDept, setFilterDept]       = useState("all");
  const [filterCourse, setFilterCourse]   = useState("all");
  const [filterOrg, setFilterOrg]         = useState("all");
  const [showFilters, setShowFilters]     = useState(false);
  
  const [formOpen, setFormOpen]         = useState(false);
  const [editUser, setEditUser]         = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    // ✅ Fetch both departments and organizations
    Promise.all([
      axios.get("/api/departments", authH()),
      axios.get("/api/organizations", authH())
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
  const members  = users.filter(u => String(u.user_type_id) === "3").length;

  // ✅ ENHANCED FILTERING
  const filtered = users.filter(u => {
    const q     = search.toLowerCase();
    const matchSearch = !search
      || getFullName(u).toLowerCase().includes(q)
      || u.email?.toLowerCase().includes(q)
      || u.student?.student_id?.toLowerCase().includes(q);
    
    const matchRole = filterRole === "all" || String(u.user_type_id) === filterRole;
    const matchYear = filterYear === "all" || u.student?.year_level === filterYear;
    const matchDept = filterDept === "all" || String(u.student?.department_id) === filterDept;
    const matchCourse = filterCourse === "all" || u.student?.course === filterCourse;
    // Note: organization filtering would require organization data on user/student model
    const matchOrg = filterOrg === "all"; // Implement if organization field exists
    
    return matchSearch && matchRole && matchYear && matchDept && matchCourse && matchOrg;
  });

  // ✅ Extract unique values for filter dropdowns
  const availableYears = [...new Set(users.map(u => u.student?.year_level).filter(Boolean))].sort();
  const availableCourses = [...new Set(users.map(u => u.student?.course).filter(Boolean))].sort();
  
  // ✅ Count active filters
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
          <StatCard icon={Users}         label="Total Accounts" value={total}    sub={`${active} active`}       grad="from-[#0f2d5e] to-[#1a4a8a]" />
          <StatCard icon={Shield}        label="Admins"         value={admins}   sub="Full access"              grad="from-[#1a3568] to-[#2d5ca8]" />
          <StatCard icon={Star}          label="Officers"       value={officers} sub="Elevated privileges"      grad="from-[#1e4db7] to-[#3b6fd4]" />
          <StatCard icon={GraduationCap} label="Members"        value={members}  sub="Student accounts"         grad="from-[#2563eb] to-[#5b9ef7]" />
        </div>

        {/* Table card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">

          {/* Toolbar */}
          <div className="px-5 py-3.5 border-b border-slate-100 space-y-3">
            {/* Main search row */}
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
                    <SelectItem value="3">Member</SelectItem>
                  </SelectContent>
                </Select>
                
                {/* ✅ FILTER TOGGLE BUTTON */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className={`h-8 border-slate-200 text-slate-600 hover:bg-slate-100 ${
                    activeFiltersCount > 0 ? "border-[#1e4db7] text-[#1e4db7] bg-blue-50" : ""
                  }`}>
                  <Filter className="w-3.5 h-3.5 mr-1.5" />
                  Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
                </Button>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Activity className="w-3.5 h-3.5" />
                <span><strong className="text-slate-600">{filtered.length}</strong> result{filtered.length !== 1 ? "s" : ""}</span>
              </div>
            </div>

            {/* ✅ ADVANCED FILTERS (collapsible) */}
            {showFilters && (
              <div className="grid grid-cols-4 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                {/* Year Level Filter */}
                <div className="space-y-1.5">
                  <Label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide flex items-center gap-1">
                    <GraduationCap className="w-3 h-3" />
                    Year Level
                  </Label>
                  <Select value={filterYear} onValueChange={setFilterYear}>
                    <SelectTrigger className="h-8 text-xs border-slate-200 bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-lg">
                      <SelectItem value="all" className="text-xs">All Years</SelectItem>
                      {availableYears.map(year => (
                        <SelectItem key={year} value={year} className="text-xs">{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Department Filter */}
                <div className="space-y-1.5">
                  <Label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide flex items-center gap-1">
                    <Building2 className="w-3 h-3" />
                    Department
                  </Label>
                  <Select value={filterDept} onValueChange={setFilterDept}>
                    <SelectTrigger className="h-8 text-xs border-slate-200 bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-lg max-h-52">
                      <SelectItem value="all" className="text-xs">All Departments</SelectItem>
                      {departments.map(dept => (
                        <SelectItem key={dept.id} value={String(dept.id)} className="text-xs">
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Course Filter */}
                <div className="space-y-1.5">
                  <Label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide flex items-center gap-1">
                    <BookOpen className="w-3 h-3" />
                    Course
                  </Label>
                  <Select value={filterCourse} onValueChange={setFilterCourse}>
                    <SelectTrigger className="h-8 text-xs border-slate-200 bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-lg max-h-52">
                      <SelectItem value="all" className="text-xs">All Courses</SelectItem>
                      {availableCourses.map(course => (
                        <SelectItem key={course} value={course} className="text-xs truncate">
                          {course}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Organization Filter */}
                <div className="space-y-1.5">
                  <Label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    Organization
                  </Label>
                  <Select value={filterOrg} onValueChange={setFilterOrg}>
                    <SelectTrigger className="h-8 text-xs border-slate-200 bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-lg max-h-52">
                      <SelectItem value="all" className="text-xs">All Organizations</SelectItem>
                      {organizations.map(org => (
                        <SelectItem key={org.id} value={String(org.id)} className="text-xs">
                          {org.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Clear Filters Button */}
                {activeFiltersCount > 0 && (
                  <div className="col-span-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setFilterYear("all");
                        setFilterDept("all");
                        setFilterCourse("all");
                        setFilterOrg("all");
                      }}
                      className="w-full h-7 text-xs border-slate-200 text-slate-600 hover:bg-slate-100">
                      <X className="w-3 h-3 mr-1.5" />
                      Clear all filters
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
                          onClick={() => { 
                            setSearch(""); 
                            setFilterRole("all");
                            setFilterYear("all");
                            setFilterDept("all");
                            setFilterCourse("all");
                            setFilterOrg("all");
                          }}
                          className="rounded-xl border-slate-200 text-slate-600 text-xs h-8">
                          Clear filters
                        </Button>
                      </div>
                    </td>
                  </tr>
                ) : filtered.map(user => {
                  const rk   = String(user.user_type_id);
                  const meta = ROLE_META[rk];
                  const Ico  = meta?.icon ?? UserCircle;
                  const deptName =
                    user.student?.department?.name ??
                    departments.find(d => d.id === user.student?.department_id)?.name ??
                    null;

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
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-3.5">
                        <span className="text-sm font-mono text-slate-500">
                          {user.student?.student_id ?? <span className="text-slate-300 text-xs">—</span>}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 max-w-[120px]">
                        {deptName ? (
                          <div className="flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="text-sm text-slate-600 truncate">{deptName}</span>
                          </div>
                        ) : (
                          <span className="text-slate-300 text-xs">—</span>
                        )}
                      </td>

                      {/* ✅ COURSE COLUMN */}
                      <td className="px-5 py-3.5 max-w-[160px]">
                        {user.student?.course ? (
                          <div className="flex items-center gap-1.5">
                            <BookOpen className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="text-sm text-slate-600 truncate" title={user.student.course}>
                              {user.student.course}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-300 text-xs">—</span>
                        )}
                      </td>

                      <td className="px-5 py-3.5">
                        <Badge className={`${meta?.badge ?? "bg-slate-100 text-slate-600 border-slate-200"} border flex items-center gap-1 w-fit text-xs font-semibold px-2.5 py-0.5 rounded-full`}>
                          <Ico className="w-3 h-3" />{user.user_type?.name ?? "Unassigned"}
                        </Badge>
                      </td>

                      <td className="px-5 py-3.5 text-sm text-slate-500 whitespace-nowrap">
                        {user.student?.year_level
                          ? <div className="flex items-center gap-1.5">
                              <GraduationCap className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              {user.student.year_level}
                            </div>
                          : <span className="text-slate-300">—</span>}
                      </td>

                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                          user.is_active
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-slate-100 text-slate-500 border-slate-200"
                        }`}>
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