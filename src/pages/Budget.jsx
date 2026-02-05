import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import EmptyState from '../components/ui/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
  TrendingUp,
  TrendingDown,
  Loader2,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from 'recharts';

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
  const [categoryFilter, setCategoryFilter] = useState('all');
  const queryClient = useQueryClient();

  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => base44.entities.Expense.list('-created_date'),
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Expense.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      setShowForm(false);
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
    const matchesCategory = categoryFilter === 'all' || expense.category === categoryFilter;
    return matchesSearch && matchesProject && matchesCategory;
  });

  const getProjectName = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    return project?.name || 'Unknown Project';
  };

  // Calculate totals
  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const totalBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0);
  const paidExpenses = expenses.filter(e => e.status === 'paid').reduce((sum, e) => sum + (e.amount || 0), 0);
  const pendingExpenses = expenses.filter(e => e.status === 'pending').reduce((sum, e) => sum + (e.amount || 0), 0);

  // Category breakdown for chart
  const categoryData = CATEGORIES.map(cat => ({
    name: cat.label,
    value: expenses.filter(e => e.category === cat.value).reduce((sum, e) => sum + (e.amount || 0), 0),
    color: cat.color
  })).filter(c => c.value > 0);

  // Monthly expenses for bar chart
  const monthlyData = expenses.reduce((acc, expense) => {
    if (expense.date) {
      const month = format(new Date(expense.date), 'MMM');
      acc[month] = (acc[month] || 0) + (expense.amount || 0);
    }
    return acc;
  }, {});

  const barChartData = Object.entries(monthlyData).map(([month, amount]) => ({
    month,
    amount
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Budget</h1>
          <p className="text-slate-500 mt-1">Track expenses and budget allocation</p>
        </div>
        <Button onClick={() => { setEditingExpense(null); setShowForm(true); }} className="bg-slate-900 hover:bg-slate-800">
          <Plus className="h-4 w-4 mr-2" />
          Add Expense
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Total Budget</p>
              <p className="text-2xl font-semibold mt-1">${totalBudget.toLocaleString()}</p>
            </div>
            <div className="p-3 rounded-xl bg-blue-100">
              <DollarSign className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Total Expenses</p>
              <p className="text-2xl font-semibold mt-1">${totalExpenses.toLocaleString()}</p>
            </div>
            <div className="p-3 rounded-xl bg-purple-100">
              <TrendingDown className="h-5 w-5 text-purple-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Paid</p>
              <p className="text-2xl font-semibold mt-1 text-green-600">${paidExpenses.toLocaleString()}</p>
            </div>
            <div className="p-3 rounded-xl bg-green-100">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Pending</p>
              <p className="text-2xl font-semibold mt-1 text-amber-600">${pendingExpenses.toLocaleString()}</p>
            </div>
            <div className="p-3 rounded-xl bg-amber-100">
              <DollarSign className="h-5 w-5 text-amber-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      {!isLoading && expenses.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-4">Expenses by Category</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-4">Monthly Expenses</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData}>
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                  <Bar dataKey="amount" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search expenses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={projectFilter} onValueChange={setProjectFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Project" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Projects</SelectItem>
            {projects.map(p => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.map(c => (
              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Expenses Table */}
      {isLoading ? (
        <div className="space-y-4">
          {Array(5).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : filteredExpenses.length === 0 ? (
        <EmptyState
          icon={DollarSign}
          title={search || projectFilter !== 'all' || categoryFilter !== 'all' ? 'No expenses found' : 'No expenses yet'}
          description="Start tracking your project expenses"
          actionLabel={!search && projectFilter === 'all' && categoryFilter === 'all' ? 'Add Expense' : null}
          onAction={() => setShowForm(true)}
        />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredExpenses.map((expense) => (
                <TableRow
                  key={expense.id}
                  className="cursor-pointer hover:bg-slate-50"
                  onClick={() => { setEditingExpense(expense); setShowForm(true); }}
                >
                  <TableCell>
                    <div>
                      <p className="font-medium">{expense.description || 'No description'}</p>
                      {expense.vendor && <p className="text-xs text-slate-500">{expense.vendor}</p>}
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-500">{getProjectName(expense.project_id)}</TableCell>
                  <TableCell>
                    <Badge
                      style={{ backgroundColor: CATEGORIES.find(c => c.value === expense.category)?.color + '20', color: CATEGORIES.find(c => c.value === expense.category)?.color }}
                    >
                      {expense.category}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {expense.date && (
                      <div className="flex items-center gap-1.5 text-sm text-slate-500">
                        <Calendar className="h-3.5 w-3.5" />
                        {format(new Date(expense.date), 'MMM d, yyyy')}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">${(expense.amount || 0).toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge className={cn("border", STATUSES.find(s => s.value === expense.status)?.color)}>
                      {expense.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

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
  const [formData, setFormData] = useState(expense || {
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
            <Button type="submit" disabled={loading} className="bg-slate-900 hover:bg-slate-800">
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {expense ? 'Update' : 'Add'} Expense
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}