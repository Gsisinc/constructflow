import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronLeft, ChevronRight, Plus, Eye, EyeOff, Pencil, Trash2 } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { toast } from 'sonner';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export default function OutlookCalendar({ projectId }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showCalendarDialog, setShowCalendarDialog] = useState(false);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [editingCalendar, setEditingCalendar] = useState(null);
  const queryClient = useQueryClient();

  const { data: calendars = [] } = useQuery({
    queryKey: ['projectCalendars', projectId],
    queryFn: () => base44.entities.ProjectCalendar.filter({ project_id: projectId }),
    enabled: !!projectId
  });

  const { data: events = [] } = useQuery({
    queryKey: ['calendarEvents', projectId],
    queryFn: () => base44.entities.CalendarEvent.filter({ project_id: projectId }),
    enabled: !!projectId
  });

  const createCalendarMutation = useMutation({
    mutationFn: (data) => base44.entities.ProjectCalendar.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectCalendars'] });
      setShowCalendarDialog(false);
      setEditingCalendar(null);
      toast.success('Calendar created');
    }
  });

  const updateCalendarMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ProjectCalendar.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectCalendars'] });
      setShowCalendarDialog(false);
      setEditingCalendar(null);
      toast.success('Calendar updated');
    }
  });

  const deleteCalendarMutation = useMutation({
    mutationFn: (id) => base44.entities.ProjectCalendar.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectCalendars'] });
      queryClient.invalidateQueries({ queryKey: ['calendarEvents'] });
      toast.success('Calendar deleted');
    }
  });

  const toggleCalendarVisibility = useMutation({
    mutationFn: ({ id, isVisible }) => base44.entities.ProjectCalendar.update(id, { is_visible: isVisible }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectCalendars'] });
    }
  });

  const createEventMutation = useMutation({
    mutationFn: (data) => base44.entities.CalendarEvent.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendarEvents'] });
      setShowEventDialog(false);
      setSelectedDate(null);
      toast.success('Event created');
    }
  });

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const visibleCalendars = calendars.filter(c => c.is_visible);
  const visibleEvents = events.filter(e => visibleCalendars.some(c => c.id === e.calendar_id));

  const getEventsForDay = (day) => {
    return visibleEvents.filter(e => isSameDay(new Date(e.start_date), day));
  };

  const [calendarForm, setCalendarForm] = useState({ calendar_name: '', color: COLORS[0], description: '' });
  
  const handleEditCalendar = (calendar) => {
    setEditingCalendar(calendar);
    setCalendarForm({
      calendar_name: calendar.calendar_name,
      color: calendar.color,
      description: calendar.description || ''
    });
    setShowCalendarDialog(true);
  };

  const handleSaveCalendar = () => {
    if (editingCalendar) {
      updateCalendarMutation.mutate({ id: editingCalendar.id, data: calendarForm });
    } else {
      createCalendarMutation.mutate({ project_id: projectId, ...calendarForm });
    }
  };
  const [eventForm, setEventForm] = useState({
    calendar_id: '',
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    start_time: '',
    end_time: '',
    location: '',
    all_day: false
  });

  return (
    <div className="space-y-4">
      {/* Header with Calendar Controls */}
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button size="icon" variant="outline" onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-xl font-semibold min-w-[200px] text-center">
              {format(currentDate, 'MMMM yyyy')}
            </h2>
            <Button size="icon" variant="outline" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={() => setCurrentDate(new Date())}>
              Today
            </Button>
          </div>
        </div>
        <div className="flex gap-2">
          <Dialog open={showCalendarDialog} onOpenChange={(open) => {
            setShowCalendarDialog(open);
            if (!open) {
              setEditingCalendar(null);
              setCalendarForm({ calendar_name: '', color: COLORS[0], description: '' });
            }
          }}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                New Calendar
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingCalendar ? 'Edit Calendar' : 'Create Calendar'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Calendar Name</Label>
                  <Input
                    value={calendarForm.calendar_name}
                    onChange={(e) => setCalendarForm({ ...calendarForm, calendar_name: e.target.value })}
                    placeholder="e.g., Inspections, Deliveries"
                  />
                </div>
                <div>
                  <Label>Description (Optional)</Label>
                  <Input
                    value={calendarForm.description}
                    onChange={(e) => setCalendarForm({ ...calendarForm, description: e.target.value })}
                    placeholder="Calendar description"
                  />
                </div>
                <div>
                  <Label>Color</Label>
                  <div className="flex gap-2 flex-wrap mt-2">
                    {COLORS.map(color => (
                      <button
                        key={color}
                        className="w-8 h-8 rounded border-2"
                        style={{ 
                          backgroundColor: color,
                          borderColor: calendarForm.color === color ? '#000' : 'transparent'
                        }}
                        onClick={() => setCalendarForm({ ...calendarForm, color })}
                      />
                    ))}
                  </div>
                </div>
                <Button onClick={handleSaveCalendar} className="w-full">
                  {editingCalendar ? 'Update' : 'Create'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Calendar Toggles */}
      {calendars.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Calendars</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {calendars.map(cal => (
                <div key={cal.id} className="flex items-center gap-1 px-3 py-2 rounded-lg border bg-white">
                  <button
                    onClick={() => toggleCalendarVisibility.mutate({ id: cal.id, isVisible: !cal.is_visible })}
                    className="flex items-center gap-2 hover:opacity-70 transition-opacity"
                  >
                    {cal.is_visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: cal.color }} />
                    <span className="text-sm">{cal.calendar_name}</span>
                  </button>
                  <div className="flex items-center gap-1 ml-2 border-l pl-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={() => handleEditCalendar(cal)}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => {
                        if (confirm('Delete this calendar and all its events?')) {
                          deleteCalendarMutation.mutate(cal.id);
                        }
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Calendar Grid */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-7 gap-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-sm font-semibold text-slate-600 py-2">
                {day}
              </div>
            ))}
            {daysInMonth.map((day, idx) => {
              const dayEvents = getEventsForDay(day);
              const isToday = isSameDay(day, new Date());
              return (
                <div
                  key={idx}
                  className={`min-h-[100px] border rounded-lg p-2 cursor-pointer hover:bg-slate-50 transition-colors ${
                    !isSameMonth(day, currentDate) ? 'opacity-50' : ''
                  } ${isToday ? 'bg-blue-50 border-blue-300' : ''}`}
                  onClick={() => {
                    setSelectedDate(day);
                    setEventForm({ ...eventForm, start_date: format(day, 'yyyy-MM-dd'), calendar_id: calendars[0]?.id || '' });
                    setShowEventDialog(true);
                  }}
                >
                  <div className={`text-sm font-medium mb-1 ${isToday ? 'text-blue-600' : ''}`}>
                    {format(day, 'd')}
                  </div>
                  <div className="space-y-1">
                    {dayEvents.slice(0, 3).map(event => {
                      const calendar = calendars.find(c => c.id === event.calendar_id);
                      return (
                        <div
                          key={event.id}
                          className="text-xs p-1 rounded truncate"
                          style={{ backgroundColor: calendar?.color + '20', color: calendar?.color }}
                          title={event.title}
                        >
                          {event.all_day ? '' : event.start_time + ' '}{event.title}
                        </div>
                      );
                    })}
                    {dayEvents.length > 3 && (
                      <div className="text-xs text-slate-500">+{dayEvents.length - 3} more</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Event Dialog */}
      <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Event {selectedDate && `- ${format(selectedDate, 'MMM d, yyyy')}`}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Calendar</Label>
              <select
                className="w-full border rounded-md p-2"
                value={eventForm.calendar_id}
                onChange={(e) => setEventForm({ ...eventForm, calendar_id: e.target.value })}
              >
                {calendars.map(cal => (
                  <option key={cal.id} value={cal.id}>{cal.calendar_name}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Title</Label>
              <Input
                value={eventForm.title}
                onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                placeholder="Event title"
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={eventForm.all_day}
                onCheckedChange={(checked) => setEventForm({ ...eventForm, all_day: checked })}
              />
              <Label>All day</Label>
            </div>
            {!eventForm.all_day && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Start Time</Label>
                  <Input
                    type="time"
                    value={eventForm.start_time}
                    onChange={(e) => setEventForm({ ...eventForm, start_time: e.target.value })}
                  />
                </div>
                <div>
                  <Label>End Time</Label>
                  <Input
                    type="time"
                    value={eventForm.end_time}
                    onChange={(e) => setEventForm({ ...eventForm, end_time: e.target.value })}
                  />
                </div>
              </div>
            )}
            <div>
              <Label>Location</Label>
              <Input
                value={eventForm.location}
                onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                placeholder="Event location"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={eventForm.description}
                onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                placeholder="Event description"
              />
            </div>
            <Button
              onClick={() => createEventMutation.mutate({ project_id: projectId, ...eventForm })}
              className="w-full"
            >
              Create Event
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}