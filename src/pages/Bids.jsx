import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import EmptyState from '../components/ui/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { Textarea } from '@/components/ui/textarea';
import { Plus, Search, FileText, Calendar, DollarSign, TrendingUp, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const statusColors = {
  draft: 'bg-slate-50 text-slate-700 border-slate-200',
  submitted: 'bg-blue-50 text-blue-700 border-blue-200',
  under_review: 'bg-amber-50 text-amber-700 border-amber-200',
  won: 'bg-green-50 text-green-700 border-green-200',
  lost: 'bg-red-50 text-red-700 border-red-200',
  withdrawn: 'bg-slate-50 text-slate-500 border-slate-200',
};

const STATUSES = [
  { value: 'draft', label: 'Draft' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'won', label: 'Won' },
  { value: 'lost', label: 'Lost' },
  { value: 'withdrawn', label: 'Withdrawn' },
];

export default function Bids() {
  const [showForm, setShowForm] = useState(false);
  const [editingBid, setEditingBid] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const queryClient = useQueryClient();

  const { data: bids = [], isLoading } = useQuery({
    queryKey: ['bids'],
    queryFn: () => base44.entities.Bid.list('-created_date'),
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Bid.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bids'] });
      setShowForm(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Bid.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bids'] });
      setShowForm(false);
      setEditingBid(null);
    },
  });

  const filteredBids = bids.filter((bid) => {
    const matchesSearch =
      bid.rfp_name?.toLowerCase().includes(search.toLowerCase()) ||
      bid.client_name?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || bid.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const wonBids = bids.filter(b => b.status === 'won');
  const totalBidValue = bids.reduce((sum, b) => sum + (b.bid_amount || 0), 0);
  const wonValue = wonBids.reduce((sum, b) => sum + (b.bid_amount || 0), 0);
  const winRate = bids.filter(b => ['won', 'lost'].includes(b.status)).length > 0
    ? (wonBids.length / bids.filter(b => ['won', 'lost'].includes(b.status)).length * 100).toFixed(0)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Bids</h1>
          <p className="text-slate-500 mt-1">Track and manage your bid proposals</p>
        </div>
        <Button onClick={() => { setEditingBid(null); setShowForm(true); }} className="bg-slate-900 hover:bg-slate-800">
          <Plus className="h-4 w-4 mr-2" />
          New Bid
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Total Pipeline</p>
              <p className="text-2xl font-semibold mt-1">${totalBidValue.toLocaleString()}</p>
            </div>
            <div className="p-3 rounded-xl bg-blue-100">
              <DollarSign className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Won Value</p>
              <p className="text-2xl font-semibold mt-1 text-green-600">${wonValue.toLocaleString()}</p>
            </div>
            <div className="p-3 rounded-xl bg-green-100">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Win Rate</p>
              <p className="text-2xl font-semibold mt-1">{winRate}%</p>
            </div>
            <div className="p-3 rounded-xl bg-purple-100">
              <FileText className="h-5 w-5 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search bids..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {STATUSES.map(s => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Bids Table */}
      {isLoading ? (
        <div className="space-y-4">
          {Array(5).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : filteredBids.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={search || statusFilter !== 'all' ? 'No bids found' : 'No bids yet'}
          description="Start tracking your bid proposals"
          actionLabel={!search && statusFilter === 'all' ? 'Create Bid' : null}
          onAction={() => setShowForm(true)}
        />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>RFP Name</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Win Prob.</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBids.map((bid) => (
                <TableRow
                  key={bid.id}
                  className="cursor-pointer hover:bg-slate-50"
                  onClick={() => { setEditingBid(bid); setShowForm(true); }}
                >
                  <TableCell className="font-medium">{bid.rfp_name}</TableCell>
                  <TableCell>{bid.client_name}</TableCell>
                  <TableCell>${(bid.bid_amount || 0).toLocaleString()}</TableCell>
                  <TableCell>
                    {bid.due_date && (
                      <div className="flex items-center gap-1.5 text-sm">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        {format(new Date(bid.due_date), 'MMM d, yyyy')}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {bid.win_probability && (
                      <div className="flex items-center gap-2">
                        <Progress value={bid.win_probability} className="w-16 h-1.5" />
                        <span className="text-sm text-slate-500">{bid.win_probability}%</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={cn("border", statusColors[bid.status])}>
                      {bid.status?.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Bid Form Dialog */}
      <BidFormDialog
        open={showForm}
        onOpenChange={(open) => { setShowForm(open); if (!open) setEditingBid(null); }}
        bid={editingBid}
        projects={projects}
        onSubmit={(data) => {
          if (editingBid) {
            updateMutation.mutate({ id: editingBid.id, data });
          } else {
            createMutation.mutate(data);
          }
        }}
        loading={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}

function BidFormDialog({ open, onOpenChange, bid, projects, onSubmit, loading }) {
  const [formData, setFormData] = useState(bid || {
    rfp_name: '',
    client_name: '',
    project_id: '',
    status: 'draft',
    bid_amount: '',
    due_date: '',
    win_probability: '',
    notes: '',
  });

  React.useEffect(() => {
    if (bid) {
      setFormData(bid);
    } else {
      setFormData({
        rfp_name: '',
        client_name: '',
        project_id: '',
        status: 'draft',
        bid_amount: '',
        due_date: '',
        win_probability: '',
        notes: '',
      });
    }
  }, [bid]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      bid_amount: formData.bid_amount ? parseFloat(formData.bid_amount) : null,
      win_probability: formData.win_probability ? parseFloat(formData.win_probability) : null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{bid ? 'Edit Bid' : 'New Bid'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>RFP Name *</Label>
            <Input
              value={formData.rfp_name}
              onChange={(e) => setFormData({ ...formData, rfp_name: e.target.value })}
              placeholder="Enter RFP name"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Client Name *</Label>
            <Input
              value={formData.client_name}
              onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
              placeholder="Enter client name"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Bid Amount ($)</Label>
              <Input
                type="number"
                value={formData.bid_amount}
                onChange={(e) => setFormData({ ...formData, bid_amount: e.target.value })}
                placeholder="0.00"
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
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Win Probability (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={formData.win_probability}
                onChange={(e) => setFormData({ ...formData, win_probability: e.target.value })}
                placeholder="0-100"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes..."
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-slate-900 hover:bg-slate-800">
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {bid ? 'Update' : 'Create'} Bid
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}