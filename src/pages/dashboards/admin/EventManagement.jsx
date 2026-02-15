import { useEffect, useState } from "react";
import axios from "axios";
import {
  Calendar, Plus, Loader2, Trash2, Pencil, Search, X,
  RefreshCw, MoreHorizontal, Users, Clock, AlertTriangle,
  CheckCircle2, TrendingUp, MapPin, FileText, Activity,
  Building2, Globe, QrCode, Eye
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
  organization_id: "",
  title: "",
  description: "",
  event_date: "",
  event_time: "",
  location: "",
  status: "upcoming",
};

const STATUS_COLORS = {
  upcoming: "bg-blue-50 text-blue-700 border-blue-200",
  ongoing: "bg-green-50 text-green-700 border-green-200",
  completed: "bg-slate-100 text-slate-600 border-slate-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
};

const STATUS_ICONS = {
  upcoming: Clock,
  ongoing: Activity,
  completed: CheckCircle2,
  cancelled: X,
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

// ── Event Form Modal ───────────────────────────────────────────────────────
function EventFormModal({ open, onClose, onSaved, editEvent, organizations }) {
  const isEdit = Boolean(editEvent);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // DEBUG: Log when organizations change
  useEffect(() => {
    console.log('📋 Organizations in modal:', {
      count: organizations?.length || 0,
      organizations: organizations,
      sample: organizations?.[0]
    });
  }, [organizations]);

  useEffect(() => {
    if (!open) return;
    if (editEvent) {
      setForm({
        organization_id: String(editEvent.organization_id ?? ""),
        title: editEvent.title ?? "",
        description: editEvent.description ?? "",
        event_date: editEvent.event_date ?? "",
        event_time: editEvent.event_time ?? "",
        location: editEvent.location ?? "",
        status: editEvent.status ?? "upcoming",
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [open, editEvent]);

  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e?.target?.value ?? e }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = isEdit
        ? await axios.put(`/api/events/${editEvent.id}`, form, authH())
        : await axios.post("/api/events", form, authH());
      
      toast.success(isEdit ? "Event Updated!" : "Event Created!", {
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

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="bg-white border-0 shadow-2xl sm:max-w-[600px] p-0 rounded-2xl gap-0 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="bg-gradient-to-br from-[#0f2d5e] via-[#153d80] to-[#1e4db7] px-6 py-5 rounded-t-2xl sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              {isEdit ? <Pencil className="w-5 h-5 text-white" /> : <Calendar className="w-5 h-5 text-white" />}
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-white">
                {isEdit ? "Edit Event" : "Create New Event"}
              </DialogTitle>
              <DialogDescription className="text-blue-200 text-xs mt-0.5">
                {isEdit ? "Update event information" : "Add a new event to the calendar"}
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 space-y-4">
            
            <div className="space-y-1">
              <Label className="text-slate-700 font-semibold text-xs">
                Event Title <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  value={form.title}
                  onChange={set("title")}
                  placeholder="e.g. Annual Tech Conference 2024"
                  required
                  className="pl-9 border-slate-200 focus:border-[#1e4db7] bg-white h-10"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-slate-700 font-semibold text-xs">
                Organization <span className="text-red-500">*</span>
              </Label>
              <Select value={form.organization_id} onValueChange={set("organization_id")} required>
                <SelectTrigger className="border-slate-200 bg-white h-10 text-sm">
                  <SelectValue placeholder={
                    organizations.length === 0 
                      ? "No organizations available" 
                      : `Select organizing body (${organizations.length} available)`
                  } />
                </SelectTrigger>
                <SelectContent className="rounded-xl max-h-[300px]">
                  {organizations.length === 0 ? (
                    <div className="px-4 py-8 text-center text-slate-500 text-sm">
                      <p className="font-medium">No organizations found</p>
                      <p className="text-xs mt-1">Please create an organization first</p>
                    </div>
                  ) : (
                    organizations.map(org => {
                      const scope = org.scope || 'department';
                      const ScopeIcon = scope === 'department' ? Building2 : scope === 'location' ? MapPin : Globe;
                      return (
                        <SelectItem key={org.id} value={String(org.id)}>
                          <div className="flex items-center gap-2">
                            <ScopeIcon className="w-3.5 h-3.5 text-slate-500" />
                            <span>{org.name}</span>
                            {scope === 'location' && org.location && (
                              <span className="text-xs text-slate-400">({org.location})</span>
                            )}
                          </div>
                        </SelectItem>
                      );
                    })
                  )}
                </SelectContent>
              </Select>
              {organizations.length === 0 && (
                <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Create organizations first before adding events
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-slate-700 font-semibold text-xs">
                  Event Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="date"
                  value={form.event_date}
                  onChange={set("event_date")}
                  required
                  className="border-slate-200 focus:border-[#1e4db7] bg-white h-10"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-slate-700 font-semibold text-xs">
                  Event Time
                </Label>
                <Input
                  type="time"
                  value={form.event_time}
                  onChange={set("event_time")}
                  className="border-slate-200 focus:border-[#1e4db7] bg-white h-10"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-slate-700 font-semibold text-xs">
                Location
              </Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  value={form.location}
                  onChange={set("location")}
                  placeholder="e.g. University Auditorium, Room 301"
                  className="pl-9 border-slate-200 focus:border-[#1e4db7] bg-white h-10"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-slate-700 font-semibold text-xs">Status</Label>
              <Select value={form.status} onValueChange={set("status")}>
                <SelectTrigger className="border-slate-200 bg-white h-10 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="upcoming">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-blue-500" />
                      Upcoming
                    </div>
                  </SelectItem>
                  <SelectItem value="ongoing">
                    <div className="flex items-center gap-2">
                      <Activity className="w-3.5 h-3.5 text-green-500" />
                      Ongoing
                    </div>
                  </SelectItem>
                  <SelectItem value="completed">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" />
                      Completed
                    </div>
                  </SelectItem>
                  <SelectItem value="cancelled">
                    <div className="flex items-center gap-2">
                      <X className="w-3.5 h-3.5 text-red-500" />
                      Cancelled
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-slate-700 font-semibold text-xs">Description</Label>
              <Textarea
                value={form.description}
                onChange={set("description")}
                placeholder="Describe the event, agenda, and any important details..."
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
function DeleteDialog({ open, onClose, onConfirm, event }) {
  return (
    <AlertDialog open={open} onOpenChange={v => !v && onClose()}>
      <AlertDialogContent className="rounded-2xl border-0 shadow-2xl max-w-sm">
        <AlertDialogHeader>
          <div className="flex justify-center mb-3">
            <div className="w-14 h-14 rounded-2xl bg-red-50 ring-8 ring-red-50/50 flex items-center justify-center">
              <AlertTriangle className="w-7 h-7 text-red-500" />
            </div>
          </div>
          <AlertDialogTitle className="text-center text-slate-900">
            Delete this event?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center text-slate-500 text-sm">
            This will permanently delete <strong className="text-slate-700">{event?.title}</strong>. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex gap-2 mt-1">
          <AlertDialogCancel className="flex-1 rounded-xl border-slate-200">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}
            className="flex-1 rounded-xl bg-red-600 hover:bg-red-700 text-white">
            <Trash2 className="mr-2 h-4 w-4" /> Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ── QR Code Dialog ─────────────────────────────────────────────────────────
function QRCodeDialog({ open, onClose, event }) {
  if (!event) return null;

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
    JSON.stringify({
      event_id: event.id,
      title: event.title,
      date: event.event_date,
      time: event.event_time,
      location: event.location,
      qr_code: event.qr_code
    })
  )}`;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = qrUrl;
    link.download = `${event.title.replace(/[^a-z0-9]/gi, '_')}_QR.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("QR Code Downloaded", {
      description: "The QR code has been saved to your downloads."
    });
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(event.qr_code);
    toast.success("Code Copied", {
      description: "QR code string copied to clipboard."
    });
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="bg-white border-0 shadow-2xl sm:max-w-[450px] p-0 rounded-2xl gap-0">
        
        {/* Header */}
        <div className="bg-gradient-to-br from-[#0f2d5e] via-[#153d80] to-[#1e4db7] px-6 py-5 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <QrCode className="w-5 h-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-white">Event QR Code</DialogTitle>
              <DialogDescription className="text-blue-200 text-xs mt-0.5">
                Scan to view event details
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-4">
          
          {/* Event Info */}
          <div className="bg-slate-50 rounded-xl p-4 space-y-2">
            <h3 className="font-semibold text-slate-900 text-sm">{event.title}</h3>
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <Calendar className="w-3.5 h-3.5" />
              <span>{new Date(event.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
            {event.location && (
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <MapPin className="w-3.5 h-3.5" />
                <span>{event.location}</span>
              </div>
            )}
          </div>

          {/* QR Code Image */}
          <div className="flex justify-center bg-white border-2 border-slate-100 rounded-xl p-6">
            <img 
              src={qrUrl} 
              alt="Event QR Code" 
              className="w-64 h-64"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextElementSibling.style.display = 'flex';
              }}
            />
            <div className="hidden flex-col items-center justify-center w-64 h-64 bg-slate-50 rounded-lg">
              <QrCode className="w-16 h-16 text-slate-300 mb-2" />
              <p className="text-sm text-slate-500">QR Code</p>
            </div>
          </div>

          {/* QR Code String */}
          <div className="space-y-2">
            <Label className="text-slate-700 font-semibold text-xs">Unique Code</Label>
            <div className="flex items-center gap-2">
              <Input 
                value={event.qr_code} 
                readOnly 
                className="font-mono text-xs bg-slate-50 border-slate-200"
              />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopyCode}
                    className="shrink-0 h-10 w-10"
                  >
                    <FileText className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Copy Code</TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleDownload}
              className="flex-1 bg-[#0f2d5e] hover:bg-[#1e4db7] text-white"
            >
              <QrCode className="mr-2 h-4 w-4" />
              Download QR
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 border-slate-200"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function EventManagement() {
  const [events, setEvents] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterOrg, setFilterOrg] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editEvent, setEditEvent] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [qrEvent, setQrEvent] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [eventsRes, orgsRes] = await Promise.all([
        axios.get("/api/events", authH()),
        axios.get("/api/organizations", authH()),
      ]);
      
      console.log("Events loaded:", eventsRes.data);
      console.log("Organizations loaded:", orgsRes.data);
      
      setEvents(eventsRes.data);
      setOrganizations(orgsRes.data);
    } catch (err) {
      console.error("Fetch error:", err);
      console.error("Error response:", err.response?.data);
      toast.error("Error", {
        description: err.response?.data?.message || "Failed to load data. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await axios.delete(`/api/events/${deleteTarget.id}`, authH());
      toast.success("Event Deleted", {
        description: "The event has been removed successfully.",
      });
      setDeleteTarget(null);
      fetchData();
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.message || "Failed to delete event.";
      toast.error("Error", {
        description: errorMsg,
      });
    }
  };

  const total = events.length;
  const upcoming = events.filter(e => e.status === 'upcoming').length;
  const ongoing = events.filter(e => e.status === 'ongoing').length;
  const completed = events.filter(e => e.status === 'completed').length;
  const cancelled = events.filter(e => e.status === 'cancelled').length;

  const filtered = events.filter(e => {
    const q = search.toLowerCase();
    const matchSearch = !search
      || e.title?.toLowerCase().includes(q)
      || e.organization?.name?.toLowerCase().includes(q)
      || e.location?.toLowerCase().includes(q);
    const matchStatus = filterStatus === "all" || e.status === filterStatus;
    const matchOrg = filterOrg === "all" || String(e.organization_id) === filterOrg;
    return matchSearch && matchStatus && matchOrg;
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return "—";
    return new Date(`2000-01-01 ${timeStr}`).toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#0f2d5e] to-[#1e4db7] flex items-center justify-center shadow-lg shadow-[#0f2d5e]/25">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-[#0f2d5e] tracking-tight">Event Management</h1>
              <p className="text-slate-500 text-xs mt-0.5">Manage organization events and activities</p>
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
            <Button onClick={() => { setEditEvent(null); setFormOpen(true); }}
              className="bg-gradient-to-r from-[#0f2d5e] to-[#1e4db7] hover:opacity-90 text-white shadow-md shadow-[#0f2d5e]/25 rounded-xl h-9 px-4 font-semibold text-sm">
              <Plus className="mr-2 h-4 w-4" /> Add Event
            </Button>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Calendar} label="Total Events" value={total} sub={`${upcoming} upcoming`} grad="from-[#0f2d5e] to-[#1a4a8a]" />
          <StatCard icon={Clock} label="Upcoming" value={upcoming} sub="Scheduled events" grad="from-[#1e4db7] to-[#3b6fd4]" />
          <StatCard icon={Activity} label="Ongoing" value={ongoing} sub="Active right now" grad="from-[#10b981] to-[#34d399]" />
          <StatCard icon={CheckCircle2} label="Completed" value={completed} sub="Past events" grad="from-[#6366f1] to-[#818cf8]" />
        </div>

        {/* Table card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">

          {/* Toolbar */}
          <div className="px-5 py-3.5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search events..."
                  className="pl-9 pr-8 h-8 border-slate-200 bg-slate-50 focus:bg-white focus:border-[#1e4db7] text-sm rounded-xl" />
                {search && (
                  <button onClick={() => setSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-32 h-8 border-slate-200 bg-slate-50 text-sm rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="ongoing">Ongoing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterOrg} onValueChange={setFilterOrg}>
                <SelectTrigger className="w-40 h-8 border-slate-200 bg-slate-50 text-sm rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl max-h-[300px]">
                  <SelectItem value="all">All Organizations</SelectItem>
                  {organizations.map(org => (
                    <SelectItem key={org.id} value={String(org.id)}>{org.name}</SelectItem>
                  ))}
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
                  <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Event</th>
                  <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Organization</th>
                  <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Date & Time</th>
                  <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Location</th>
                  <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Status</th>
                  <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="py-24 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-[#0f2d5e]/5 flex items-center justify-center">
                          <Loader2 className="w-6 h-6 animate-spin text-[#1e4db7]" />
                        </div>
                        <span className="text-sm text-slate-400 font-medium">Loading events…</span>
                      </div>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-24 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
                          <Calendar className="w-7 h-7 text-slate-300" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-500 text-sm">No events found</p>
                          <p className="text-xs text-slate-400 mt-0.5">Try adjusting your search or create a new event</p>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => { setSearch(""); setFilterStatus("all"); setFilterOrg("all"); }}
                          className="rounded-xl border-slate-200 text-slate-600 text-xs h-8">
                          Clear filters
                        </Button>
                      </div>
                    </td>
                  </tr>
                ) : filtered.map(event => {
                  const StatusIcon = STATUS_ICONS[event.status] || Clock;
                  const orgScope = event.organization?.scope || 'department';
                  const OrgScopeIcon = orgScope === 'department' ? Building2 : orgScope === 'location' ? MapPin : Globe;
                  
                  return (
                  <tr key={event.id} className="hover:bg-blue-50/30 transition-colors group">
                    
                    {/* Event */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0f2d5e] to-[#1e4db7] flex items-center justify-center shrink-0 shadow-sm">
                          <Calendar className="w-5 h-5 text-white" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800 text-sm truncate">{event.title}</p>
                          <p className="text-xs text-slate-400 mt-0.5 truncate">{event.description || "No description"}</p>
                        </div>
                      </div>
                    </td>

                    {/* Organization */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <OrgScopeIcon className="w-4 h-4 text-slate-400 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm text-slate-600 font-medium truncate">{event.organization?.name || "—"}</p>
                          {orgScope === 'location' && event.organization?.location && (
                            <p className="text-xs text-slate-400">{event.organization.location}</p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Date & Time */}
                    <td className="px-5 py-4">
                      <div className="space-y-0.5">
                        <p className="text-sm text-slate-700 font-medium">{formatDate(event.event_date)}</p>
                        <p className="text-xs text-slate-400">{formatTime(event.event_time)}</p>
                      </div>
                    </td>

                    {/* Location */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="text-sm text-slate-600 truncate">{event.location || "TBA"}</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      <Badge className={`${STATUS_COLORS[event.status]} border text-xs font-semibold px-2.5 py-1 capitalize`}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {event.status}
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
                          <DropdownMenuItem onClick={() => { setEditEvent(event); setFormOpen(true); }}
                            className="rounded-lg text-slate-700 focus:bg-blue-50 focus:text-[#0f2d5e] gap-2 cursor-pointer text-sm">
                            <Pencil className="w-3.5 h-3.5" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setQrEvent(event)}
                            className="rounded-lg text-slate-700 focus:bg-blue-50 focus:text-[#0f2d5e] gap-2 cursor-pointer text-sm">
                            <QrCode className="w-3.5 h-3.5" /> View QR
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-slate-100 my-1" />
                          <DropdownMenuItem onClick={() => setDeleteTarget(event)}
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
              Showing <strong className="text-slate-600">{filtered.length}</strong> of <strong className="text-slate-600">{total}</strong> events
              {(filterStatus !== "all" || filterOrg !== "all" || search) && " (filtered)"}
            </span>
            <span>
              <strong className="text-slate-600">{upcoming}</strong> upcoming · <strong className="text-slate-600">{ongoing}</strong> ongoing · <strong className="text-slate-600">{completed}</strong> completed
            </span>
          </div>
        </div>
      </div>

      {/* Modals */}
      <EventFormModal
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditEvent(null); }}
        onSaved={fetchData}
        editEvent={editEvent}
        organizations={organizations}
      />
      <QRCodeDialog
        open={Boolean(qrEvent)}
        onClose={() => setQrEvent(null)}
        event={qrEvent}
      />
      <DeleteDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        event={deleteTarget}
      />
    </TooltipProvider>
  );
}