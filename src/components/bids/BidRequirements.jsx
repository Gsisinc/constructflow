import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  CheckCircle2, 
  Circle, 
  AlertCircle, 
  Plus, 
  Trash2,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';

const CATEGORIES = ['technical', 'legal', 'financial', 'compliance', 'timeline', 'deliverable', 'other'];
const PRIORITIES = ['critical', 'high', 'medium', 'low'];

export default function BidRequirements({ bidId, organizationId }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newReq, setNewReq] = useState({
    requirement_text: '',
    category: 'other',
    priority: 'medium'
  });
  const queryClient = useQueryClient();

  const { data: requirements = [] } = useQuery({
    queryKey: ['bidRequirements', bidId],
    queryFn: () => base44.entities.BidRequirement.filter({ 
      bid_opportunity_id: bidId 
    }),
    enabled: !!bidId
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.BidRequirement.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bidRequirements'] });
      setShowAddForm(false);
      setNewReq({ requirement_text: '', category: 'other', priority: 'medium' });
      toast.success('Requirement added');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.BidRequirement.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bidRequirements'] });
      toast.success('Updated');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.BidRequirement.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bidRequirements'] });
      toast.success('Deleted');
    }
  });

  const toggleStatus = (req) => {
    const statuses = ['pending', 'in_progress', 'completed'];
    const currentIndex = statuses.indexOf(req.status);
    const nextStatus = statuses[(currentIndex + 1) % statuses.length];
    updateMutation.mutate({ 
      id: req.id, 
      data: { status: nextStatus } 
    });
  };

  const priorityColors = {
    critical: 'bg-red-100 text-red-800',
    high: 'bg-orange-100 text-orange-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-green-100 text-green-800'
  };

  const categoryColors = {
    technical: 'bg-blue-100 text-blue-800',
    legal: 'bg-purple-100 text-purple-800',
    financial: 'bg-green-100 text-green-800',
    compliance: 'bg-red-100 text-red-800',
    timeline: 'bg-orange-100 text-orange-800',
    deliverable: 'bg-cyan-100 text-cyan-800',
    other: 'bg-slate-100 text-slate-800'
  };

  const stats = {
    total: requirements.length,
    completed: requirements.filter(r => r.status === 'completed').length,
    pending: requirements.filter(r => r.status === 'pending').length,
    critical: requirements.filter(r => r.priority === 'critical').length
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        <Card className="border-amber-100">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-slate-500">Total</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-100">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              <p className="text-xs text-slate-500">Done</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-100">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-slate-600">{stats.pending}</p>
              <p className="text-xs text-slate-500">Pending</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-red-100">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{stats.critical}</p>
              <p className="text-xs text-slate-500">Critical</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add button */}
      {!showAddForm && (
        <Button 
          onClick={() => setShowAddForm(true)}
          className="w-full bg-amber-600 hover:bg-amber-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Requirement
        </Button>
      )}

      {/* Add form */}
      {showAddForm && (
        <Card className="border-amber-200">
          <CardContent className="p-4 space-y-3">
            <textarea
              placeholder="Requirement description..."
              value={newReq.requirement_text}
              onChange={(e) => setNewReq({ ...newReq, requirement_text: e.target.value })}
              className="w-full border rounded p-2 h-20 text-sm"
            />
            <div className="grid grid-cols-2 gap-3">
              <select
                value={newReq.category}
                onChange={(e) => setNewReq({ ...newReq, category: e.target.value })}
                className="border rounded p-2 text-sm"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <select
                value={newReq.priority}
                onChange={(e) => setNewReq({ ...newReq, priority: e.target.value })}
                className="border rounded p-2 text-sm"
              >
                {PRIORITIES.map(pri => (
                  <option key={pri} value={pri}>{pri}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => createMutation.mutate({
                  ...newReq,
                  bid_opportunity_id: bidId,
                  organization_id: organizationId
                })}
                className="flex-1 bg-amber-600 hover:bg-amber-700"
              >
                Save
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowAddForm(false)}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Requirements list */}
      <div className="space-y-2">
        {requirements.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-slate-500 text-sm">
              No requirements yet. Upload a document or add manually.
            </CardContent>
          </Card>
        ) : (
          requirements.map(req => (
            <Card key={req.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => toggleStatus(req)}
                    className="mt-1 hover:opacity-70 transition"
                  >
                    {req.status === 'completed' ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : req.status === 'in_progress' ? (
                      <AlertCircle className="h-5 w-5 text-blue-500" />
                    ) : (
                      <Circle className="h-5 w-5 text-slate-400" />
                    )}
                  </button>
                  <div className="flex-1">
                    <p className="text-sm text-slate-900">{req.requirement_text}</p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <Badge className={`text-xs ${categoryColors[req.category]}`}>
                        {req.category}
                      </Badge>
                      <Badge className={`text-xs ${priorityColors[req.priority]}`}>
                        {req.priority}
                      </Badge>
                      {req.ai_extracted && (
                        <Badge variant="outline" className="text-xs">
                          <Sparkles className="h-3 w-3 mr-1" />
                          AI
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-600"
                    onClick={() => {
                      if (confirm('Delete requirement?')) {
                        deleteMutation.mutate(req.id);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}