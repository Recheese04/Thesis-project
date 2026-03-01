import { useState, useRef, useCallback } from "react";
import axios from "axios";
import {
    Upload, FileSpreadsheet, CheckCircle2, AlertTriangle,
    X, Loader2, Download, Eye, ArrowRight, Users, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Dialog, DialogContent, DialogTitle, DialogDescription
} from "@/components/ui/dialog";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { toast } from "sonner";

const authH = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});

const REQUIRED_FIELDS = [
    "student_number", "first_name", "last_name", "email",
    "department_id", "course", "year_level",
];

const COLUMN_LABELS = {
    student_number: "Student No.",
    first_name: "First Name",
    middle_name: "Middle Name",
    last_name: "Last Name",
    email: "Email",
    department_id: "Department ID",
    course: "Course",
    year_level: "Year Level",
    contact_number: "Contact No.",
};

function parseCSV(text) {
    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2) return { headers: [], rows: [] };
    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_"));
    const rows = lines.slice(1).map((line) => {
        const values = line.split(",").map((v) => v.trim());
        const obj = {};
        headers.forEach((h, i) => (obj[h] = values[i] || ""));
        return obj;
    });
    return { headers, rows };
}

// ──────────────────────────────────────────────────────────────────────────────

export default function ImportStudentsModal({ open, onClose, onImported, departments }) {
    const [step, setStep] = useState(1); // 1=upload, 2=preview, 3=result
    const [file, setFile] = useState(null);
    const [csvHeaders, setCsvHeaders] = useState([]);
    const [csvRows, setCsvRows] = useState([]);
    const [columnMap, setColumnMap] = useState({});
    const [importing, setImporting] = useState(false);
    const [result, setResult] = useState(null);
    const [dragOver, setDragOver] = useState(false);
    const fileRef = useRef(null);

    const reset = () => {
        setStep(1);
        setFile(null);
        setCsvHeaders([]);
        setCsvRows([]);
        setColumnMap({});
        setResult(null);
        setImporting(false);
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    // Auto-detect column mapping
    const autoMap = useCallback((headers) => {
        const map = {};
        const aliases = {
            student_number: ["student_number", "student_no", "studentno", "student_id", "id_number", "stud_no"],
            first_name: ["first_name", "firstname", "fname", "given_name"],
            middle_name: ["middle_name", "middlename", "mname", "middle"],
            last_name: ["last_name", "lastname", "lname", "surname", "family_name"],
            email: ["email", "email_address", "e_mail"],
            department_id: ["department_id", "dept_id", "department", "dept"],
            course: ["course", "program", "course_program", "degree"],
            year_level: ["year_level", "yearlevel", "year", "level"],
            contact_number: ["contact_number", "contact", "phone", "mobile", "phone_number", "cellphone"],
        };
        for (const [field, alts] of Object.entries(aliases)) {
            const match = headers.find((h) => alts.includes(h));
            if (match) map[field] = match;
        }
        return map;
    }, []);

    const handleFile = (f) => {
        if (!f || !f.name.toLowerCase().endsWith(".csv")) {
            toast.error("Please upload a .csv file");
            return;
        }
        setFile(f);
        const reader = new FileReader();
        reader.onload = (e) => {
            const { headers, rows } = parseCSV(e.target.result);
            if (headers.length === 0) {
                toast.error("CSV file appears empty or invalid");
                return;
            }
            setCsvHeaders(headers);
            setCsvRows(rows);
            setColumnMap(autoMap(headers));
            setStep(2);
        };
        reader.readAsText(f);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        handleFile(e.dataTransfer.files[0]);
    };

    // Build mapped rows for import
    const getMappedRows = () => {
        return csvRows.map((row) => {
            const mapped = {};
            for (const [field, csvCol] of Object.entries(columnMap)) {
                mapped[field] = row[csvCol] || "";
            }
            // Auto-detect department_id from department name if needed
            if (mapped.department_id && isNaN(mapped.department_id)) {
                const dept = departments.find(
                    (d) => d.name.toLowerCase() === mapped.department_id.toLowerCase() ||
                        d.code?.toLowerCase() === mapped.department_id.toLowerCase()
                );
                mapped.department_id = dept ? dept.id : mapped.department_id;
            }
            if (mapped.department_id) mapped.department_id = Number(mapped.department_id);
            return mapped;
        });
    };

    const missingFields = REQUIRED_FIELDS.filter((f) => !columnMap[f]);

    const handleImport = async () => {
        if (missingFields.length > 0) {
            toast.error("Please map all required fields before importing");
            return;
        }

        setImporting(true);
        try {
            const mappedRows = getMappedRows();
            const res = await axios.post("/api/users/import", { students: mappedRows }, authH());
            setResult(res.data);
            setStep(3);
            if (res.data.created > 0) {
                toast.success(`${res.data.created} student(s) imported!`);
                onImported();
            }
        } catch (err) {
            const msg = err.response?.data?.message || "Import failed";
            toast.error(msg);
        } finally {
            setImporting(false);
        }
    };

    const downloadTemplate = () => {
        const headers = "student_number,first_name,middle_name,last_name,email,department_id,course,year_level,contact_number";
        const example = "2024-00001,Juan,Santos,Dela Cruz,juan@bisu.edu.ph,1,Bachelor of Science in Computer Science,1st Year,09171234567";
        const blob = new Blob([headers + "\n" + example], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "student_import_template.csv";
        a.click();
        URL.revokeObjectURL(url);
    };

    const STEPS = [
        { n: 1, label: "Upload" },
        { n: 2, label: "Preview & Map" },
        { n: 3, label: "Results" },
    ];

    return (
        <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
            <DialogContent className="bg-white border-0 shadow-2xl sm:max-w-[720px] w-full p-0 rounded-2xl gap-0 max-h-[90vh] overflow-hidden flex flex-col">

                {/* Header */}
                <div className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 px-6 py-5 rounded-t-2xl shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                            <Upload className="w-5 h-5 text-white" />
                        </div>
                        <div className="min-w-0">
                            <DialogTitle className="text-lg font-bold text-white truncate">
                                Import Students
                            </DialogTitle>
                            <DialogDescription className="text-emerald-200 text-xs mt-0.5">
                                Bulk upload from MIS CSV export
                            </DialogDescription>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 mt-4">
                        {STEPS.map(({ n, label }, i, arr) => (
                            <div key={n} className="flex items-center gap-1.5">
                                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${step === n ? "bg-white text-emerald-700" :
                                        step > n ? "bg-white/30 text-white" : "bg-white/15 text-white/50"
                                    }`}>
                                    <span className={`w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 ${step === n ? "bg-emerald-700 text-white" :
                                            step > n ? "bg-white/30 text-white" : "bg-white/20 text-white/60"
                                        }`}>{step > n ? "✓" : n}</span>
                                    {label}
                                </div>
                                {i < arr.length - 1 && <ChevronRight className="w-3 h-3 text-white/30" />}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-6 py-5">

                    {/* ── STEP 1: Upload ── */}
                    {step === 1 && (
                        <div className="space-y-4">
                            <div
                                className={`border-2 border-dashed rounded-2xl p-10 text-center transition-colors cursor-pointer ${dragOver ? "border-emerald-400 bg-emerald-50" : "border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/30"
                                    }`}
                                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                                onDragLeave={() => setDragOver(false)}
                                onDrop={handleDrop}
                                onClick={() => fileRef.current?.click()}
                            >
                                <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                                    <FileSpreadsheet className="w-8 h-8 text-emerald-500" />
                                </div>
                                <p className="text-sm font-semibold text-slate-700 mb-1">
                                    Drop your CSV file here or click to browse
                                </p>
                                <p className="text-xs text-slate-400">
                                    Supports .csv files exported from your MIS system
                                </p>
                                <input
                                    ref={fileRef}
                                    type="file"
                                    accept=".csv"
                                    className="hidden"
                                    onChange={(e) => handleFile(e.target.files[0])}
                                />
                            </div>

                            <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                                <Download className="w-4 h-4 text-blue-500 shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs text-slate-700 font-medium">Need a template?</p>
                                    <p className="text-[11px] text-slate-400">Download a sample CSV with the correct column headers</p>
                                </div>
                                <Button variant="outline" size="sm" onClick={downloadTemplate}
                                    className="border-blue-200 text-blue-600 hover:bg-blue-100 text-xs h-7 shrink-0">
                                    <Download className="w-3 h-3 mr-1" /> Template
                                </Button>
                            </div>

                            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Expected Columns</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {Object.entries(COLUMN_LABELS).map(([key, label]) => (
                                        <Badge key={key} variant="outline"
                                            className={`text-[10px] px-2 py-0.5 ${REQUIRED_FIELDS.includes(key) ? "border-emerald-200 text-emerald-700 bg-emerald-50" : "border-slate-200 text-slate-500"}`}>
                                            {label} {REQUIRED_FIELDS.includes(key) && <span className="text-red-400 ml-0.5">*</span>}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── STEP 2: Preview & Map ── */}
                    {step === 2 && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-semibold text-slate-800">
                                        <FileSpreadsheet className="w-4 h-4 inline mr-1.5 text-emerald-500" />
                                        {file?.name}
                                    </p>
                                    <p className="text-xs text-slate-400 mt-0.5">{csvRows.length} row(s) detected</p>
                                </div>
                                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 border text-xs">
                                    {csvHeaders.length} columns
                                </Badge>
                            </div>

                            {/* Column Mapping */}
                            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-3">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                                    <Eye className="w-3 h-3" /> Column Mapping
                                </p>
                                <div className="grid grid-cols-2 gap-2">
                                    {Object.entries(COLUMN_LABELS).map(([field, label]) => (
                                        <div key={field} className="flex items-center gap-2">
                                            <span className={`text-xs font-medium w-24 shrink-0 ${REQUIRED_FIELDS.includes(field) ? "text-slate-700" : "text-slate-400"}`}>
                                                {label} {REQUIRED_FIELDS.includes(field) && <span className="text-red-400">*</span>}
                                            </span>
                                            <Select value={columnMap[field] || "__none__"} onValueChange={(v) => setColumnMap((p) => ({ ...p, [field]: v === "__none__" ? undefined : v }))}>
                                                <SelectTrigger className="h-7 text-xs border-slate-200 bg-white flex-1">
                                                    <SelectValue placeholder="—" />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-lg max-h-48">
                                                    <SelectItem value="__none__" className="text-xs text-slate-400">— Not mapped —</SelectItem>
                                                    {csvHeaders.map((h) => (
                                                        <SelectItem key={h} value={h} className="text-xs">{h}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {columnMap[field] ? (
                                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                            ) : REQUIRED_FIELDS.includes(field) ? (
                                                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                            ) : <div className="w-3.5" />}
                                        </div>
                                    ))}
                                </div>
                                {missingFields.length > 0 && (
                                    <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                                        <p className="text-xs text-slate-600">
                                            Missing required: <strong>{missingFields.map(f => COLUMN_LABELS[f]).join(", ")}</strong>
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Preview Table */}
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                                    Data Preview (first 5 rows)
                                </p>
                                <div className="border border-slate-200 rounded-xl overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-xs">
                                            <thead>
                                                <tr className="bg-slate-50 border-b border-slate-100">
                                                    <th className="px-3 py-2 text-left text-[10px] font-bold text-slate-400 uppercase">#</th>
                                                    {csvHeaders.slice(0, 8).map((h) => (
                                                        <th key={h} className="px-3 py-2 text-left text-[10px] font-bold text-slate-400 uppercase whitespace-nowrap">{h}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                                {csvRows.slice(0, 5).map((row, i) => (
                                                    <tr key={i} className="hover:bg-blue-50/30">
                                                        <td className="px-3 py-2 text-slate-400">{i + 1}</td>
                                                        {csvHeaders.slice(0, 8).map((h) => (
                                                            <td key={h} className="px-3 py-2 text-slate-600 whitespace-nowrap max-w-[150px] truncate">{row[h] || "—"}</td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                                {csvRows.length > 5 && (
                                    <p className="text-[11px] text-slate-400 mt-1.5 text-center">
                                        … and {csvRows.length - 5} more row(s)
                                    </p>
                                )}
                            </div>

                            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
                                <Users className="w-4 h-4 text-emerald-600 shrink-0" />
                                <p className="text-xs text-slate-700">
                                    Default password for each student: <code className="bg-white px-1.5 py-0.5 rounded text-emerald-700 font-mono text-[11px]">bisu_[student_number]</code>
                                </p>
                            </div>
                        </div>
                    )}

                    {/* ── STEP 3: Results ── */}
                    {step === 3 && result && (
                        <div className="space-y-4">
                            <div className="text-center py-4">
                                <div className={`w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center ${result.created > 0 ? "bg-emerald-50" : "bg-amber-50"
                                    }`}>
                                    {result.created > 0 ? (
                                        <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                                    ) : (
                                        <AlertTriangle className="w-8 h-8 text-amber-500" />
                                    )}
                                </div>
                                <h3 className="text-lg font-bold text-slate-800 mb-1">{result.message}</h3>
                                <p className="text-sm text-slate-500">
                                    {result.total} row(s) processed
                                </p>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-center">
                                    <p className="text-2xl font-extrabold text-emerald-600">{result.created}</p>
                                    <p className="text-xs text-slate-500 mt-1">Created</p>
                                </div>
                                <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-center">
                                    <p className="text-2xl font-extrabold text-amber-600">{result.skipped?.length || 0}</p>
                                    <p className="text-xs text-slate-500 mt-1">Skipped</p>
                                </div>
                                <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-center">
                                    <p className="text-2xl font-extrabold text-red-600">{result.errors?.length || 0}</p>
                                    <p className="text-xs text-slate-500 mt-1">Errors</p>
                                </div>
                            </div>

                            {result.skipped?.length > 0 && (
                                <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                                    <p className="text-xs font-bold text-amber-700 mb-2">Skipped Rows (duplicates)</p>
                                    <div className="space-y-1 max-h-32 overflow-y-auto">
                                        {result.skipped.map((s, i) => (
                                            <p key={i} className="text-[11px] text-slate-600">
                                                Row {s.row}: {s.reason}
                                            </p>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {result.errors?.length > 0 && (
                                <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                                    <p className="text-xs font-bold text-red-700 mb-2">Errors</p>
                                    <div className="space-y-1 max-h-32 overflow-y-auto">
                                        {result.errors.map((e, i) => (
                                            <p key={i} className="text-[11px] text-slate-600">
                                                Row {e.row}: {e.reason}
                                            </p>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 rounded-b-2xl flex items-center justify-between gap-3 shrink-0">
                    <span className="text-xs text-slate-400">
                        {step === 2 && `${csvRows.length} students ready`}
                        {step === 3 && "Import complete"}
                    </span>
                    <div className="flex gap-2">
                        {step === 1 && (
                            <Button variant="outline" onClick={handleClose}
                                className="border-slate-200 text-slate-600 h-9">
                                Cancel
                            </Button>
                        )}
                        {step === 2 && (
                            <>
                                <Button variant="outline" onClick={() => { setStep(1); setFile(null); }}
                                    className="border-slate-200 text-slate-600 h-9">
                                    Back
                                </Button>
                                <Button onClick={handleImport} disabled={importing || missingFields.length > 0}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white h-9 min-w-[140px]">
                                    {importing ? (
                                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Importing…</>
                                    ) : (
                                        <><Upload className="mr-2 h-4 w-4" />Import {csvRows.length} Students</>
                                    )}
                                </Button>
                            </>
                        )}
                        {step === 3 && (
                            <Button onClick={handleClose}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white h-9">
                                <CheckCircle2 className="mr-2 h-4 w-4" /> Done
                            </Button>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
