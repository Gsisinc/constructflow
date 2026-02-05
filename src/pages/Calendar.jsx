import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import ProjectCalendar from '../components/calendar/ProjectCalendar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Plus,
  Calendar as CalendarIcon,
  MapPin,
  Clock,
  User,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const EVENT_TYPES = [
  { value: 'task', label: 'Task' },
  { value: 'milestone', label: 'Milestone' },
  { value: 'inspection', label: 'Inspection' },
  { value: 'delivery', label: 'Delivery' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'permit', label: 'Permit' },
  { value: 'weather_hold', label: 'Weather Hold' },
];

const STATUSES = [
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'rescheduled', label: 'Rescheduled' },
];

export default function Calendar() {
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [projectFilter, setProjectFilter] = useState('all');
  const queryClient = useQueryClient();

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['calendarEvents'],
    queryFn: () => base44.entities.CalendarEvent.list('-start_date'),
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.CalendarEvent.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendarEvents'] });
      setShowForm(false);
      setEditingEvent(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.CalendarEvent.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendarEvents'] });
      setShowForm(false);
      setEditingEvent(null);
    },
  });

  const filteredEvents = projectFilter === 'all' 
    ? events 
    : events.filter(e => e.project_id === projectFilter);

  const locations = [...new Set(events.map(e => e.location).filter(Boolean))];

  const conflictingEvents = events.filter(e => e.conflicts?.length > 0);

  const handleDateClick = (date) => {
    setSelectedDate(date);
    setEditingEvent(null);
    setShowForm(true);
  };

  const handleEventClick = (event) => {
    setEditingEvent(event);
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Project Calendar</h1>
          <p className="text-slate-500 mt-1">Multi-layer scheduling with conflict detection</p>
        </div>
        <div className="flex gap-3">
          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Projects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {projects.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => { setEditingEvent(null); setSelectedDate(new Date()); setShowForm(true); }} className="bg-slate-900 hover:bg-slate-800">
            <Plus className="h-4 w-4 mr-2" />
            Add Event
          </Button>
        </div>
      </div>

      {/* Conflict Alerts */}
      {conflictingEvents.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-2 text-red-700 mb-2">
            <AlertTriangle className="h-5 w-5" />
            <span className="font-medium">Schedule Conflicts Detected</span>
          </div>
          <div className="space-y-2">
            {conflictingEvents.slice(0, 3).map(event => (
              <div key={event.id} className="text-sm text-red-600">
                {event.title} - {event.start_date && format(new Date(event.start_date), 'MMM d')}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Calendar Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-sm text-slate-500">Total Events</p>
          <p className="text-2xl font-semibold mt-1">{filteredEvents.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-sm text-slate-500">Inspections</p>
          <p className="text-2xl font-semibold mt-1 text-amber-600">
            {filteredEvents.filter(e => e.event_type === 'inspection').length}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-sm text-slate-500">Deliveries</p>
          <p className="text-2xl font-semibold mt-1 text-green-600">
            {filteredEvents.filter(e => e.event_type === 'delivery').length}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-sm text-slate-500">Milestones</p>
          <p className="text-2xl font-semibold mt-1 text-purple-600">
            {filteredEvents.filter(e => e.event_type === 'milestone').length}
          </p>
        </div>
      </div>

      {/* Calendar */}
      {isLoading ? (
        <Skeleton className="h-[600px] rounded-2xl" />
      ) : (
        <ProjectCalendar
          events={filteredEvents}
          locations={locations}
          onEventClick={handleEventClick}
          onDateClick={handleDateClick}
        />
      )}

      {/* Event Form Dialog */}
      <EventFormDialog
        open={showForm}
        onOpenChange={(open) => { setShowForm(open); if (!open) { setEditingEvent(null); setSelectedDate(null); } }}
        event={editingEvent}
        selectedDate={selectedDate}
        projects={projects}
        onSubmit={(data) => {
          if (editingEvent) {
            updateMutation.mutate({ id: editingEvent.id, data });
          } else {
            createMutation.mutate(data);
          }
        }}
        loading={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}

function EventFormDialog({ open, onOpenChange, event, selectedDate, projects, onSubmit, loading }) {
  const [formData, setFormData] = React.useState(event || {
    project_id: '',
    title: '',
    event_type: 'task',
    start_date: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '',
    end_date: '',
    start_time: '',
    end_time: '',
    location: '',
    status: 'scheduled',
    notes: '',
  });

  React.useEffect(() => {
    if (event) {
      setFormData(event);
    } else {
      setFormData({
        project_id: '',
        title: '',
        event_type: 'task',
        start_date: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '',
        end_date: '',
        start_time: '',
        end_time: '',
        location: '',
        status: 'scheduled',
        notes: '',
      });
    }
  }, [event, selectedDate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{event ? 'Edit Event' : 'Add Event'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Title *</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Event title"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Project *</Label>
              <Select
                value={formData.project_id}
                onValueChange={(value) => setFormData({ ...formData, project_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Event Type</Label>
              <Select
                value={formData.event_type}
                onValueChange={(value) => setFormData({ ...formData, event_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date *</Label>
              <Input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Time</Label>
              <Input
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>End Time</Label>
              <Input
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Location</Label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Floor 3, Zone A"
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map(s => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional details..."
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-slate-900 hover:bg-slate-800">
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {event ? 'Update' : 'Create'} Event
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}