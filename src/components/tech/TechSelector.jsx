import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Users } from "lucide-react";

/**
 * Admin/owner tech picker for the Tech Portal. Default value is "all" (all techs).
 * props: workers (Worker[]), value, onChange
 */
export default function TechSelector({ workers, value, onChange }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#CBAE63]/12 text-[#E1C67D] ring-1 ring-[#CBAE63]/20">
        <Users className="h-5 w-5" />
      </div>
      <div className="flex-1 max-w-sm">
        <Label className="text-[11px] uppercase tracking-[0.28em] text-[#CBAE63]/80">Viewing</Label>
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger className="mt-1 bg-white/5 border-white/10 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All techs</SelectItem>
            {workers.map((w) => (
              <SelectItem key={w.id} value={w.email}>
                {w.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}