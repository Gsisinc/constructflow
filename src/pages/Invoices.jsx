import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, DollarSign } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function Invoices() {
  const queryClient = useQueryClient();

  // Get current user for organization filtering
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });
  
  const [selectedProject, setSelectedProject] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    invoice_number: '',
    vendor: '',
    description: '',
    amount: 0,
    date: format(new Date(), 'yyyy-MM-dd'),
    status: 'pending'
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects', user?.organization_id],
    queryFn: () => {
      if (!user?.organization_id) return [];
      return base44.entities.Project.filter({ organization_id: user.organization_id }, '-created_date');
    },
    enabled: !!user?.organization_id
  });

  const { data: expenses = [] } = useQuery({
    queryKey: ['invoices', selectedProject],
    queryFn: () => selectedProject ? base44.entities.Expense.filter({ project_id: selectedProject }, '-date') : Promise.resolve([]),
    enabled: !!selectedProject
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Expense.create({
      ...data,
      project_id: selectedProject,
      category: 'other',
      organization_id: user?.organization_id
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      setFormData({
        invoice_number: '',
        vendor: '',
        description: '',
        amount: 0,
        date: format(new Date(), 'yyyy-MM-dd'),
        status: 'pending'
      });
      setShowForm(false);
      toast.success('Invoice created');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Expense.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Invoice deleted');
    }
  });

  const handleSubmit = () => {
    if (!formData.invoice_number.trim()) {
      toast.error('Invoice number is required');
      return;
    }
    if (!formData.vendor.trim()) {
      toast.error('Vendor name is required');
      return;
    }
    createMutation.mutate(formData);
  };

  const totalPending = expenses
    .filter(e => e.status === 'pending')
    .reduce((sum, e) => sum + (e.amount || 0), 0);

  const totalPaid = expenses
    .filter(e => e.status === 'paid')
    .reduce((sum, e) => sum + (e.amount || 0), 0);

  const getStatusColor = (status) => {
    switch(status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 break-words">Invoices</h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1">Manage project invoices and payments</p>
        </div>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto sm:w-auto bg-green-600 hover:bg-green-700">
              <Plus className="h-4 w-4 mr-2" /> New Invoice
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto max-w-md">
            <DialogHeader>
              <DialogTitle>Create Invoice</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Project *</label>
                <select
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="w-full sm:w-auto mt-1 px-3 py-2 border rounded-lg text-sm"
                >
                  <option value="">Select Project</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Invoice Number *</label>
                <Input
                  placeholder="e.g., INV-001"
                  value={formData.invoice_number}
                  onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Vendor/Company *</label>
                <Input
                  placeholder="Vendor name"
                  value={formData.vendor}
                  onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  placeholder="Invoice description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Amount *</label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Date</label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full sm:w-auto mt-1 px-3 py-2 border rounded-lg text-sm"
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="paid">Paid</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              <Button onClick={handleSubmit} className="w-full sm:w-auto bg-green-600 hover:bg-green-700">
                Create Invoice
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Project Selector */}
      <div className="bg-slate-50 p-3 md:p-4 rounded-lg">
        <label className="text-xs md:text-sm font-medium text-slate-700 block mb-2">Select Project</label>
        <select
          value={selectedProject || ''}
          onChange={(e) => setSelectedProject(e.target.value || null)}
          className="w-full sm:w-auto px-3 py-2 border rounded-lg text-sm md:text-base"
        >
          <option value="">All Projects</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {/* Stats Cards - Mobile responsive */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 sm:grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs md:text-sm text-slate-600 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl md:text-xl sm:text-2xl md:text-3xl font-bold text-yellow-600">${totalPending.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs md:text-sm text-slate-600 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Paid
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl md:text-xl sm:text-2xl md:text-3xl font-bold text-green-600">${totalPaid.toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Invoices List */}
      {expenses.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-slate-500 text-sm">
            {selectedProject ? 'No invoices for this project yet.' : 'Select a project to view invoices.'}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3 md:space-y-4">
          {expenses.map(invoice => (
            <Card key={invoice.id}>
              <CardHeader className="pb-3">
                {/* Mobile: Stack vertically, Desktop: Side by side */}
                <div className="flex flex-col sm:flex-col sm:flex-row justify-between items-start gap-3">
                  <div className="flex-1 min-w-0">
                    {/* Vendor and Status - Stack on mobile */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                      <CardTitle className="text-base md:text-lg break-words">{invoice.vendor}</CardTitle>
                      <Badge className={`${getStatusColor(invoice.status)} text-xs w-fit`}>
                        {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                      </Badge>
                    </div>
                    {/* Invoice number and date - Stack on mobile */}
                    <p className="text-xs md:text-sm text-slate-600 break-words">
                      #{invoice.invoice_number} • {format(new Date(invoice.date), 'MMM d, yyyy')}
                    </p>
                  </div>
                  {/* Amount and delete button - Stack on mobile */}
                  <div className="flex items-start justify-between w-full sm:w-auto gap-2">
                    <div className="text-right">
                      <p className="text-xl md:text-lg sm:text-xl md:text-2xl font-bold text-slate-900 break-words">${invoice.amount.toFixed(2)}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteMutation.mutate(invoice.id)}
                      className="flex-shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {invoice.description && (
                <CardContent>
                  <p className="text-xs md:text-sm text-slate-700 break-words">{invoice.description}</p>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
