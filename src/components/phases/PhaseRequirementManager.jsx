import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function PhaseRequirementManager({ projectId }) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [formData, setFormData] = useState({ phase: '', description: '', estimated_duration_days: 7, requirements: [] });
  const [newReq, setNewReq] = useState('');
  const queryClient = useQueryClient();

  const { data: phases = [] } = useQuery({
    queryKey: ['phaseRequirements', projectId],
    queryFn: () => base44.entities.PhaseRequirement.filter({ project_id: projectId }),
    enabled: !!projectId
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.PhaseRequirement.create({
      project_id: projectId,
      ...data
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phaseRequirements', projectId] });
      setShowCreateDialog(false);
      setFormData({ phase: '', description: '', estimated_duration_days: 7, requirements: [] });
      toast.success('Phase created');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.PhaseRequirement.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phaseRequirements', projectId] });
      toast.success('Phase deleted');
    }
  });

  const handleAddRequirement = () => {
    if (newReq.trim()) {
      setFormData({
        ...formData,
        requirements: [...formData.requirements, newReq]
      });
      setNewReq('');
    }
  };

  const handleRemoveRequirement = (idx) => {
    setFormData({
      ...formData,
      requirements: formData.requirements.filter((_, i) => i !== idx)
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Project Phases</h3>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Phase
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Phase</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Phase Name</Label>
                <Input
                  value={formData.phase}
                  onChange={(e) => setFormData({ ...formData, phase: e.target.value })}
                  placeholder="e.g., Design & Planning"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Phase description"
                />
              </div>
              <div>
                <Label>Duration (days)</Label>
                <Input
                  type="number"
                  value={formData.estimated_duration_days}
                  onChange={(e) => setFormData({ ...formData, estimated_duration_days: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <Label>Requirements</Label>
                <div className="space-y-2">
                  {formData.requirements.map((req, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-slate-50 p-2 rounded border">
                      <span className="text-sm">{req}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemoveRequirement(idx)}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 mt-2">
                  <Input
                    value={newReq}
                    onChange={(e) => setNewReq(e.target.value)}
                    placeholder="Add requirement"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleAddRequirement();
                      }
                    }}
                  />
                  <Button size="sm" onClick={handleAddRequirement}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Button
                onClick={() => createMutation.mutate(formData)}
                className="w-full"
              >
                Create Phase
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-3">
        {phases.map((phase) => (
          <Card key={phase.id}>
            <CardHeader>
              <div className="flex justify-between items-start gap-3">
                <div className="flex-1">
                  <CardTitle className="text-base">{phase.phase}</CardTitle>
                  <p className="text-sm text-slate-500 mt-1">{phase.description}</p>
                  <p className="text-xs text-slate-400 mt-2">{phase.estimated_duration_days} days</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-600 hover:text-red-700"
                  onClick={() => {
                    if (confirm(`Delete "${phase.phase}"? This cannot be undone.`)) {
                      deleteMutation.mutate(phase.id);
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              {phase.requirements && phase.requirements.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-semibold text-slate-700 mb-2">Requirements:</p>
                  <ul className="space-y-1">
                    {phase.requirements.map((req, idx) => (
                      <li key={idx} className="text-xs text-slate-600">• {req}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardHeader>
          </Card>
        ))}
        {phases.length === 0 && (
          <p className="text-center text-slate-500 py-6">No phases yet. Create one to get started.</p>
        )}
      </div>
    </div>
  );
}