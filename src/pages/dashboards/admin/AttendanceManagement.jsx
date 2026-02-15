import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import {
  ClipboardList, Plus, Loader2, Search, X, RefreshCw,
  MoreHorizontal, Users, Calendar, AlertTriangle,
  CheckCircle2, TrendingUp, QrCode, CreditCard, Hand,
  LogIn, LogOut, Timer, Trash2, BarChart3, Activity,
  Filter, BookOpen, Building2, GraduationCap,
} from "lucide-react";
import { Button }   from "@/components/ui/button";
import { Badge }    from "@/components/ui/badge";
import { Input }    from "@/components/ui/input";
import { Label }    from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
const authH = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});

const fmt = (ts) => {
  if (!ts) return "—";
  return new Date(ts).toLocaleString("en-PH", {
    month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

const TYPE_COLORS = {
  QR:     "bg-blue-50   text-blue-700   border-blue-200",
  RFID:   "bg-violet-50 text-violet-700 border-violet-200",
  manual: "bg-amber-50  text-amber-700  border-amber-200",
};
const TYPE_ICONS = { QR: QrCode, RFID: CreditCard, manual: Hand };

const STATUS_COLORS = {
  checked_in:  "bg-emerald-50 text-emerald-700 border-emerald-200",
  checked_out: "bg-slate-100  text-slate-500   border-slate-200",
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

// ── Manual Check-In Modal ──────────────────────────────────────────────────
function ManualCheckInModal({ open, onClose, onSaved, events, students, defaultEventId }) {
  const [form, setForm]     = useState({ event_id: "", student_id: "", time_in: "", remarks: "" });
  const [saving, setSaving] = useState(false);
  
  // Student filters
  const [studentSearch, setStudentSearch] = useState("");
  const [yearFilter, setYearFilter]       = useState("all");
  const [deptFilter, setDeptFilter]       = useState("all");
  const [progFilter, setProgFilter]       = useState("all");
  const [showFilters, setShowFilters]     = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm({
      event_id:   defaultEventId ?? "",
      student_id: "",
      time_in:    new Date().toISOString().slice(0, 16),
      remarks:    "",
    });
    // Reset filters
    setStudentSearch("");
    setYearFilter("all");
    setDeptFilter("all");
    setProgFilter("all");
  }, [open, defaultEventId]);

  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e?.target?.value ?? e }));

  // Filter students based on search and filters
  const filteredStudents = students.filter(s => {
    const matchSearch = !studentSearch 
      || s.name?.toLowerCase().includes(studentSearch.toLowerCase())
      || s.student_id?.toLowerCase().includes(studentSearch.toLowerCase())
      || s.email?.toLowerCase().includes(studentSearch.toLowerCase());
    
    const matchYear = yearFilter === "all" || String(s.year_level) === yearFilter;
    const matchDept = deptFilter === "all" || String(s.department_id) === deptFilter;
    const matchProg = progFilter === "all" || String(s.program_id) === progFilter;
    
    return matchSearch && matchYear && matchDept && matchProg;
  });

  // Extract unique values for filter dropdowns
  const yearLevels = [...new Set(students.map(s => s.year_level).filter(Boolean))].sort();
  const departments = [...new Map(students.filter(s => s.department).map(s => [s.department_id, s.department])).values()];
  const programs = [...new Map(students.filter(s => s.program).map(s => [s.program_id, s.program])).values()];

  const activeFiltersCount = [yearFilter, deptFilter, progFilter].filter(f => f !== "all").length;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.event_id)   { toast.error("Please select an event.");  return; }
    if (!form.student_id) { toast.error("Please select a student."); return; }

    setSaving(true);
    try {
      const res = await axios.post(
        "/api/attendance/manual-checkin",
        {
          event_id:   form.event_id,
          student_id: form.student_id,
          time_in:    form.time_in || undefined,
          remarks:    form.remarks || undefined,
        },
        authH(),
      );
      toast.success("Checked In!", { description: res.data.message });
      onSaved();
      onClose();
    } catch (err) {
      const errs = err.response?.data?.errors;
      toast.error("Error", {
        description: errs
          ? Object.values(errs).flat().join("\n")
          : err.response?.data?.message ?? "An error occurred.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="bg-white border-0 shadow-2xl sm:max-w-[640px] p-0 rounded-2xl gap-0 max-h-[90vh] overflow-y-auto">

        <div className="bg-gradient-to-br from-[#0f2d5e] via-[#153d80] to-[#1e4db7] px-6 py-5 rounded-t-2xl sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <LogIn className="w-5 h-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-white">Manual Check-In</DialogTitle>
              <DialogDescription className="text-blue-200 text-xs mt-0.5">
                Record a student's attendance manually
              </DialogDescription>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 space-y-4">

            {/* Event Selection */}
            <div className="space-y-1">
              <Label className="text-slate-700 font-semibold text-xs">
                Event <span className="text-red-500">*</span>
              </Label>
              <Select value={form.event_id} onValueChange={set("event_id")} required>
                <SelectTrigger className="border-slate-200 bg-white h-10 text-sm">
                  <SelectValue placeholder="Select event…" />
                </SelectTrigger>
                <SelectContent className="rounded-xl max-h-52">
                  {events.map(ev => (
                    <SelectItem key={ev.id} value={String(ev.id)}>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {ev.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Student Selection with Filters */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-slate-700 font-semibold text-xs">
                  Student <span className="text-red-500">*</span>
                </Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="h-7 text-xs text-[#1e4db7] hover:text-[#0f2d5e] hover:bg-blue-50">
                  <Filter className="w-3.5 h-3.5 mr-1.5" />
                  Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
                </Button>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  value={studentSearch}
                  onChange={e => setStudentSearch(e.target.value)}
                  placeholder="Search by name, student ID, or email…"
                  className="pl-9 pr-8 border-slate-200 bg-white h-9 text-sm"
                />
                {studentSearch && (
                  <button
                    type="button"
                    onClick={() => setStudentSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Filter Controls */}
              {showFilters && (
                <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  {/* Year Level Filter */}
                  <div className="space-y-1">
                    <Label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide flex items-center gap-1">
                      <GraduationCap className="w-3 h-3" />
                      Year
                    </Label>
                    <Select value={yearFilter} onValueChange={setYearFilter}>
                      <SelectTrigger className="h-8 text-xs border-slate-200 bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-lg">
                        <SelectItem value="all" className="text-xs">All Years</SelectItem>
                        {yearLevels.map(year => (
                          <SelectItem key={year} value={String(year)} className="text-xs">
                            Year {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Department Filter */}
                  <div className="space-y-1">
                    <Label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide flex items-center gap-1">
                      <Building2 className="w-3 h-3" />
                      Department
                    </Label>
                    <Select value={deptFilter} onValueChange={setDeptFilter}>
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

                  {/* Program Filter */}
                  <div className="space-y-1">
                    <Label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide flex items-center gap-1">
                      <BookOpen className="w-3 h-3" />
                      Program
                    </Label>
                    <Select value={progFilter} onValueChange={setProgFilter}>
                      <SelectTrigger className="h-8 text-xs border-slate-200 bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-lg max-h-52">
                        <SelectItem value="all" className="text-xs">All Programs</SelectItem>
                        {programs.map(prog => (
                          <SelectItem key={prog.id} value={String(prog.id)} className="text-xs">
                            {prog.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Clear Filters Button */}
                  {activeFiltersCount > 0 && (
                    <div className="col-span-3">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setYearFilter("all");
                          setDeptFilter("all");
                          setProgFilter("all");
                        }}
                        className="w-full h-7 text-xs border-slate-200 text-slate-600 hover:bg-slate-100">
                        <X className="w-3 h-3 mr-1.5" />
                        Clear all filters
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Student Dropdown */}
              <Select value={form.student_id} onValueChange={set("student_id")} required>
                <SelectTrigger className="border-slate-200 bg-white h-10 text-sm">
                  <SelectValue placeholder="Select student…" />
                </SelectTrigger>
                <SelectContent className="rounded-xl max-h-72">
                  {filteredStudents.length === 0 ? (
                    <div className="py-6 text-center text-slate-400 text-sm">
                      <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <p className="font-medium">No students found</p>
                      <p className="text-xs mt-1">Try adjusting your filters</p>
                    </div>
                  ) : (
                    filteredStudents.map(s => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        <div className="flex items-center gap-2 py-1">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0f2d5e] to-[#1e4db7] flex items-center justify-center shrink-0">
                            <span className="text-white text-xs font-bold">
                              {s.name?.charAt(0)?.toUpperCase() ?? "?"}
                            </span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-slate-800 text-sm truncate">{s.name}</p>
                            <div className="flex items-center gap-2 text-xs text-slate-400">
                              {s.student_id && <span>{s.student_id}</span>}
                              {s.year_level && <span>· Year {s.year_level}</span>}
                              {s.department?.code && <span>· {s.department.code}</span>}
                            </div>
                          </div>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>

              {/* Results Counter */}
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>
                  Showing <strong className="text-slate-600">{filteredStudents.length}</strong> of{" "}
                  <strong className="text-slate-600">{students.length}</strong> students
                </span>
              </div>
            </div>

            {/* Time In */}
            <div className="space-y-1">
              <Label className="text-slate-700 font-semibold text-xs">Time In</Label>
              <div className="relative">
                <LogIn className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  type="datetime-local"
                  value={form.time_in}
                  onChange={set("time_in")}
                  className="pl-9 border-slate-200 focus:border-[#1e4db7] bg-white h-10 text-sm"
                />
              </div>
              <p className="text-xs text-slate-400">Leave at current time if checking in now</p>
            </div>

            {/* Remarks */}
            <div className="space-y-1">
              <Label className="text-slate-700 font-semibold text-xs">Remarks</Label>
              <Textarea
                value={form.remarks}
                onChange={set("remarks")}
                placeholder="Optional notes…"
                rows={3}
                className="border-slate-200 focus:border-[#1e4db7] bg-white resize-none text-sm"
              />
            </div>
          </div>

          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 rounded-b-2xl flex items-center justify-end gap-3 sticky bottom-0">
            <Button type="button" variant="outline" onClick={onClose}
              className="border-slate-200 text-slate-600 hover:bg-slate-100 h-9">
              Cancel
            </Button>
            <Button type="submit" disabled={saving}
              className="bg-[#0f2d5e] hover:bg-[#1e4db7] text-white min-w-[130px] h-9">
              {saving
                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</>
                : <><LogIn className="mr-2 h-4 w-4" />Check In</>}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Manual Check-Out Modal ─────────────────────────────────────────────────
function ManualCheckOutModal({ open, onClose, onSaved, record }) {
  const [timeOut, setTimeOut] = useState("");
  const [remarks, setRemarks] = useState("");
  const [saving, setSaving]   = useState(false);

  useEffect(() => {
    if (!open) return;
    setTimeOut(new Date().toISOString().slice(0, 16));
    setRemarks(record?.remarks ?? "");
  }, [open, record]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await axios.post(
        "/api/attendance/manual-checkout",
        {
          attendance_id: record.id,
          time_out:      timeOut || undefined,
          remarks:       remarks || undefined,
        },
        authH(),
      );
      toast.success("Checked Out!", {
        description: res.data.duration
          ? `${res.data.message} · Duration: ${res.data.duration}`
          : res.data.message,
      });
      onSaved();
      onClose();
    } catch (err) {
      toast.error("Error", {
        description: err.response?.data?.message ?? "Failed to check out.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="bg-white border-0 shadow-2xl sm:max-w-[460px] p-0 rounded-2xl gap-0">

        <div className="bg-gradient-to-br from-[#059669] to-[#10b981] px-6 py-5 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <LogOut className="w-5 h-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-white">Manual Check-Out</DialogTitle>
              <DialogDescription className="text-emerald-100 text-xs mt-0.5">
                {record?.student?.name ?? "Student"} — {record?.event?.name ?? "Event"}
              </DialogDescription>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 space-y-4">

            <div className="space-y-1">
              <Label className="text-slate-700 font-semibold text-xs">Time Out</Label>
              <div className="relative">
                <LogOut className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  type="datetime-local"
                  value={timeOut}
                  onChange={e => setTimeOut(e.target.value)}
                  className="pl-9 border-slate-200 focus:border-emerald-500 bg-white h-10 text-sm"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-slate-700 font-semibold text-xs">Remarks</Label>
              <Textarea
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
                placeholder="Optional notes…"
                rows={3}
                className="border-slate-200 focus:border-emerald-500 bg-white resize-none text-sm"
              />
            </div>

            <div className="bg-slate-50 rounded-xl p-3 flex items-center gap-3 text-sm text-slate-600">
              <LogIn className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Checked in at <strong>{fmt(record?.time_in)}</strong></span>
            </div>
          </div>

          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 rounded-b-2xl flex items-center justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}
              className="border-slate-200 text-slate-600 hover:bg-slate-100 h-9">
              Cancel
            </Button>
            <Button type="submit" disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[130px] h-9">
              {saving
                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</>
                : <><LogOut className="mr-2 h-4 w-4" />Check Out</>}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Delete Dialog ──────────────────────────────────────────────────────────
function DeleteDialog({ open, onClose, onConfirm, record }) {
  return (
    <AlertDialog open={open} onOpenChange={v => !v && onClose()}>
      <AlertDialogContent className="rounded-2xl border-0 shadow-2xl max-w-sm">
        <AlertDialogHeader>
          <div className="flex justify-center mb-3">
            <div className="w-14 h-14 rounded-2xl bg-red-50 ring-8 ring-red-50/50 flex items-center justify-center">
              <AlertTriangle className="w-7 h-7 text-red-500" />
            </div>
          </div>
          <AlertDialogTitle className="text-center text-slate-900">Delete this record?</AlertDialogTitle>
          <AlertDialogDescription className="text-center text-slate-500 text-sm">
            Permanently remove the attendance record for{" "}
            <strong className="text-slate-700">{record?.student?.name ?? "this student"}</strong>.
            This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex gap-2 mt-1">
          <AlertDialogCancel className="flex-1 rounded-xl border-slate-200">Cancel</AlertDialogCancel>
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
export default function AttendanceManagement() {
  // Data
  const [events,   setEvents]   = useState([]);
  const [students, setStudents] = useState([]);
  const [records,  setRecords]  = useState([]);
  const [stats,    setStats]    = useState(null);

  // UI
  const [selectedEvent,  setSelectedEvent]  = useState("");
  const [loadingBase,    setLoadingBase]    = useState(true);
  const [loadingAtt,     setLoadingAtt]     = useState(false);
  const [search,         setSearch]         = useState("");
  const [filterType,     setFilterType]     = useState("all");
  const [filterStatus,   setFilterStatus]   = useState("all");

  // Modals
  const [checkInOpen,  setCheckInOpen]  = useState(false);
  const [checkOutRec,  setCheckOutRec]  = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // ── Bootstrap ──────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const [evRes, stuRes] = await Promise.all([
          axios.get("/api/events",   authH()),
          axios.get("/api/students", authH()),
        ]);
        setEvents(evRes.data);
        setStudents(stuRes.data);
        if (evRes.data.length) setSelectedEvent(String(evRes.data[0].id));
      } catch {
        toast.error("Failed to load events / students.");
      } finally {
        setLoadingBase(false);
      }
    })();
  }, []);

  // ── Fetch attendance per event ─────────────────────────────────────────
  const fetchAttendance = useCallback(async () => {
    if (!selectedEvent) { setRecords([]); setStats(null); return; }
    setLoadingAtt(true);
    try {
      const res = await axios.get(`/api/attendance/event/${selectedEvent}`, authH());
      setRecords(res.data.attendance ?? res.data);
      setStats(res.data.stats ?? null);
    } catch {
      toast.error("Failed to load attendance for this event.");
    } finally {
      setLoadingAtt(false);
    }
  }, [selectedEvent]);

  useEffect(() => { fetchAttendance(); }, [fetchAttendance]);

  // ── Delete ────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await axios.delete(`/api/attendance/${deleteTarget.id}`, authH());
      toast.success("Record deleted.");
      setDeleteTarget(null);
      fetchAttendance();
    } catch (err) {
      toast.error("Error", { description: err.response?.data?.message ?? "Failed to delete." });
    }
  };

  // ── Derived stats ──────────────────────────────────────────────────────
  const total      = stats?.total       ?? records.length;
  const checkedIn  = stats?.checked_in  ?? records.filter(r => r.status === "checked_in").length;
  const checkedOut = stats?.checked_out ?? records.filter(r => r.status === "checked_out").length;
  const qrCount     = records.filter(r => r.attendance_type === "QR").length;
  const rfidCount   = records.filter(r => r.attendance_type === "RFID").length;
  const manualCount = records.filter(r => r.attendance_type === "manual").length;

  // ── Filter ─────────────────────────────────────────────────────────────
  const filtered = records.filter(r => {
    const q = search.toLowerCase();
    const matchSearch = !search
      || r.student?.name?.toLowerCase().includes(q)
      || r.remarks?.toLowerCase().includes(q);
    const matchType   = filterType   === "all" || r.attendance_type === filterType;
    const matchStatus = filterStatus === "all" || r.status === filterStatus;
    return matchSearch && matchType && matchStatus;
  });

  const selectedEventObj = events.find(e => String(e.id) === selectedEvent);

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <TooltipProvider>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#0f2d5e] to-[#1e4db7] flex items-center justify-center shadow-lg shadow-[#0f2d5e]/25">
              <ClipboardList className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-[#0f2d5e] tracking-tight">Attendance Management</h1>
              <p className="text-slate-500 text-xs mt-0.5">Track and manage student event attendance</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={fetchAttendance} disabled={loadingAtt}
                  className="border-[#0f2d5e]/20 text-[#0f2d5e] hover:bg-[#0f2d5e]/5 h-9 w-9 rounded-xl bg-white shadow-sm">
                  <RefreshCw className={`w-4 h-4 ${loadingAtt ? "animate-spin" : ""}`} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Refresh</TooltipContent>
            </Tooltip>
            <Button
              onClick={() => setCheckInOpen(true)}
              className="bg-gradient-to-r from-[#0f2d5e] to-[#1e4db7] hover:opacity-90 text-white shadow-md shadow-[#0f2d5e]/25 rounded-xl h-9 px-4 font-semibold text-sm">
              <Plus className="mr-2 h-4 w-4" /> Manual Check-In
            </Button>
          </div>
        </div>

        {/* Event selector bar */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 shrink-0">
              <Calendar className="w-4 h-4 text-[#1e4db7]" />
              <span className="text-sm font-semibold text-slate-700">Viewing Event:</span>
            </div>
            <div className="flex-1 min-w-[220px] max-w-xs">
              {loadingBase ? (
                <div className="h-10 rounded-xl bg-slate-100 animate-pulse" />
              ) : (
                <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                  <SelectTrigger className="border-slate-200 bg-slate-50 h-10 text-sm rounded-xl font-medium">
                    <SelectValue placeholder="Select an event…" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl max-h-60">
                    {events.map(ev => (
                      <SelectItem key={ev.id} value={String(ev.id)}>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {ev.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            {selectedEventObj && (
              <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
                <Activity className="w-3.5 h-3.5 text-[#1e4db7]" />
                <span className="font-medium text-slate-600">{total}</span>&nbsp;total records
              </div>
            )}
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={ClipboardList} label="Total Records" value={total}
            sub={selectedEventObj?.name ?? "All events"}
            grad="from-[#0f2d5e] to-[#1a4a8a]"
          />
          <StatCard
            icon={LogIn} label="Checked In" value={checkedIn}
            sub={`${checkedOut} checked out`}
            grad="from-[#059669] to-[#10b981]"
          />
          <StatCard
            icon={QrCode} label="QR / RFID" value={qrCount + rfidCount}
            sub={`${manualCount} manual`}
            grad="from-[#2563eb] to-[#5b9ef7]"
          />
          <StatCard
            icon={BarChart3} label="Attendance Rate"
            value={total ? `${Math.round((checkedIn / total) * 100)}%` : "—"}
            sub="Currently active"
            grad="from-[#7c3aed] to-[#a78bfa]"
          />
        </div>

        {/* Type breakdown tiles */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { Icon: QrCode,     label: "QR Code", count: qrCount,     bg: "bg-blue-50",   ic: "text-blue-600"   },
            { Icon: CreditCard, label: "RFID",    count: rfidCount,   bg: "bg-violet-50", ic: "text-violet-600" },
            { Icon: Hand,       label: "Manual",  count: manualCount, bg: "bg-amber-50",  ic: "text-amber-600"  },
          ].map(({ Icon, label, count, bg, ic }) => (
            <div key={label} className="bg-white rounded-xl p-4 border border-slate-200/60 shadow-sm">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${ic}`} />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">{label}</p>
                  <p className="text-2xl font-bold text-slate-900">{count}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Table card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">

          {/* Toolbar */}
          <div className="px-5 py-3.5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-0 flex-wrap">
              <div className="relative w-60">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search student, remarks…"
                  className="pl-9 pr-8 h-8 border-slate-200 bg-slate-50 focus:bg-white focus:border-[#1e4db7] text-sm rounded-xl"
                />
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
                  <SelectItem value="QR">QR Code</SelectItem>
                  <SelectItem value="RFID">RFID</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-36 h-8 border-slate-200 bg-slate-50 text-sm rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="checked_in">Checked In</SelectItem>
                  <SelectItem value="checked_out">Checked Out</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>
                <strong className="text-slate-600">{filtered.length}</strong>{" "}
                result{filtered.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>

          {/* Table body */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  {["Student", "Type", "Time In", "Time Out", "Duration", "Status", "Remarks", ""].map(h => (
                    <th key={h} className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loadingAtt ? (
                  <tr>
                    <td colSpan="8" className="py-24 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-[#0f2d5e]/5 flex items-center justify-center">
                          <Loader2 className="w-6 h-6 animate-spin text-[#1e4db7]" />
                        </div>
                        <span className="text-sm text-slate-400 font-medium">Loading attendance…</span>
                      </div>
                    </td>
                  </tr>
                ) : !selectedEvent ? (
                  <tr>
                    <td colSpan="8" className="py-24 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Calendar className="w-10 h-10 text-slate-200" />
                        <p className="text-sm text-slate-400">Select an event above to view attendance</p>
                      </div>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-24 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
                          <ClipboardList className="w-7 h-7 text-slate-300" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-500 text-sm">No records found</p>
                          <p className="text-xs text-slate-400 mt-0.5">Try adjusting filters or record a new check-in</p>
                        </div>
                        <Button variant="outline" size="sm"
                          onClick={() => { setSearch(""); setFilterType("all"); setFilterStatus("all"); }}
                          className="rounded-xl border-slate-200 text-slate-600 text-xs h-8">
                          Clear filters
                        </Button>
                      </div>
                    </td>
                  </tr>
                ) : filtered.map(rec => {
                  const TypeIcon = TYPE_ICONS[rec.attendance_type] ?? Hand;
                  const isActive = rec.is_active ?? (rec.status === "checked_in" && !rec.time_out);

                  return (
                    <tr key={rec.id} className="hover:bg-blue-50/30 transition-colors group">

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0f2d5e] to-[#1e4db7] flex items-center justify-center shrink-0 shadow-sm">
                            <span className="text-white text-xs font-bold">
                              {rec.student?.name?.charAt(0)?.toUpperCase() ?? "?"}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-800 text-sm truncate">
                              {rec.student?.name ?? `User #${rec.student_id}`}
                            </p>
                            {rec.student?.student_id && (
                              <p className="text-xs text-slate-400">{rec.student.student_id}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <Badge className={`${TYPE_COLORS[rec.attendance_type]} border text-xs font-semibold px-2.5 py-1 flex items-center gap-1.5 w-fit`}>
                          <TypeIcon className="w-3 h-3" />
                          {rec.attendance_type}
                        </Badge>
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <LogIn className="w-4 h-4 text-emerald-500 shrink-0" />
                          <span className="text-sm text-slate-600">{fmt(rec.time_in)}</span>
                        </div>
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap">
                        {rec.time_out ? (
                          <div className="flex items-center gap-2">
                            <LogOut className="w-4 h-4 text-slate-400 shrink-0" />
                            <span className="text-sm text-slate-600">{fmt(rec.time_out)}</span>
                          </div>
                        ) : (
                          <span className="text-slate-300 text-sm italic">Not yet</span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        {rec.formatted_duration && rec.formatted_duration !== "—" ? (
                          <div className="flex items-center gap-1.5">
                            <Timer className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-sm text-slate-600 font-medium">
                              {rec.formatted_duration}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-300 text-sm">—</span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <Badge className={`${STATUS_COLORS[rec.status]} border text-xs font-semibold px-2.5 py-1 flex items-center gap-1 w-fit`}>
                          {rec.status === "checked_in"
                            ? <LogIn  className="w-3 h-3" />
                            : <LogOut className="w-3 h-3" />}
                          {rec.status?.replace("_", " ")}
                        </Badge>
                      </td>

                      <td className="px-5 py-4 max-w-[160px]">
                        <span className="text-sm text-slate-500 truncate block">
                          {rec.remarks || <span className="text-slate-300">—</span>}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                          {isActive && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost" size="icon"
                                  onClick={() => setCheckOutRec(rec)}
                                  className="h-8 w-8 rounded-lg text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50">
                                  <LogOut className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Check Out</TooltipContent>
                            </Tooltip>
                          )}

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon"
                                className="h-8 w-8 rounded-lg text-slate-400 hover:text-[#0f2d5e] hover:bg-[#0f2d5e]/5">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44 rounded-xl border-slate-100 shadow-lg p-1">
                              {isActive && (
                                <>
                                  <DropdownMenuItem
                                    onClick={() => setCheckOutRec(rec)}
                                    className="rounded-lg text-emerald-700 focus:bg-emerald-50 gap-2 cursor-pointer text-sm">
                                    <LogOut className="w-3.5 h-3.5" /> Check Out
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator className="bg-slate-100 my-1" />
                                </>
                              )}
                              <DropdownMenuItem
                                onClick={() => setDeleteTarget(rec)}
                                className="rounded-lg text-red-600 focus:bg-red-50 focus:text-red-600 gap-2 cursor-pointer text-sm">
                                <Trash2 className="w-3.5 h-3.5" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-400">
            <span>
              Showing <strong className="text-slate-600">{filtered.length}</strong> of{" "}
              <strong className="text-slate-600">{total}</strong> records
              {(filterType !== "all" || filterStatus !== "all" || search) && " (filtered)"}
            </span>
            <span>
              <strong className="text-slate-600">{qrCount}</strong> QR ·{" "}
              <strong className="text-slate-600">{rfidCount}</strong> RFID ·{" "}
              <strong className="text-slate-600">{manualCount}</strong> manual
            </span>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ManualCheckInModal
        open={checkInOpen}
        onClose={() => setCheckInOpen(false)}
        onSaved={fetchAttendance}
        events={events}
        students={students}
        defaultEventId={selectedEvent}
      />
      <ManualCheckOutModal
        open={Boolean(checkOutRec)}
        onClose={() => setCheckOutRec(null)}
        onSaved={fetchAttendance}
        record={checkOutRec}
      />
      <DeleteDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        record={deleteTarget}
      />
    </TooltipProvider>
  );
}