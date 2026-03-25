import React from 'react';
import { Calendar } from 'lucide-react';
import { useSchoolYear } from '@/context/SchoolYearContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function SchoolYearSelector() {
  const { schoolYears, selectedYearId, setSelectedYearId, loading } = useSchoolYear();

  if (loading) {
    return (
      <div className="h-9 w-32 bg-slate-100 animate-pulse rounded-lg" />
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Select 
        value={selectedYearId?.toString()} 
        onValueChange={(val) => setSelectedYearId(parseInt(val))}
      >
        <SelectTrigger className="w-[140px] h-9 bg-slate-50 border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:ring-[#0f2d5e]">
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-[#0f2d5e]" />
            <SelectValue placeholder="School Year" />
          </div>
        </SelectTrigger>
        <SelectContent className="rounded-xl border-slate-200 shadow-xl">
          {schoolYears.map((year) => (
            <SelectItem 
                key={year.id} 
                value={year.id.toString()}
                className="text-xs font-medium focus:bg-slate-50 focus:text-[#0f2d5e] rounded-lg"
            >
              S.Y. {year.name}
              {year.is_active && (
                <span className="ml-2 inline-flex items-center rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                    Active
                </span>
              )}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
