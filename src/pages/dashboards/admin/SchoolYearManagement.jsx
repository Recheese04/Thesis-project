import { useEffect, useState } from "react";
import axios from "axios";
import { 
  Calendar, Plus, Loader2, Trash2, Pencil, CheckCircle2, 
  RefreshCw, AlertTriangle, ShieldCheck, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useSchoolYear } from "@/context/SchoolYearContext";

const authH = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});

export default function SchoolYearManagement() {
  const [years, setYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editYear, setEditYear] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  
  const [form, setForm] = useState({ name: "", is_active: false });
  const { fetchSchoolYears } = useSchoolYear();

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/school-years", authH());
      setYears(res.data);
    } catch (err) {
      toast.error("Failed to load school years.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (year = null) => {
    if (year) {
      setEditYear(year);
      setForm({ name: year.name, is_active: Boolean(year.is_active) });
    } else {
      setEditYear(null);
      setForm({ name: "", is_active: false });
    }
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editYear) {
        await axios.put(`/api/school-years/${editYear.id}`, form, authH());
        toast.success("Academic year updated.");
      } else {
        await axios.post("/api/school-years", form, authH());
        toast.success("New academic year created.");
      }
      setModalOpen(false);
      fetchData();
      fetchSchoolYears(); // Update global context
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await axios.delete(`/api/school-years/${deleteTarget.id}`, authH());
      toast.success("Academic year deleted.");
      setDeleteTarget(null);
      fetchData();
      fetchSchoolYears();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete.");
    }
  };

  const handleSetStatus = async (year, active) => {
    try {
      await axios.put(`/api/school-years/${year.id}`, { ...year, is_active: active }, authH());
      toast.success(active ? `Set ${year.name} as Active.` : `Set ${year.name} as Inactive.`);
      fetchData();
      fetchSchoolYears();
    } catch (err) {
      toast.error("Failed to update status.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#0f2d5e] to-[#1e4db7] flex items-center justify-center shadow-lg">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-[#0f2d5e] tracking-tight">Academic Years</h1>
            <p className="text-slate-500 text-xs mt-0.5">Manage school years and set the active academic period</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={fetchData} disabled={loading}
            className="border-slate-200 text-slate-600 h-9 w-9 rounded-xl">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button onClick={() => handleOpenModal()}
            className="bg-[#0f2d5e] hover:bg-[#1e4db7] text-white rounded-xl h-9 px-4 font-semibold text-sm">
            <Plus className="mr-2 h-4 w-4" /> Add Year
          </Button>
        </div>
      </div>

      {/* List Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="px-6 py-4 font-bold text-slate-400 uppercase tracking-wider text-[11px]">Academic Year</th>
              <th className="px-6 py-4 font-bold text-slate-400 uppercase tracking-wider text-[11px]">Status</th>
              <th className="px-6 py-4 font-bold text-slate-400 uppercase tracking-wider text-[11px] text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr>
                <td colSpan="3" className="py-20 text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-[#1e4db7] mx-auto mb-2" />
                  <span className="text-slate-400">Loading academic years...</span>
                </td>
              </tr>
            ) : years.length === 0 ? (
              <tr>
                <td colSpan="3" className="py-20 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Calendar className="w-10 h-10 text-slate-200" />
                    <p className="text-slate-400">No academic years found.</p>
                  </div>
                </td>
              </tr>
            ) : (
              years.map((y) => (
                <tr key={y.id} className="hover:bg-blue-50/30 transition-colors group">
                  <td className="px-6 py-4">
                    <span className="font-semibold text-slate-800">{y.name}</span>
                  </td>
                  <td className="px-6 py-4">
                    {y.is_active ? (
                      <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1.5 px-3 py-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Active Period
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-slate-400 border-slate-200 px-3 py-1 cursor-pointer hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-all"
                             onClick={() => handleSetStatus(y, true)}>
                        Inactive
                      </Badge>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenModal(y)}
                              className="h-8 w-8 text-slate-400 hover:text-blue-600 rounded-lg">
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(y)}
                              className="h-8 w-8 text-slate-400 hover:text-red-600 rounded-lg">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Upsert Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[400px] p-0 rounded-2xl overflow-hidden border-0 shadow-2xl">
          <div className="bg-[#0f2d5e] p-6 text-white">
            <DialogTitle className="text-xl font-bold">
              {editYear ? "Edit Academic Year" : "New Academic Year"}
            </DialogTitle>
            <DialogDescription className="text-blue-200 text-xs mt-1">
              {editYear ? "Modify the academic year details" : "Add a new period to the system"}
            </DialogDescription>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-4 bg-white">
            <div className="space-y-1.5">
              <Label className="text-slate-700 font-semibold text-xs">Year Name <span className="text-red-500">*</span></Label>
              <Input 
                value={form.name}
                onChange={(e) => setForm({...form, name: e.target.value})}
                placeholder="e.g. 2025-2026"
                required
                className="border-slate-200 focus:ring-[#1e4db7]"
              />
            </div>
            <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100">
               <input 
                type="checkbox" 
                id="is_active" 
                checked={form.is_active}
                onChange={(e) => setForm({...form, is_active: e.target.checked})}
                className="w-4 h-4 rounded border-slate-300 text-[#1e4db7] focus:ring-[#1e4db7]"
               />
               <div className="space-y-0.5">
                 <Label htmlFor="is_active" className="text-sm font-bold text-slate-700 cursor-pointer">Set as Active Year</Label>
                 <p className="text-[10px] text-slate-400">Only one academic year can be active at a time.</p>
               </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)} className="flex-1 rounded-xl">
                Cancel
              </Button>
              <Button type="submit" disabled={saving} className="flex-1 bg-[#0f2d5e] hover:bg-[#1e4db7] text-white rounded-xl shadow-md">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                {editYear ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-2xl border-0 shadow-2xl">
          <AlertDialogHeader>
            <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
              <AlertTriangle className="w-7 h-7 text-red-500" />
            </div>
            <AlertDialogTitle className="text-xl font-bold">Delete Academic Year?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500">
              Are you sure you want to delete <strong className="text-slate-900">{deleteTarget?.name}</strong>? 
              This may affect events and clearances associated with this period.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 gap-3">
            <AlertDialogCancel className="rounded-xl flex-1">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white rounded-xl flex-1">
              Delete Period
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
