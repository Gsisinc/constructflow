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
  isToday,
  startOfDay,
  endOfDay,
  startOfYear,
  endOfYear,
  eachMonthOfInterval
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

  const navigateCalendar = (direction) => {
    if (viewMode === 'day') {
      setCurrentDate(addDays(currentDate, direction));
    } else if (viewMode === 'week') {
      setCurrentDate(addDays(currentDate, direction * 7));
    } else if (viewMode === 'month') {
      setCurrentDate(addMonths(currentDate, direction));
    } else if (viewMode === 'year') {
      setCurrentDate(addMonths(currentDate, direction * 12));
    }
  };

  const filteredEvents = events.filter(event => 
    selectedLocation === 'all' || event.location === selectedLocation
  );

  const getEventsForDate = (date) => {
    return filteredEvents.filter(event => 
      isSameDay(new Date(event.start_date), date)
    );
  };

  const renderDayView = () => {
    const dayEvents = getEventsForDate(currentDate);
    return (
      <div className="p-4 min-h-[500px]">
        <div className="mb-4">
          <h3 className="text-lg font-semibold">{format(currentDate, 'EEEE, MMMM d, yyyy')}</h3>
        </div>
        {dayEvents.length === 0 ? (
          <p className="text-slate-500 text-center py-12">No events scheduled</p>
        ) : (
          <div className="space-y-2">
            {dayEvents.map(event => {
              const Icon = eventTypeIcons[event.event_type] || Clock;
              return (
                <div
                  key={event.id}
                  onClick={() => onEventClick?.(event)}
                  className={cn("p-4 rounded-lg border cursor-pointer hover:shadow-md transition-all", eventTypeColors[event.event_type])}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5" />
                    <div className="flex-1">
                      <p className="font-semibold">{event.title}</p>
                      {event.start_time && <p className="text-sm">{event.start_time} - {event.end_time}</p>}
                      {event.location && <p className="text-sm flex items-center gap-1 mt-1"><MapPin className="h-3 w-3" />{event.location}</p>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate);
    const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    
    return (
      <div className="grid grid-cols-7">
        {days.map(day => {
          const dayEvents = getEventsForDate(day);
          return (
            <div
              key={day.toString()}
              onClick={() => onDateClick?.(day)}
              className={cn(
                "min-h-[400px] p-2 border-r border-slate-100 cursor-pointer hover:bg-slate-50",
                isToday(day) && "bg-blue-50"
              )}
            >
              <div className={cn("text-center mb-2 pb-2 border-b", isToday(day) && "border-blue-300")}>
                <div className="text-xs text-slate-500">{format(day, 'EEE')}</div>
                <div className={cn("text-lg font-semibold", isToday(day) && "text-blue-600")}>{format(day, 'd')}</div>
              </div>
              <div className="space-y-1">
                {dayEvents.map(event => {
                  const Icon = eventTypeIcons[event.event_type] || Clock;
                  return (
                    <div
                      key={event.id}
                      onClick={(e) => { e.stopPropagation(); onEventClick?.(event); }}
                      className={cn("text-xs p-1.5 rounded border", eventTypeColors[event.event_type])}
                    >
                      <div className="flex items-center gap-1">
                        <Icon className="h-3 w-3" />
                        <span className="truncate">{event.title}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderMonthView = () => {
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

  const renderYearView = () => {
    const yearStart = startOfYear(currentDate);
    const yearEnd = endOfYear(currentDate);
    const months = eachMonthOfInterval({ start: yearStart, end: yearEnd });

    return (
      <div className="grid grid-cols-3 gap-4 p-4">
        {months.map(month => {
          const monthEvents = filteredEvents.filter(event => {
            const eventDate = new Date(event.start_date);
            return eventDate.getMonth() === month.getMonth() && eventDate.getFullYear() === month.getFullYear();
          });

          return (
            <div
              key={month.toString()}
              onClick={() => { setCurrentDate(month); }}
              className="border border-slate-200 rounded-lg p-3 hover:bg-slate-50 cursor-pointer"
            >
              <h4 className="font-semibold text-center mb-2">{format(month, 'MMMM')}</h4>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{monthEvents.length}</p>
                <p className="text-xs text-slate-500">events</p>
              </div>
              <div className="mt-2 space-y-1">
                {Object.entries(eventTypeColors).map(([type]) => {
                  const count = monthEvents.filter(e => e.event_type === type).length;
                  if (count === 0) return null;
                  return (
                    <div key={type} className="flex justify-between text-xs">
                      <span className="capitalize text-slate-600">{type.replace('_', ' ')}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const getHeaderTitle = () => {
    if (viewMode === 'day') return format(currentDate, 'MMMM d, yyyy');
    if (viewMode === 'week') return `Week of ${format(startOfWeek(currentDate), 'MMM d, yyyy')}`;
    if (viewMode === 'month') return format(currentDate, 'MMMM yyyy');
    if (viewMode === 'year') return format(currentDate, 'yyyy');
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
                onClick={() => navigateCalendar(-1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h3 className="text-lg font-semibold text-slate-900 min-w-[200px] text-center">
                {getHeaderTitle()}
              </h3>
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigateCalendar(1)}
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

      {/* Calendar Content */}
      {viewMode === 'day' && renderDayView()}
      {viewMode === 'week' && (
        <>
          <div className="grid grid-cols-7 border-b border-slate-200">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-2 text-center text-sm font-medium text-slate-500 bg-slate-50">
                {day}
              </div>
            ))}
          </div>
          {renderWeekView()}
        </>
      )}
      {viewMode === 'month' && (
        <>
          <div className="grid grid-cols-7 border-b border-slate-200">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-2 text-center text-sm font-medium text-slate-500 bg-slate-50">
                {day}
              </div>
            ))}
          </div>
          <div>{renderMonthView()}</div>
        </>
      )}
      {viewMode === 'year' && renderYearView()}

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