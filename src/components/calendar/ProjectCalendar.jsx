import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  MapPin,
  User,
  Truck,
  AlertTriangle,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  addDays, 
  addMonths,
  isSameMonth,
  isSameDay,
  isToday
} from 'date-fns';

const eventTypeColors = {
  task: 'bg-blue-100 text-blue-700 border-blue-200',
  milestone: 'bg-purple-100 text-purple-700 border-purple-200',
  inspection: 'bg-amber-100 text-amber-700 border-amber-200',
  delivery: 'bg-green-100 text-green-700 border-green-200',
  meeting: 'bg-slate-100 text-slate-700 border-slate-200',
  permit: 'bg-red-100 text-red-700 border-red-200',
  weather_hold: 'bg-cyan-100 text-cyan-700 border-cyan-200',
};

const eventTypeIcons = {
  task: Clock,
  milestone: CheckCircle2,
  inspection: AlertTriangle,
  delivery: Truck,
  meeting: User,
  permit: CalendarIcon,
  weather_hold: AlertTriangle,
};

export default function ProjectCalendar({ 
  events = [], 
  viewMode = 'month',
  locationFilter = 'all',
  onEventClick,
  onDateClick,
  locations = []
}) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedLocation, setSelectedLocation] = useState(locationFilter);

  const filteredEvents = events.filter(event => 
    selectedLocation === 'all' || event.location === selectedLocation
  );

  const getEventsForDate = (date) => {
    return filteredEvents.filter(event => 
      isSameDay(new Date(event.start_date), date)
    );
  };

  const renderCalendarDays = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const dayEvents = getEventsForDate(day);
        const formattedDate = format(day, 'd');
        const currentDay = day;

        days.push(
          <div
            key={day.toString()}
            onClick={() => onDateClick?.(currentDay)}
            className={cn(
              "min-h-24 p-1 border-b border-r border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors",
              !isSameMonth(day, monthStart) && "bg-slate-50/50 text-slate-400",
              isToday(day) && "bg-blue-50"
            )}
          >
            <div className={cn(
              "text-sm font-medium mb-1",
              isToday(day) && "text-blue-600"
            )}>
              {formattedDate}
            </div>
            <div className="space-y-1">
              {dayEvents.slice(0, 3).map((event) => {
                const Icon = eventTypeIcons[event.event_type] || Clock;
                return (
                  <div
                    key={event.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick?.(event);
                    }}
                    className={cn(
                      "text-xs p-1 rounded border truncate flex items-center gap-1",
                      eventTypeColors[event.event_type]
                    )}
                  >
                    <Icon className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">{event.title}</span>
                  </div>
                );
              })}
              {dayEvents.length > 3 && (
                <div className="text-xs text-slate-500 pl-1">
                  +{dayEvents.length - 3} more
                </div>
              )}
            </div>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div key={day.toString()} className="grid grid-cols-7">
          {days}
        </div>
      );
      days = [];
    }

    return rows;
  };

  const hasConflicts = filteredEvents.some(e => e.conflicts?.length > 0);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentDate(addMonths(currentDate, -1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h3 className="text-lg font-semibold text-slate-900 min-w-[160px] text-center">
                {format(currentDate, 'MMMM yyyy')}
              </h3>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentDate(addMonths(currentDate, 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(new Date())}
            >
              Today
            </Button>
          </div>

          <div className="flex items-center gap-3">
            {hasConflicts && (
              <Badge className="bg-red-100 text-red-700 border-red-200">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Conflicts detected
              </Badge>
            )}
            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
              <SelectTrigger className="w-48">
                <MapPin className="h-4 w-4 mr-2 text-slate-400" />
                <SelectValue placeholder="Filter by location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {locations.map(loc => (
                  <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 border-b border-slate-200">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="p-2 text-center text-sm font-medium text-slate-500 bg-slate-50">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div>
        {renderCalendarDays()}
      </div>

      {/* Legend */}
      <div className="p-4 border-t border-slate-200 bg-slate-50">
        <div className="flex flex-wrap gap-3">
          {Object.entries(eventTypeColors).map(([type, color]) => {
            const Icon = eventTypeIcons[type];
            return (
              <div key={type} className="flex items-center gap-1.5">
                <div className={cn("w-3 h-3 rounded border", color)} />
                <span className="text-xs text-slate-600 capitalize">{type.replace('_', ' ')}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}