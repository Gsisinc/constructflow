import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Pencil, Save, X } from 'lucide-react';
import { toast } from 'sonner';

// Inline editor for a bid's Estimated Value, Scope of Work, and Due Date.
export default function BidDetailsEditor({ bid }) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [estimatedValue, setEstimatedValue] = useState(bid.estimated_value ?? '');
  const [scope, setScope] = useState(bid.scope_of_work || '');
  const [dueDate, setDueDate] = useState(bid.due_date || '');

  const startEdit = () => {
    setEstimatedValue(bid.estimated_value ?? '');
    setScope(bid.scope_of_work || '');
    setDueDate(bid.due_date || '');
    setEditing(true);
  };

  const saveMutation = useMutation({
    mutationFn: (data) => base44.entities.BidOpportunity.update(bid.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bid', bid.id] });
      queryClient.invalidateQueries({ queryKey: ['bids-all'] });
      queryClient.invalidateQueries({ queryKey: ['dash-bids-list'] });
      toast.success('Bid details updated');
      setEditing(false);
    },
    onError: () => toast.error('Unable to save bid details')
  });

  const handleSave = () => {
    saveMutation.mutate({
      estimated_value: estimatedValue === '' ? null : Number(estimatedValue),
      scope_of_work: scope,
      due_date: dueDate || null
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Bid Details</CardTitle>
          {!editing && (
            <Button variant="outline" size="sm" onClick={startEdit}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {editing ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="estimated_value">Estimated Value ($)</Label>
                <Input
                  id="estimated_value"
                  type="number"
                  min="0"
                  step="0.01"
                  value={estimatedValue}
                  onChange={(e) => setEstimatedValue(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="due_date">Due Date</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={dueDate || ''}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="scope_of_work">Scope of Work</Label>
              <Textarea
                id="scope_of_work"
                rows={4}
                value={scope}
                onChange={(e) => setScope(e.target.value)}
                placeholder="Describe the scope of work for this bid..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setEditing(false)}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saveMutation.isPending}>
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Estimated Value</p>
                <p className="text-sm font-semibold text-slate-900">
                  {bid.estimated_value != null ? `$${Number(bid.estimated_value).toLocaleString()}` : 'Not set'}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Due Date</p>
                <p className="text-sm font-semibold text-slate-900">{bid.due_date || 'Not set'}</p>
              </div>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Scope of Work</p>
              <p className="text-sm text-slate-700 whitespace-pre-wrap mt-1">
                {bid.scope_of_work || 'No scope of work defined yet.'}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}