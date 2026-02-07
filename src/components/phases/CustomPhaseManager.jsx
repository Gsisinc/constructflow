import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Plus, Lock, Unlock, CheckCircle, ArrowUpDown, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function CustomPhaseManager({ projectId, onSelectPhase }) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const queryClient = useQueryClient();

  const { data: phases = [] } = useQuery({
    queryKey: ['customPhases', projectId],
    queryFn: () => base44.entities.CustomPhase.filter({ project_id: projectId }, 'order'),
    enabled: !!projectId
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.CustomPhase.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customPhases'] });
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      setShowCreateDialog(false);
      setFormData({ phase_name: '', display_name: '', order: phases.length + 1 });
      toast.success('Phase created');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.CustomPhase.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customPhases'] });
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      toast.success('Phase deleted');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.CustomPhase.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customPhases'] });
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      toast.success('Phase updated');
    }
  });

  const reorderMutation = useMutation({
    mutationFn: ({ phases }) => {
      // Update order for each phase
      return Promise.all(phases.map(p => 
        base44.entities.CustomPhase.update(p.id, { order: p.order })
      ));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customPhases', projectId] });
      toast.success('Phases reordered');
    }
  });

  const toggleLock = (phase) => {
    updateMutation.mutate({
      id: phase.id,
      data: {
        is_locked: !phase.is_locked,
        locked_date: !phase.is_locked ? new Date().toISOString().split('T')[0] : null
      }
    });
    toast.success(phase.is_locked ? 'Phase unlocked' : 'Phase locked');
  };

  const closePhase = (phase) => {
    updateMutation.mutate({
      id: phase.id,
      data: {
        status: 'completed',
        progress_percent: 100,
        completed_date: new Date().toISOString().split('T')[0],
        is_locked: true
      }
    });
    toast.success('Phase completed and locked');
  };

  const [formData, setFormData] = useState({ phase_name: '', display_name: '', icon: '', order: phases.length });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Project Phases</h3>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Create Custom Phase
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Custom Phase</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Phase ID (lowercase, no spaces)</Label>
                <Input
                  value={formData.phase_name}
                  onChange={(e) => setFormData({ ...formData, phase_name: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                  placeholder="e.g., electrical_rough_in"
                />
              </div>
              <div>
                <Label>Display Name</Label>
                <Input
                  value={formData.display_name}
                  onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                  placeholder="e.g., Electrical Rough-In"
                />
              </div>
              <div>
                <Label>Icon (emoji)</Label>
                <Input
                  value={formData.icon || ''}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  placeholder="e.g., ⚡ 🔧 🎯"
                  maxLength={2}
                />
              </div>
              <div>
                <Label>Order</Label>
                <Input
                  type="number"
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                />
              </div>
              <Button
                onClick={() => createMutation.mutate({ project_id: projectId, ...formData })}
                className="w-full"
              >
                Create Phase
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-3">
        {phases.map((phase, idx) => (
          <Card key={phase.id} className={phase.is_locked ? 'opacity-75' : ''}>
            <CardHeader>
              <div className="flex justify-between items-start gap-3">
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      if (idx > 0) {
                        const updated = [...phases];
                        [updated[idx].order, updated[idx - 1].order] = [updated[idx - 1].order, updated[idx].order];
                        reorderMutation.mutate({ phases: updated });
                      }
                    }}
                    disabled={idx === 0}
                  >
                    ↑
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      if (idx < phases.length - 1) {
                        const updated = [...phases];
                        [updated[idx].order, updated[idx + 1].order] = [updated[idx + 1].order, updated[idx].order];
                        reorderMutation.mutate({ phases: updated });
                      }
                    }}
                    disabled={idx === phases.length - 1}
                  >
                    ↓
                  </Button>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base">{phase.display_name}</CardTitle>
                    <Badge variant={
                      phase.status === 'completed' ? 'default' :
                      phase.status === 'in_progress' ? 'secondary' :
                      'outline'
                    }>
                      {phase.status?.replace('_', ' ') || 'pending'}
                    </Badge>
                    {phase.is_locked && <Lock className="h-4 w-4 text-slate-400" />}
                  </div>
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-slate-500">Progress</span>
                      <span className="font-medium">{phase.progress_percent || 0}%</span>
                    </div>
                    <Progress value={phase.progress_percent || 0} className="h-2" />
                  </div>
                </div>
                <div className="flex gap-2">
                  {!phase.is_locked && phase.status !== 'completed' && (
                    <Button size="sm" variant="outline" onClick={() => closePhase(phase)}>
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Close
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => {
                      if (confirm('Delete this phase? This cannot be undone.')) {
                        deleteMutation.mutate(phase.id);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}