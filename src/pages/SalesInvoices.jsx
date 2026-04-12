import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import InvoiceForm from '@/components/invoices/InvoiceForm';
import InvoiceList from '@/components/invoices/InvoiceList';
import InvoiceStats from '@/components/invoices/InvoiceStats';
import { Plus, Download, Filter, Search, DollarSign, TrendingUp, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function SalesInvoices() {
  const [user, setUser] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const queryClient = useQueryClient();

  // Load user
  useEffect(() => {
    const loadUser = async () => {
      const userData = await base44.auth.me();
      setUser(userData);
    };
    loadUser();
  }, []);

  // Fetch invoices
  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['salesInvoices', user?.organization_id],
    queryFn: async () => {
      if (!user?.organization_id) return [];
      const list = await base44.entities.SalesInvoice.filter({
        organization_id: user.organization_id
      });
      return list || [];
    },
    enabled: !!user?.organization_id
  });

  // Fetch products
  const { data: products = [] } = useQuery({
    queryKey: ['products', user?.organization_id],
    queryFn: async () => {
      if (!user?.organization_id) return [];
      const list = await base44.entities.Product.filter({
        organization_id: user.organization_id
      });
      return list || [];
    },
    enabled: !!user?.organization_id
  });

  // Fetch projects
  const { data: projects = [] } = useQuery({
    queryKey: ['projects', user?.organization_id],
    queryFn: async () => {
      if (!user?.organization_id) return [];
      const list = await base44.entities.Project.filter({
        organization_id: user.organization_id
      });
      return list || [];
    },
    enabled: !!user?.organization_id
  });

  // Create invoice
  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.SalesInvoice.create({
      ...data,
      organization_id: user.organization_id
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salesInvoices'] });
      setShowForm(false);
      toast.success('Invoice created');
    }
  });

  // Update invoice
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.SalesInvoice.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salesInvoices'] });
      setShowForm(false);
      setEditingInvoice(null);
      toast.success('Invoice updated');
    }
  });

  // Delete invoice
  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.SalesInvoice.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salesInvoices'] });
      toast.success('Invoice deleted');
    }
  });

  const handleEdit = (invoice) => {
    setEditingInvoice(invoice);
    setShowForm(true);
  };

  const handleSave = (formData) => {
    if (editingInvoice) {
      updateMutation.mutate({ id: editingInvoice.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  // Filter invoices
  const filteredInvoices = invoices.filter((invoice) => {
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    const matchesSearch = !searchQuery || 
      invoice.invoice_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.client_name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const stats = {
    total: invoices.length,
    paid: invoices.filter(i => i.status === 'paid').length,
    pending: invoices.filter(i => i.status === 'pending').length,
    amount: invoices.reduce((sum, i) => sum + (i.total_amount || 0), 0)
  };

  if (isLoading || !user) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Sales Invoices</h1>
          <p className="text-slate-500 mt-1">Manage and track sales invoices</p>
        </div>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => {
                setEditingInvoice(null);
                setShowForm(true);
              }}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              New Invoice
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingInvoice ? 'Edit Invoice' : 'Create Invoice'}</DialogTitle>
            </DialogHeader>
            {showForm && (
              <InvoiceForm 
                invoice={editingInvoice}
                products={products}
                company={selectedProject}
                onSave={handleSave}
                onCancel={() => { setShowForm(false); setEditingInvoice(null); }}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <InvoiceStats stats={stats} />

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search invoices..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* List */}
      {filteredInvoices.length > 0 ? (
        <InvoiceList invoices={invoices} onEdit={handleEdit} />
      ) : (
        <Card className="text-center py-12">
          <CardContent>
            <AlertCircle className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900">No invoices found</h3>
            <p className="text-slate-500 mt-1">Create your first invoice to get started</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}