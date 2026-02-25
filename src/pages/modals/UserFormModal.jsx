import { useEffect, useState } from "react";
import axios from "axios";
import {
  Mail, ShieldCheck, Phone, GraduationCap,
  Pencil, Users, Shield, Star, CheckCircle2,
  Eye, EyeOff, Building2, Lock, ChevronRight,
  BookOpen, UserPlus, X, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

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

const EMPTY_FORM = {
  email: "", password: "", user_type_id: "", is_active: "1",
  student_number: "", first_name: "", middle_name: "",
  last_name: "", department_id: "", year_level: "", contact_number: "",
  course: "",
  org_memberships: [],
};

const authH = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });

// ── Section label ──────────────────────────────────────────────────────────
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

// ── Add Org Row ────────────────────────────────────────────────────────────
function AddOrgRow({ organizations, existingIds, onAdd, isOfficer }) {
  const [orgId, setOrgId]  = useState("");
  const [orgRole, setRole] = useState("officer");
  const [position, setPos] = useState("");

  const available = organizations.filter(o => !existingIds.includes(String(o.id)));

  const handleAdd = () => {
    if (!orgId) return;
    onAdd({ organization_id: orgId, org_role: orgRole, position });
    setOrgId("");
    setRole("officer");
    setPos("");
  };

  return (
    <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-xl space-y-2 overflow-hidden">
      <p className="text-[10px] font-bold uppercase tracking-widest text-[#0f2d5e]/50">Add Organization</p>
      <div className="flex items-end gap-2 min-w-0">

        <div className="flex-1 min-w-0 space-y-1">
          <Label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide">Organization</Label>
          <Select value={orgId} onValueChange={setOrgId}>
            <SelectTrigger className="h-8 text-xs border-slate-200 bg-white w-full">
              <SelectValue placeholder={available.length === 0 ? "All orgs added" : "Select org…"} />
            </SelectTrigger>
            <SelectContent className="rounded-lg max-h-52">
              {available.map(o => (
                <SelectItem key={o.id} value={String(o.id)} className="text-xs">
                  <div className="flex items-center gap-2">
                    <Users className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate">{o.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isOfficer && (
          <div className="w-24 shrink-0 space-y-1">
            <Label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide">Role</Label>
            <Select value={orgRole} onValueChange={setRole}>
              <SelectTrigger className="h-8 text-xs border-slate-200 bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-lg">
                <SelectItem value="officer" className="text-xs">
                  <div className="flex items-center gap-1.5"><Star className="w-3 h-3 text-[#1e4db7]" />Officer</div>
                </SelectItem>
                <SelectItem value="adviser" className="text-xs">
                  <div className="flex items-center gap-1.5"><ShieldCheck className="w-3 h-3 text-emerald-600" />Adviser</div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="flex-1 min-w-0 space-y-1">
          <Label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide">
            Position <span className="normal-case font-normal text-slate-400">(optional)</span>
          </Label>
          <Input
            value={position}
            onChange={e => setPos(e.target.value)}
            placeholder={isOfficer ? "President…" : "Member…"}
            className="h-8 text-xs border-slate-200 bg-white w-full"
          />
        </div>

        <Button type="button" onClick={handleAdd} disabled={!orgId || available.length === 0}
          className="h-8 px-3 bg-[#0f2d5e] hover:bg-[#1e4db7] text-white text-xs shrink-0 self-end">
          <UserPlus className="w-3.5 h-3.5 mr-1" /> Add
        </Button>
      </div>
    </div>
  );
}

// ── Org Membership List ────────────────────────────────────────────────────
function OrgMembershipList({ memberships, organizations, onRemove, isOfficer }) {
  if (memberships.length === 0) {
    return (
      <div className="flex flex-col items-center gap-1.5 py-4 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
        <Users className="w-6 h-6 text-slate-300" />
        <p className="text-xs text-slate-400">No organizations added yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {memberships.map((m, i) => {
        const orgName   = organizations.find(o => String(o.id) === m.organization_id)?.name ?? "—";
        const roleBadge = isOfficer
          ? m.org_role === "adviser"
            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
            : "bg-[#1e4db7]/10 text-[#1e4db7] border-[#1e4db7]/20"
          : "bg-blue-50 text-blue-600 border-blue-200";
        const roleLabel = isOfficer ? (m.org_role ?? "officer") : "member";

        return (
          <div key={i} className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2.5 shadow-sm min-w-0 overflow-hidden">
            <div className="w-7 h-7 rounded-lg bg-[#0f2d5e]/10 flex items-center justify-center shrink-0">
              <Users className="w-3.5 h-3.5 text-[#0f2d5e]" />
            </div>
            <div className="flex-1 min-w-0 overflow-hidden">
              <p className="text-xs font-semibold text-slate-700 truncate">{orgName}</p>
              {m.position && <p className="text-[11px] text-slate-400 truncate">{m.position}</p>}
            </div>
            <Badge className={`${roleBadge} border text-[10px] font-semibold px-2 capitalize shrink-0`}>
              {roleLabel}
            </Badge>
            <button type="button" onClick={() => onRemove(i)}
              className="text-slate-300 hover:text-red-500 shrink-0 ml-1 transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ── Main Export ────────────────────────────────────────────────────────────
export default function UserFormModal({ open, onClose, onSaved, editUser, departments, organizations }) {
  const isEdit              = Boolean(editUser);
  const [form, setForm]     = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [step, setStep]     = useState(1);

  const needsStudentProfile = form.user_type_id === "2" || form.user_type_id === "3";
  const isOfficer           = form.user_type_id === "2";
  const hasOrgStep          = form.user_type_id === "2" || form.user_type_id === "3";
  const totalSteps          = hasOrgStep ? 3 : needsStudentProfile ? 2 : 1;

  const STEPS = hasOrgStep
    ? [{ n: 1, label: "Account" }, { n: 2, label: "Student Profile" }, { n: 3, label: "Organization" }]
    : needsStudentProfile
    ? [{ n: 1, label: "Account" }, { n: 2, label: "Student Profile" }]
    : [{ n: 1, label: "Account" }];

  useEffect(() => {
    if (!open) return;
    if (editUser) {
      const typeId = String(editUser.user_type_id ?? "");
      setForm({
        email:           editUser.email                   ?? "",
        password:        "",
        user_type_id:    typeId,
        is_active:       editUser.is_active ? "1" : "0",
        student_number:  editUser.student?.student_number ?? "",
        first_name:      editUser.student?.first_name     ?? "",
        middle_name:     editUser.student?.middle_name    ?? "",
        last_name:       editUser.student?.last_name      ?? "",
        department_id:   String(editUser.student?.department_id ?? ""),
        year_level:      editUser.student?.year_level     ?? "",
        contact_number:  editUser.student?.contact_number ?? "",
        course:          editUser.student?.course         ?? "",
        org_memberships: (editUser.all_memberships ?? []).map(m => ({
          organization_id: String(m.organization_id),
          org_role:        m.role ?? "officer",
          position:        m.position ?? "",
        })),
      });
      setStep(typeId === "2" || typeId === "3" ? 3 : 1);
    } else {
      setForm(EMPTY_FORM);
      setStep(1);
    }
  }, [open, editUser]);

  const set            = (f) => (e) => setForm(p => ({ ...p, [f]: e?.target?.value ?? e }));
  const resetRole      = (val) => setForm(p => ({ ...p, user_type_id: val, org_memberships: [] }));
  const addMembership  = (entry) => setForm(p => ({ ...p, org_memberships: [...p.org_memberships, entry] }));
  const removeMembership = (idx) => setForm(p => ({ ...p, org_memberships: p.org_memberships.filter((_, i) => i !== idx) }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = isEdit
        ? await axios.put(`/api/users/${editUser.id}`, form, authH())
        : await axios.post("/api/users", form, authH());
      toast.success(isEdit ? "Account Updated!" : "Account Created!", { description: response.data.message });
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

  const selectedDept     = departments.find(d => String(d.id) === form.department_id);
  const availableCourses = COURSES_BY_DEPARTMENT[form.department_id] || [];

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="bg-white border-0 shadow-2xl sm:max-w-[520px] w-full p-0 rounded-2xl gap-0 max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="bg-gradient-to-br from-[#0f2d5e] via-[#153d80] to-[#1e4db7] px-6 py-5 rounded-t-2xl sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              {isEdit ? <Pencil className="w-5 h-5 text-white" /> : <ShieldCheck className="w-5 h-5 text-white" />}
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-lg font-bold text-white truncate">
                {isEdit ? "Edit Account" : "Create New Account"}
              </DialogTitle>
              <DialogDescription className="text-blue-200 text-xs mt-0.5">
                {isEdit ? "Update user details and permissions" : "Register a new system user"}
              </DialogDescription>
            </div>
          </div>

          {needsStudentProfile && (
            <div className="flex items-center gap-2 mt-4 flex-wrap">
              {STEPS.map(({ n, label }, i, arr) => (
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
          {isEdit && needsStudentProfile && (
            <p className="text-[11px] text-blue-200/70 mt-2">Click any step above to jump directly to it</p>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 space-y-4">

            {/* ── STEP 1 ── */}
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
                        <SelectItem value="1">
                          <div className="flex items-center gap-2"><Shield className="w-3.5 h-3.5 text-[#0f2d5e]" />Admin</div>
                        </SelectItem>
                        <SelectItem value="2">
                          <div className="flex items-center gap-2"><Star className="w-3.5 h-3.5 text-[#1e4db7]" />Officer</div>
                        </SelectItem>
                        <SelectItem value="3">
                          <div className="flex items-center gap-2"><GraduationCap className="w-3.5 h-3.5 text-blue-500" />Student</div>
                        </SelectItem>
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
                        <SelectItem value="1">
                          <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />Active</div>
                        </SelectItem>
                        <SelectItem value="0">
                          <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" />Inactive</div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {isOfficer && (
                  <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2.5">
                    <Star className="w-3.5 h-3.5 text-[#1e4db7] shrink-0 mt-0.5" />
                    <p className="text-xs text-slate-600">
                      Officers can manage multiple organizations. Assign their role and position per org in step 3.
                    </p>
                  </div>
                )}
                {form.user_type_id === "3" && (
                  <div className="flex items-start gap-2 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5">
                    <GraduationCap className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-slate-600">
                      Students can belong to multiple organizations. Assign them in step 3 (optional).
                    </p>
                  </div>
                )}
              </>
            )}

            {/* ── STEP 2 ── */}
            {step === 2 && needsStudentProfile && (
              <>
                <SLabel icon={GraduationCap} text="Student Information" />
                {isEdit && (
                  <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 mb-1">
                    <Pencil className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <p className="text-xs text-slate-600">Fields are pre-filled — only update what needs changing.</p>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-2">
                  {[
                    { f: "first_name",  label: "First Name", ph: "Juan",      req: true  },
                    { f: "middle_name", label: "Middle",     ph: "Optional",  req: false },
                    { f: "last_name",   label: "Last Name",  ph: "Dela Cruz", req: true  },
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

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-slate-700 font-semibold text-xs">Student No. <span className="text-red-500">*</span></Label>
                    <Input value={form.student_number} onChange={set("student_number")}
                      placeholder="2024-00001" required
                      className="border-slate-200 focus:border-[#1e4db7] bg-white h-9 font-mono text-sm" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-slate-700 font-semibold text-xs">Department <span className="text-red-500">*</span></Label>
                    <Select value={form.department_id}
                      onValueChange={(val) => setForm(p => ({ ...p, department_id: val, course: "" }))} required>
                      <SelectTrigger className="border-slate-200 bg-white h-9 text-sm">
                        <SelectValue placeholder={departments.length === 0 ? "No departments…" : "Select department"} />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl max-h-52">
                        {departments.map(dept => (
                          <SelectItem key={dept.id} value={String(dept.id)}>
                            <div className="flex items-center gap-2">
                              <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate">{dept.name}</span>
                              {dept.code && <span className="text-slate-400 text-[10px] font-mono shrink-0">{dept.code}</span>}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-slate-700 font-semibold text-xs">Course / Program <span className="text-red-500">*</span></Label>
                  <Select value={form.course} onValueChange={set("course")} required disabled={!form.department_id}>
                    <SelectTrigger className="border-slate-200 bg-white h-9 text-sm">
                      <SelectValue placeholder={!form.department_id ? "Select department first" : "Select course"} />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl max-h-60">
                      {availableCourses.map(course => (
                        <SelectItem key={course} value={course}>
                          <div className="flex items-start gap-2 py-1">
                            <BookOpen className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                            <span className="text-xs leading-relaxed">{course}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-slate-700 font-semibold text-xs">Year Level <span className="text-red-500">*</span></Label>
                    <Select value={form.year_level} onValueChange={set("year_level")} required>
                      <SelectTrigger className="border-slate-200 bg-white h-9 text-sm">
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {YEAR_LEVELS.map(y => (
                          <SelectItem key={y} value={y}>
                            <div className="flex items-center gap-2">
                              <GraduationCap className="w-3.5 h-3.5 text-slate-400 shrink-0" />{y}
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

                {selectedDept && (
                  <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2">
                    <Building2 className="w-3.5 h-3.5 text-[#1e4db7] shrink-0" />
                    <span className="text-xs text-slate-600 truncate">
                      Department: <strong className="text-[#0f2d5e]">{selectedDept.name}</strong>
                      {selectedDept.code && <span className="ml-1.5 font-mono text-slate-400">({selectedDept.code})</span>}
                    </span>
                  </div>
                )}
              </>
            )}

            {/* ── STEP 3 ── */}
            {step === 3 && hasOrgStep && (
              <>
                <SLabel icon={Users} text="Organization Assignment" />
                <div className="flex items-start gap-2 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5 mb-2">
                  {isOfficer
                    ? <Star className="w-3.5 h-3.5 text-[#1e4db7] shrink-0 mt-0.5" />
                    : <GraduationCap className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  }
                  <p className="text-xs text-slate-600">
                    {isOfficer
                      ? <><strong>Officers</strong> can be assigned to multiple organizations with a specific role and position per org.</>
                      : <><strong>Students</strong> can belong to multiple organizations. This is optional.</>
                    }
                  </p>
                </div>

                <OrgMembershipList
                  memberships={form.org_memberships}
                  organizations={organizations}
                  onRemove={removeMembership}
                  isOfficer={isOfficer}
                />

                <AddOrgRow
                  organizations={organizations}
                  existingIds={form.org_memberships.map(m => m.organization_id)}
                  onAdd={addMembership}
                  isOfficer={isOfficer}
                />

                {form.org_memberships.length > 0 && (
                  <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 overflow-hidden">
                    <p className="text-xs font-semibold text-[#0f2d5e] mb-1.5">
                      {form.org_memberships.length} Organization{form.org_memberships.length > 1 ? "s" : ""} Assigned
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {form.org_memberships.map((m, i) => (
                        <span key={i} className="inline-flex items-center gap-1 bg-white border border-blue-200 text-[#0f2d5e] text-[11px] font-medium px-2 py-0.5 rounded-full max-w-[200px]">
                          <Users className="w-2.5 h-2.5 shrink-0" />
                          <span className="truncate">
                            {organizations.find(o => String(o.id) === m.organization_id)?.name ?? "—"}
                          </span>
                          {isOfficer && <span className="text-slate-400 capitalize shrink-0"> · {m.org_role}</span>}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 rounded-b-2xl flex items-center justify-between gap-3 sticky bottom-0">
            <span className="text-xs text-slate-400">
              {needsStudentProfile ? isEdit ? `Step ${step} of ${totalSteps} · click steps to jump` : `Step ${step} of ${totalSteps}` : ""}
            </span>
            <div className="flex gap-2">
              {step > 1 && (
                <Button type="button" variant="outline" onClick={() => setStep(s => s - 1)}
                  className="border-slate-200 text-slate-600 hover:bg-slate-100 h-9">Back</Button>
              )}
              {step === 1 && (
                <Button type="button" variant="outline" onClick={onClose}
                  className="border-slate-200 text-slate-600 hover:bg-slate-100 h-9">Cancel</Button>
              )}
              {step < totalSteps && (
                <Button type="button" onClick={() => setStep(s => s + 1)}
                  className="bg-[#0f2d5e] hover:bg-[#1e4db7] text-white h-9">
                  Next <ChevronRight className="ml-1 w-4 h-4" />
                </Button>
              )}
              {step === totalSteps && (
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