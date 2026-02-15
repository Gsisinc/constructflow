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
import { Plus, Clock, CheckCircle, XCircle, AlertCircle, DollarSign, Calendar as CalendarIcon } from 'lucide-react';
import { toast } from 'sonner';

const statusConfig = {
  draft: { color: 'bg-gray-100 text-gray-800', icon: Clock },
  pending_review: { color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle },
  client_review: { color: 'bg-blue-100 text-blue-800', icon: Clock },
  approved: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
  rejected: { color: 'bg-red-100 text-red-800', icon: XCircle },
  executed: { color: 'bg-purple-100 text-purple-800', icon: CheckCircle }
};

export default function ChangeOrderManager({ projectId }) {
  const [showForm, setShowForm] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const queryClient = useQueryClient();
  const user = base44.auth.me();

  const { data: changeOrders = [] } = useQuery({
    queryKey: ['changeOrders', projectId],
    queryFn: () => base44.entities.ChangeOrder.filter({ project_id: projectId }, '-created_date')
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ChangeOrder.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['changeOrders', projectId] });
      setShowForm(false);
      setEditingOrder(null);
      toast.success('Change order created successfully');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ChangeOrder.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['changeOrders', projectId] });
      toast.success('Change order updated successfully');
    }
  });

  const handleSubmit = (formData) => {
    const changeOrderNumber = editingOrder?.change_order_number || `CO-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    const payload = {
      project_id: projectId,
      change_order_number: changeOrderNumber,
      ...formData
    };

    if (editingOrder) {
      updateMutation.mutate({ id: editingOrder.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleApprove = (order) => {
    updateMutation.mutate({
      id: order.id,
      data: {
        status: 'approved',
        approved_date: new Date().toISOString().split('T')[0],
        approved_by: user.email
      }
    });
  };

  const handleReject = (order) => {
    updateMutation.mutate({
      id: order.id,
      data: { status: 'rejected' }
    });
  };

  const filteredOrders = filterStatus === 'all' 
    ? changeOrders 
    : changeOrders.filter(o => o.status === filterStatus);

  const summary = {
    total: changeOrders.length,
    pending: changeOrders.filter(o => ['draft', 'pending_review', 'client_review'].includes(o.status)).length,
    approved: changeOrders.filter(o => o.status === 'approved').length,
    totalCostImpact: changeOrders.reduce((sum, o) => sum + (o.cost_impact || 0), 0),
    totalScheduleImpact: changeOrders.reduce((sum, o) => sum + (o.schedule_impact_days || 0), 0)
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Orders</CardTitle>
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
            <CardTitle className="text-sm font-medium text-slate-600">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{summary.approved}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Cost Impact</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${summary.totalCostImpact >= 0 ? 'text-red-600' : 'text-green-600'}`}>
              {summary.totalCostImpact >= 0 ? '+' : ''}${summary.totalCostImpact.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Schedule Impact</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${summary.totalScheduleImpact >= 0 ? 'text-red-600' : 'text-green-600'}`}>
              {summary.totalScheduleImpact >= 0 ? '+' : ''}{summary.totalScheduleImpact} days
            </div>
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
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="pending_review">Pending Review</SelectItem>
            <SelectItem value="client_review">Client Review</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="executed">Executed</SelectItem>
          </SelectContent>
        </Select>

        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingOrder(null)}>
              <Plus className="h-4 w-4 mr-2" />
              New Change Order
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingOrder ? 'Edit Change Order' : 'New Change Order'}</DialogTitle>
            </DialogHeader>
            <ChangeOrderForm
              order={editingOrder}
              onSubmit={handleSubmit}
              onCancel={() => {
                setShowForm(false);
                setEditingOrder(null);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Change Orders List */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-12 w-12 text-slate-300 mb-4" />
              <p className="text-slate-500">No change orders found</p>
            </CardContent>
          </Card>
        ) : (
          filteredOrders.map((order) => {
            const StatusIcon = statusConfig[order.status]?.icon || Clock;
            return (
              <Card key={order.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex flex-col sm:flex-row justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">{order.title}</CardTitle>
                        <Badge className={statusConfig[order.status]?.color}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {order.status.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-500">{order.change_order_number}</p>
                    </div>
                    <div className="flex gap-2">
                      {['draft', 'pending_review', 'client_review'].includes(order.status) && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => handleApprove(order)}>
                            Approve
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleReject(order)}>
                            Reject
                          </Button>
                        </>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingOrder(order);
                          setShowForm(true);
                        }}
                      >
                        Edit
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600 mb-4">{order.description}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-slate-400" />
                      <span className="text-slate-600">Cost Impact:</span>
                      <span className={`font-semibold ${order.cost_impact >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {order.cost_impact >= 0 ? '+' : ''}${order.cost_impact?.toLocaleString() || 0}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4 text-slate-400" />
                      <span className="text-slate-600">Schedule:</span>
                      <span className={`font-semibold ${order.schedule_impact_days >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {order.schedule_impact_days >= 0 ? '+' : ''}{order.schedule_impact_days || 0} days
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-600">Reason:</span>
                      <Badge variant="outline">{order.reason?.replace(/_/g, ' ')}</Badge>
                    </div>
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

function ChangeOrderForm({ order, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    title: order?.title || '',
    description: order?.description || '',
    reason: order?.reason || 'client_request',
    status: order?.status || 'draft',
    cost_impact: order?.cost_impact || 0,
    schedule_impact_days: order?.schedule_impact_days || 0,
    scope_description: order?.scope_description || ''
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
          placeholder="Change order title"
          required
        />
      </div>

      <div>
        <Label>Description</Label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Detailed description of the change"
          className="h-24"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Reason</Label>
          <Select value={formData.reason} onValueChange={(value) => setFormData({ ...formData, reason: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="client_request">Client Request</SelectItem>
              <SelectItem value="design_change">Design Change</SelectItem>
              <SelectItem value="unforeseen_conditions">Unforeseen Conditions</SelectItem>
              <SelectItem value="code_compliance">Code Compliance</SelectItem>
              <SelectItem value="value_engineering">Value Engineering</SelectItem>
              <SelectItem value="error_correction">Error Correction</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Status</Label>
          <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="pending_review">Pending Review</SelectItem>
              <SelectItem value="client_review">Client Review</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="executed">Executed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Cost Impact ($)</Label>
          <Input
            type="number"
            value={formData.cost_impact}
            onChange={(e) => setFormData({ ...formData, cost_impact: parseFloat(e.target.value) || 0 })}
            placeholder="0"
          />
        </div>

        <div>
          <Label>Schedule Impact (days)</Label>
          <Input
            type="number"
            value={formData.schedule_impact_days}
            onChange={(e) => setFormData({ ...formData, schedule_impact_days: parseFloat(e.target.value) || 0 })}
            placeholder="0"
          />
        </div>
      </div>

      <div>
        <Label>Scope Description</Label>
        <Textarea
          value={formData.scope_description}
          onChange={(e) => setFormData({ ...formData, scope_description: e.target.value })}
          placeholder="Impact on project scope"
          className="h-24"
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {order ? 'Update' : 'Create'} Change Order
        </Button>
      </div>
    </form>
  );
}