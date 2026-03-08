import React from 'react';
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";

export default function ReportFilters({ dateRange, onDateRangeChange, company }) {
    const handleDateChange = (range) => {
        onDateRangeChange(range);
    };

    return (
        <div className="p-4 rounded-xl glass-card border-white/20 flex items-center justify-between">
            <div className="text-sm text-gray-600">
                Displaying reports for <span className="font-semibold text-slate-800">{company?.name}</span>
            </div>
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="outline">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange.from ? (
                            dateRange.to ? (
                                `${format(dateRange.from, "LLL dd, y")} - ${format(dateRange.to, "LLL dd, y")}`
                            ) : (
                                format(dateRange.from, "LLL dd, y")
                            )
                        ) : (
                            <span>Pick a date</span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                    <Calendar
                        mode="range"
                        selected={dateRange}
                        onSelect={onDateRangeChange}
                        initialFocus
                    />
                </PopoverContent>
            </Popover>
        </div>
    );
}