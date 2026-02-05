import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Plus, Clock, CheckCircle, GitBranch, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

const statusConfig = {
  pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  in_review: { color: 'bg-blue-100 text-blue-800', icon: GitBranch },
  decided: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
  implemented: { color: 'bg-purple-100 text-purple-800', icon: CheckCircle },
  cancelled: { color: 'bg-slate-100 text-slate-800', icon: AlertCircle }
};

export default function DecisionManager({ projectId }) {
  const [showForm, setShowForm] = useState(false);
  const [editingDecision, setEditingDecision] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const queryClient = useQueryClient();
  const user = base44.auth.me();

  const { data: decisions = [] } = useQuery({
    queryKey: ['projectDecisions', projectId],
    queryFn: () => base44.entities.ProjectDecision.filter({ project_id: projectId }, '-created_date')
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ProjectDecision.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectDecisions', projectId] });
      setShowForm(false);
      setEditingDecision(null);
      toast.success('Decision request created');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ProjectDecision.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectDecisions', projectId] });
      toast.success('Decision updated');
    }
  });

  const handleSubmit = (formData) => {
    const decisionNumber = editingDecision?.decision_number || `DEC-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    const payload = {
      project_id: projectId,
      decision_number: decisionNumber,
      requested_by: user.email,
      ...formData
    };

    if (editingDecision) {
      updateMutation.mutate({ id: editingDecision.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleMakeDecision = (decision, finalDecision, justification) => {
    updateMutation.mutate({
      id: decision.id,
      data: {
        status: 'decided',
        decision: finalDecision,
        justification: justification,
        decided_date: new Date().toISOString().split('T')[0]
      }
    });
  };

  const filteredDecisions = filterStatus === 'all' 
    ? decisions 
    : decisions.filter(d => d.status === filterStatus);

  const summary = {
    total: decisions.length,
    pending: decisions.filter(d => d.status === 'pending').length,
    overdue: decisions.filter(d => d.status === 'pending' && d.deadline && new Date(d.deadline) < new Date()).length,
    decided: decisions.filter(d => d.status === 'decided').length
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Decisions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{summary.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{summary.overdue}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Decided</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{summary.decided}</div>
          </CardContent>
        </Card>
      </div>

      {/* Header with Actions */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in_review">In Review</SelectItem>
            <SelectItem value="decided">Decided</SelectItem>
            <SelectItem value="implemented">Implemented</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>

        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingDecision(null)}>
              <Plus className="h-4 w-4 mr-2" />
              Request Decision
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingDecision ? 'Update Decision' : 'Request Decision'}</DialogTitle>
            </DialogHeader>
            <DecisionForm
              decision={editingDecision}
              onSubmit={handleSubmit}
              onCancel={() => {
                setShowForm(false);
                setEditingDecision(null);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Decisions List */}
      <div className="space-y-4">
        {filteredDecisions.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <GitBranch className="h-12 w-12 text-slate-300 mb-4" />
              <p className="text-slate-500">No decisions found</p>
            </CardContent>
          </Card>
        ) : (
          filteredDecisions.map((decision) => {
            const StatusIcon = statusConfig[decision.status]?.icon || Clock;
            const isOverdue = decision.status === 'pending' && decision.deadline && new Date(decision.deadline) < new Date();
            
            return (
              <Card key={decision.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex flex-col sm:flex-row justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <CardTitle className="text-lg">{decision.title}</CardTitle>
                        <Badge className={statusConfig[decision.status]?.color}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {decision.status.replace(/_/g, ' ')}
                        </Badge>
                        {isOverdue && (
                          <Badge className="bg-red-100 text-red-800">Overdue</Badge>
                        )}
                      </div>
                      <p className="text-sm text-slate-500">{decision.decision_number}</p>
                    </div>
                    <div className="flex gap-2">
                      {decision.status === 'pending' && (
                        <Button
                          size="sm"
                          onClick={() => {
                            const finalDecision = prompt('Enter your decision:');
                            const justification = prompt('Provide justification:');
                            if (finalDecision && justification) {
                              handleMakeDecision(decision, finalDecision, justification);
                            }
                          }}
                        >
                          Make Decision
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingDecision(decision);
                          setShowForm(true);
                        }}
                      >
                        Edit
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <p className="text-sm text-slate-700">{decision.description}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                      <div>
                        <span className="text-slate-500">Type:</span>{' '}
                        <Badge variant="outline">{decision.decision_type}</Badge>
                      </div>
                      <div>
                        <span className="text-slate-500">Priority:</span>{' '}
                        <Badge variant="outline">{decision.priority}</Badge>
                      </div>
                      {decision.deadline && (
                        <div>
                          <span className="text-slate-500">Deadline:</span>{' '}
                          <span className={`font-medium ${isOverdue ? 'text-red-600' : ''}`}>
                            {format(new Date(decision.deadline), 'MMM d, yyyy')}
                          </span>
                        </div>
                      )}
                    </div>
                    {decision.decision && (
                      <div className="bg-green-50 rounded p-3 border border-green-200">
                        <p className="text-xs font-medium text-green-800 mb-1">Decision Made:</p>
                        <p className="text-sm text-green-900 font-medium">{decision.decision}</p>
                        {decision.justification && (
                          <p className="text-sm text-green-700 mt-2">{decision.justification}</p>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}

function DecisionForm({ decision, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    title: decision?.title || '',
    description: decision?.description || '',
    decision_type: decision?.decision_type || 'design',
    priority: decision?.priority || 'medium',
    status: decision?.status || 'pending',
    assigned_to: decision?.assigned_to || '',
    deadline: decision?.deadline || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Title</Label>
        <Input
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Decision title"
          required
        />
      </div>

      <div>
        <Label>Description</Label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="What needs to be decided?"
          className="h-24"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Decision Type</Label>
          <Select value={formData.decision_type} onValueChange={(value) => setFormData({ ...formData, decision_type: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="design">Design</SelectItem>
              <SelectItem value="material">Material</SelectItem>
              <SelectItem value="schedule">Schedule</SelectItem>
              <SelectItem value="budget">Budget</SelectItem>
              <SelectItem value="safety">Safety</SelectItem>
              <SelectItem value="quality">Quality</SelectItem>
              <SelectItem value="regulatory">Regulatory</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Priority</Label>
          <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Assigned To (Email)</Label>
          <Input
            type="email"
            value={formData.assigned_to}
            onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
            placeholder="decision-maker@email.com"
          />
        </div>

        <div>
          <Label>Deadline</Label>
          <Input
            type="date"
            value={formData.deadline}
            onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {decision ? 'Update' : 'Create'} Decision Request
        </Button>
      </div>
    </form>
  );
}