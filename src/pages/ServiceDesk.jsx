import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Wrench, AlertTriangle, Timer, ClipboardList } from 'lucide-react';
import { toast } from 'sonner';
import { buildSlaTag, buildTicketMetrics, sortTicketsByUrgency } from '@/lib/serviceDesk';
import { loadPolicy, requirePermission } from '@/lib/permissions';

export default function ServiceDesk() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [form, setForm] = useState({ subject: '', description: '', priority: 'medium', category: 'service_call', project_id: '' });
  const queryClient = useQueryClient();

  const { data: user } = useQuery({ queryKey: ['currentUser', 'serviceDesk'], queryFn: () => base44.auth.me() });
  const { data: policy } = useQuery({
    queryKey: ['rolePolicy', user?.organization_id, 'serviceDesk'],
    queryFn: () => loadPolicy({ organizationId: user?.organization_id }),
    enabled: !!user?.organization_id
  });

  const { data: projects = [] } = useQuery({ queryKey: ['projects', 'serviceDesk'], queryFn: () => base44.entities.Project.list('-created_date') });

  const { data: tickets = [] } = useQuery({
    queryKey: ['serviceTickets'],
    queryFn: async () => {
      try {
        return await base44.entities.ServiceTicket.list('-created_date');
      } catch (error) {
        console.warn('ServiceTicket entity unavailable, falling back to issues.', error);
        return base44.entities.Issue.list('-created_date');
      }
    }
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      requirePermission({ policy, role: user?.role || 'viewer', module: 'projects', action: 'create', message: 'You do not have permission to create service tickets.' });

      const payload = {
        ...form,
        project_id: form.project_id || null,
        organization_id: user?.organization_id || null,
        status: 'new',
        requested_by: user?.email || 'internal',
        sla_due_at: buildSlaTag({ priority: form.priority }).due_at
      };

      try {
        await base44.entities.ServiceTicket.create(payload);
      } catch {
        await base44.entities.Issue.create({
          project_id: form.project_id || null,
          organization_id: user?.organization_id || null,
          title: form.subject,
          description: form.description,
          severity: form.priority,
          status: 'open',
          due_date: payload.sla_due_at
        });
      }
    },
    onSuccess: () => {
      toast.success('Service ticket created');
      setForm({ subject: '', description: '', priority: 'medium', category: 'service_call', project_id: '' });
      queryClient.invalidateQueries({ queryKey: ['serviceTickets'] });
    },
    onError: (error) => toast.error(error?.message || 'Failed to create ticket')
  });

  const statusMutation = useMutation({
    mutationFn: async ({ ticket, nextStatus }) => {
      requirePermission({ policy, role: user?.role || 'viewer', module: 'projects', action: 'edit', message: 'You do not have permission to update ticket status.' });
      if (ticket.subject) {
        return base44.entities.ServiceTicket.update(ticket.id, { status: nextStatus });
      }
      return base44.entities.Issue.update(ticket.id, { status: nextStatus });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['serviceTickets'] }),
    onError: (error) => toast.error(error?.message || 'Failed to update ticket status')
  });

  const filteredTickets = useMemo(() => {
    return sortTicketsByUrgency(tickets).filter((ticket) => {
      const statusValue = (ticket.status || 'new').toLowerCase();
      const priorityValue = (ticket.priority || ticket.severity || 'medium').toLowerCase();
      const statusMatch = statusFilter === 'all' || statusValue === statusFilter;
      const priorityMatch = priorityFilter === 'all' || priorityValue === priorityFilter;
      return statusMatch && priorityMatch;
    });
  }, [tickets, statusFilter, priorityFilter]);

  const metrics = useMemo(() => buildTicketMetrics(tickets), [tickets]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Advanced Service Desk</h1>
        <p className="text-sm text-slate-600 mt-1">Service calls + maintenance ticketing with SLA visibility, queue filters, and dispatch status.</p>
      </div>

      <div className="grid md:grid-cols-4 gap-3">
        <Metric title="Total Tickets" value={metrics.total} icon={ClipboardList} />
        <Metric title="Open" value={metrics.open} icon={Wrench} />
        <Metric title="Critical Open" value={metrics.critical_open} icon={AlertTriangle} />
        <Metric title="SLA Breached" value={metrics.sla_breached} icon={Timer} />
      </div>

      <Tabs defaultValue="queue" className="space-y-4">
        <TabsList>
          <TabsTrigger value="queue">Ticket Queue</TabsTrigger>
          <TabsTrigger value="create">Create Ticket</TabsTrigger>
        </TabsList>

        <TabsContent value="queue">
          <Card>
            <CardHeader>
              <CardTitle>Dispatch Queue</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <Label>Status filter</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Priority filter</Label>
                  <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3">
                {filteredTickets.length === 0 ? (
                  <p className="text-sm text-slate-500">No tickets for the selected filters.</p>
                ) : (
                  filteredTickets.map((ticket) => {
                    const priority = ticket.priority || ticket.severity || 'medium';
                    const sla = buildSlaTag({ priority, dueAt: ticket.sla_due_at || ticket.due_date });
                    return (
                      <div key={ticket.id} className="border rounded-lg p-4 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold">{ticket.subject || ticket.title || 'Service request'}</p>
                            <p className="text-sm text-slate-600">{ticket.description || 'No description'}</p>
                          </div>
                          <div className="flex flex-wrap gap-1 justify-end">
                            <Badge>{(ticket.status || 'new').replace('_', ' ')}</Badge>
                            <Badge variant="outline">{priority}</Badge>
                            <Badge className={sla.badgeClass}>{sla.label}</Badge>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => statusMutation.mutate({ ticket, nextStatus: 'in_progress' })}>Start</Button>
                          <Button size="sm" variant="outline" onClick={() => statusMutation.mutate({ ticket, nextStatus: 'resolved' })}>Resolve</Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="create">
          <Card>
            <CardHeader>
              <CardTitle>New Service Call / Maintenance Ticket</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label>Subject</Label>
                <Input value={form.subject} onChange={(e) => setForm((prev) => ({ ...prev, subject: e.target.value }))} />
              </div>
              <div>
                <Label>Description</Label>
                <Input value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} />
              </div>
              <div className="grid md:grid-cols-3 gap-3">
                <div>
                  <Label>Priority</Label>
                  <Select value={form.priority} onValueChange={(value) => setForm((prev) => ({ ...prev, priority: value }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Category</Label>
                  <Select value={form.category} onValueChange={(value) => setForm((prev) => ({ ...prev, category: value }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="service_call">Service Call</SelectItem>
                      <SelectItem value="preventive_maintenance">Preventive Maintenance</SelectItem>
                      <SelectItem value="warranty">Warranty</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Project</Label>
                  <Select value={form.project_id || 'none'} onValueChange={(value) => setForm((prev) => ({ ...prev, project_id: value === 'none' ? '' : value }))}>
                    <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No project</SelectItem>
                      {projects.map((project) => <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending || !form.subject || !form.description}>
                {createMutation.isPending ? 'Creating...' : 'Create ticket'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Metric({ title, value, icon: Icon }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500">{title}</p>
            <p className="text-2xl font-semibold text-slate-900">{value}</p>
          </div>
          <Icon className="h-5 w-5 text-indigo-500" />
        </div>
      </CardContent>
    </Card>
  );
}
