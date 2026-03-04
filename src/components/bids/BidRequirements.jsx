import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import constructflowClient from '@/api/constructflowClient';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle2, 
  Circle, 
  AlertCircle, 
  Plus, 
  Trash2,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import { loadPolicy, requirePermission } from '@/lib/permissions';

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

  const { data: user } = useQuery({ queryKey: ['currentUser', 'bidRequirements'], queryFn: () => constructflowClient.getCurrentUser() });
  const { data: policy } = useQuery({
    queryKey: ['rolePolicy', organizationId, 'bidRequirements'],
    queryFn: () => loadPolicy({ organizationId }),
    enabled: !!organizationId
  });

  const { data: requirements = [] } = useQuery({
    queryKey: ['bidRequirements', bidId],
    queryFn: () => constructflowClient.getBidRequirements({ 
      bid_opportunity_id: bidId 
    }),
    enabled: !!bidId
  });

  const createMutation = useMutation({
    mutationFn: (data) => {
      requirePermission({ policy, role: user?.role || 'viewer', module: 'bids', action: 'create', message: 'You do not have permission to add bid requirements.' });
      return constructflowClient.createBidRequirement(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bidRequirements'] });
      setShowAddForm(false);
      setNewReq({ requirement_text: '', category: 'other', priority: 'medium' });
      toast.success('Requirement added');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => {
      requirePermission({ policy, role: user?.role || 'viewer', module: 'bids', action: 'edit', message: 'You do not have permission to edit requirements.' });
      return constructflowClient.updateBidRequirement(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bidRequirements'] });
      toast.success('Updated');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => {
      requirePermission({ policy, role: user?.role || 'viewer', module: 'bids', action: 'delete', message: 'You do not have permission to delete requirements.' });
      return constructflowClient.deleteBidRequirement(id);
    },
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
    <div className="space-y-4 p-2 md:p-4">
      {/* Stats - Responsive Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
        <Card className="border-amber-100 shadow-sm">
          <CardContent className="p-3 md:p-4">
            <div className="text-center">
              <p className="text-xl md:text-2xl font-bold text-amber-700">{stats.total}</p>
              <p className="text-xs text-slate-500 mt-1">Total</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-100 shadow-sm">
          <CardContent className="p-3 md:p-4">
            <div className="text-center">
              <p className="text-xl md:text-2xl font-bold text-green-600">{stats.completed}</p>
              <p className="text-xs text-slate-500 mt-1">Done</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-100 shadow-sm hidden md:block">
          <CardContent className="p-3 md:p-4">
            <div className="text-center">
              <p className="text-xl md:text-2xl font-bold text-slate-600">{stats.pending}</p>
              <p className="text-xs text-slate-500 mt-1">Pending</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-red-100 shadow-sm hidden md:block">
          <CardContent className="p-3 md:p-4">
            <div className="text-center">
              <p className="text-xl md:text-2xl font-bold text-red-600">{stats.critical}</p>
              <p className="text-xs text-slate-500 mt-1">Critical</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add button */}
      {!showAddForm && (
        <Button 
          onClick={() => setShowAddForm(true)}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 md:py-3 text-sm md:text-base rounded-lg shadow-md hover:shadow-lg transition-all"
        >
          <Plus className="h-4 w-4 md:h-5 md:w-5 mr-2" />
          Add Requirement
        </Button>
      )}

      {/* Add form */}
      {showAddForm && (
        <Card className="border-blue-200 shadow-md">
          <CardContent className="p-3 md:p-4 space-y-3">
            <textarea
              placeholder="Describe the requirement..."
              value={newReq.requirement_text}
              onChange={(e) => setNewReq({ ...newReq, requirement_text: e.target.value })}
              className="w-full border border-slate-300 rounded-lg p-3 h-24 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <select
                value={newReq.category}
                onChange={(e) => setNewReq({ ...newReq, category: e.target.value })}
                className="border border-slate-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select category</option>
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                ))}
              </select>
              <select
                value={newReq.priority}
                onChange={(e) => setNewReq({ ...newReq, priority: e.target.value })}
                className="border border-slate-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select priority</option>
                {PRIORITIES.map(pri => (
                  <option key={pri} value={pri}>{pri.charAt(0).toUpperCase() + pri.slice(1)}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 flex-col md:flex-row">
              <Button
                onClick={() => createMutation.mutate({
                  ...newReq,
                  bid_opportunity_id: bidId,
                  organization_id: organizationId
                })}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg"
              >
                Save Requirement
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowAddForm(false)}
                className="flex-1 md:flex-none py-2 rounded-lg"
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
          <Card className="shadow-sm">
            <CardContent className="py-12 text-center text-slate-500 text-sm">
              <p>No requirements yet.</p>
              <p className="text-xs mt-1">Upload a document or add manually.</p>
            </CardContent>
          </Card>
        ) : (
          requirements.map(req => (
            <Card key={req.id} className="hover:shadow-md transition-all shadow-sm border-slate-200">
              <CardContent className="p-3 md:p-4">
                <div className="flex items-start gap-2 md:gap-3">
                  <button
                    onClick={() => toggleStatus(req)}
                    className="mt-1 hover:opacity-70 transition flex-shrink-0"
                    title="Click to change status"
                  >
                    {req.status === 'completed' ? (
                      <CheckCircle2 className="h-5 w-5 md:h-6 md:w-6 text-green-500" />
                    ) : req.status === 'in_progress' ? (
                      <AlertCircle className="h-5 w-5 md:h-6 md:w-6 text-blue-500" />
                    ) : (
                      <Circle className="h-5 w-5 md:h-6 md:w-6 text-slate-300" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm md:text-base leading-relaxed break-words ${
                      req.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-900'
                    }`}>
                      {req.requirement_text}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <Badge className={`text-xs font-medium ${categoryColors[req.category]}`}>
                        {req.category.charAt(0).toUpperCase() + req.category.slice(1)}
                      </Badge>
                      <Badge className={`text-xs font-medium ${priorityColors[req.priority]}`}>
                        {req.priority.charAt(0).toUpperCase() + req.priority.slice(1)}
                      </Badge>
                      {req.ai_extracted && (
                        <Badge variant="outline" className="text-xs bg-purple-50">
                          <Sparkles className="h-3 w-3 mr-1" />
                          AI
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                    onClick={() => {
                      if (confirm('Delete this requirement?')) {
                        deleteMutation.mutate(req.id);
                      }
                    }}
                    title="Delete requirement"
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
