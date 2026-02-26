import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import LiveBudgetTracker from '../components/budget/LiveBudgetTracker';
import { DashboardSkeleton } from '@/components/skeleton/SkeletonComponents';
import CashFlowForecast from '../components/budget/CashFlowForecast';
import ChangeOrderImpact from '../components/budget/ChangeOrderImpact';
import EmptyState from '../components/ui/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import {
  Plus,
  Search,
  DollarSign,
  Loader2,
  Calendar,
  FileText
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const CATEGORIES = [
  { value: 'labor', label: 'Labor', color: '#3B82F6' },
  { value: 'materials', label: 'Materials', color: '#10B981' },
  { value: 'equipment', label: 'Equipment', color: '#F59E0B' },
  { value: 'subcontractor', label: 'Subcontractor', color: '#8B5CF6' },
  { value: 'permits', label: 'Permits', color: '#EC4899' },
  { value: 'overhead', label: 'Overhead', color: '#6B7280' },
  { value: 'other', label: 'Other', color: '#94A3B8' },
];

const STATUSES = [
  { value: 'pending', label: 'Pending', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { value: 'approved', label: 'Approved', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { value: 'paid', label: 'Paid', color: 'bg-green-50 text-green-700 border-green-200' },
  { value: 'rejected', label: 'Rejected', color: 'bg-red-50 text-red-700 border-red-200' },
];

export default function Budget() {
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [search, setSearch] = useState('');
  const [projectFilter, setProjectFilter] = useState('all');
  const queryClient = useQueryClient();

  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => base44.entities.Expense.list('-created_date'),
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list(),
  });

  const { data: changeOrders = [] } = useQuery({
    queryKey: ['changeOrders'],
    queryFn: () => base44.entities.ChangeOrder.list('-created_date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Expense.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setShowForm(false);
      setEditingExpense(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Expense.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      setShowForm(false);
      setEditingExpense(null);
    },
  });

  const filteredExpenses = expenses.filter((expense) => {
    const matchesSearch =
      expense.description?.toLowerCase().includes(search.toLowerCase()) ||
      expense.vendor?.toLowerCase().includes(search.toLowerCase());
    const matchesProject = projectFilter === 'all' || expense.project_id === projectFilter;
    return matchesSearch && matchesProject;
  });

  const selectedProject = projectFilter !== 'all' ? projects.find(p => p.id === projectFilter) : null;
  const projectExpenses = projectFilter !== 'all' ? expenses.filter(e => e.project_id === projectFilter) : expenses;
  const projectChangeOrders = projectFilter !== 'all' ? changeOrders.filter(co => co.project_id === projectFilter) : changeOrders;

  const getProjectName = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    return project?.name || 'Unknown Project';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight">Budget</h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5 sm:mt-1">Track expenses and forecasts</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger className="w-full sm:w-40 text-sm min-h-[44px]">
              <SelectValue placeholder="Select project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {projects.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => { setEditingExpense(null); setShowForm(true); }} className="bg-amber-600 hover:bg-amber-700 min-h-[44px] text-sm select-none">
            <Plus className="h-4 w-4 mr-1.5 sm:mr-2" />
            <span className="hidden sm:inline">Add Expense</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>
      </div>

      {/* Living Budget Tracker */}
      {isLoading ? (
        <Skeleton className="h-64 rounded-2xl" />
      ) : (
        <LiveBudgetTracker 
          project={selectedProject || {
            budget: projects.reduce((sum, p) => sum + (p.budget || 0), 0),
            spent: projects.reduce((sum, p) => sum + (p.spent || 0), 0),
            committed_costs: projects.reduce((sum, p) => sum + (p.committed_costs || 0), 0),
            contingency_percent: 10
          }}
          expenses={projectExpenses}
          changeOrders={projectChangeOrders}
        />
      )}

      {/* Cash Flow & Change Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CashFlowForecast project={selectedProject} expenses={projectExpenses} />
        <ChangeOrderImpact changeOrders={projectChangeOrders} />
      </div>

      {/* Expense Table */}
      <Tabs defaultValue="expenses" className="w-full">
        <TabsList>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="change_orders">Change Orders</TabsTrigger>
        </TabsList>

        <TabsContent value="expenses" className="mt-4">
          {/* Filters */}
          <div className="flex gap-2 sm:gap-4 mb-3 sm:mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 text-sm min-h-[44px]"
              />
            </div>
          </div>

          {filteredExpenses.length === 0 ? (
            <EmptyState
              icon={DollarSign}
              title="No expenses yet"
              description="Start tracking your project expenses"
              actionLabel="Add Expense"
              onAction={() => setShowForm(true)}
            />
          ) : (
            <>
              {/* Mobile View */}
              <div className="sm:hidden space-y-2">
                {filteredExpenses.map((expense) => (
                  <div
                    key={expense.id}
                    className="bg-white rounded-lg border border-amber-100 p-2.5 cursor-pointer hover:bg-amber-50"
                    onClick={() => { setEditingExpense(expense); setShowForm(true); }}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <h3 className="text-xs font-semibold text-slate-900 flex-1">{expense.description?.substring(0, 30)}</h3>
                      <Badge className="text-xs flex-shrink-0">
                        ${(expense.amount || 0).toLocaleString('en', {notation: 'compact'})}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-xs">
                      <div className="text-slate-600">{expense.category}</div>
                      <div className="text-right text-slate-600">{expense.date ? format(new Date(expense.date), 'MMM d') : '-'}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop View */}
              <div className="hidden sm:block bg-white rounded-xl border border-amber-100 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-amber-100">
                      <TableHead className="text-xs">Description</TableHead>
                      <TableHead className="text-xs">Project</TableHead>
                      <TableHead className="text-xs">Category</TableHead>
                      <TableHead className="text-xs">Date</TableHead>
                      <TableHead className="text-xs">Amount</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredExpenses.map((expense) => (
                      <TableRow
                        key={expense.id}
                        className="cursor-pointer hover:bg-amber-50 text-sm"
                        onClick={() => { setEditingExpense(expense); setShowForm(true); }}
                      >
                        <TableCell className="text-xs">
                          <div>
                            <p className="font-medium truncate max-w-xs">{expense.description || 'No description'}</p>
                            {expense.vendor && <p className="text-xs text-slate-500">{expense.vendor}</p>}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-slate-600">{getProjectName(expense.project_id)}</TableCell>
                        <TableCell>
                          <Badge className="text-xs"
                            style={{ 
                              backgroundColor: CATEGORIES.find(c => c.value === expense.category)?.color + '20', 
                              color: CATEGORIES.find(c => c.value === expense.category)?.color 
                            }}
                          >
                            {expense.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">
                          {expense.date && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(expense.date), 'MMM d')}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-medium text-sm">${((expense.amount || 0) / 1000).toFixed(0)}K</TableCell>
                        <TableCell>
                          <Badge className={cn("border text-xs", STATUSES.find(s => s.value === expense.status)?.color)}>
                            {expense.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>

          )}
        </TabsContent>

        <TabsContent value="change_orders" className="mt-4">
          <div className="space-y-3">
            {projectChangeOrders.map((co) => (
              <div key={co.id} className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-900">{co.title}</h3>
                      <Badge variant="outline">{co.change_order_number}</Badge>
                    </div>
                    <p className="text-sm text-slate-500 mt-1">{co.description}</p>
                  </div>
                  <div className="text-right">
                    <p className={cn(
                      "text-lg font-semibold",
                      co.cost_impact > 0 ? "text-red-600" : "text-green-600"
                    )}>
                      {co.cost_impact > 0 ? '+' : ''}${Math.abs(co.cost_impact || 0).toLocaleString()}
                    </p>
                    <p className="text-xs text-slate-500">
                      {co.schedule_impact_days ? `${co.schedule_impact_days > 0 ? '+' : ''}${co.schedule_impact_days} days` : 'No schedule impact'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {projectChangeOrders.length === 0 && (
              <EmptyState
                icon={FileText}
                title="No change orders"
                description="Change orders will appear here when created"
              />
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Expense Form Dialog */}
      <ExpenseFormDialog
        open={showForm}
        onOpenChange={(open) => { setShowForm(open); if (!open) setEditingExpense(null); }}
        expense={editingExpense}
        projects={projects}
        onSubmit={(data) => {
          if (editingExpense) {
            updateMutation.mutate({ id: editingExpense.id, data });
          } else {
            createMutation.mutate(data);
          }
        }}
        loading={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}

function ExpenseFormDialog({ open, onOpenChange, expense, projects, onSubmit, loading }) {
  const [formData, setFormData] = React.useState(expense || {
    project_id: '',
    category: 'other',
    description: '',
    amount: '',
    date: '',
    vendor: '',
    invoice_number: '',
    status: 'pending',
  });

  React.useEffect(() => {
    if (expense) {
      setFormData(expense);
    } else {
      setFormData({
        project_id: '',
        category: 'other',
        description: '',
        amount: '',
        date: '',
        vendor: '',
        invoice_number: '',
        status: 'pending',
      });
    }
  }, [expense]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      amount: formData.amount ? parseFloat(formData.amount) : 0,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{expense ? 'Edit Expense' : 'Add Expense'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
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
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Amount ($) *</Label>
              <Input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Expense description..."
              rows={2}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
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
              <Label>Vendor</Label>
              <Input
                value={formData.vendor}
                onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                placeholder="Vendor name"
              />
            </div>
            <div className="space-y-2">
              <Label>Invoice #</Label>
              <Input
                value={formData.invoice_number}
                onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                placeholder="Invoice number"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !formData.project_id || !formData.amount} className="bg-slate-900 hover:bg-slate-800">
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {expense ? 'Update' : 'Add'} Expense
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}