import React, { useState } from 'react';
import { Plus, Download, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import InvoiceForm from '@/components/invoices/InvoiceForm';
import InvoiceList from '@/components/invoices/InvoiceList';
import InvoiceStats from '@/components/invoices/InvoiceStats';

export default function SalesInvoices() {
  const [showForm, setShowForm] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const queryClient = useQueryClient();

  // Fetch invoices
  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['sales_invoices'],
    queryFn: async () => {
      const result = await base44.entities.SalesInvoice.list('-created_date', 100);
      return result || [];
    },
  });

  // Fetch products for line items
  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const result = await base44.entities.Product.list('name', 100);
      return result || [];
    },
  });

  // Fetch selected project (for company info)
  const { data: selectedProject } = useQuery({
    queryKey: ['selected_project'],
    queryFn: async () => {
      const projects = await base44.entities.Project.list('-updated_date', 1);
      return projects?.[0] || null;
    },
  });

  // Create/Update mutation
  const { mutate: saveInvoice, isPending } = useMutation({
    mutationFn: async (invoiceData) => {
      if (editingInvoice) {
        return await base44.entities.SalesInvoice.update(editingInvoice.id, invoiceData);
      } else {
        return await base44.entities.SalesInvoice.create(invoiceData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales_invoices'] });
      toast.success(editingInvoice ? 'Invoice updated' : 'Invoice created');
      setShowForm(false);
      setEditingInvoice(null);
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  // Filter invoices
  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch =
      invoice.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.customer_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleEdit = (invoice) => {
    setEditingInvoice(invoice);
    setShowForm(true);
  };

  const handleSave = (invoiceData) => {
    saveInvoice(invoiceData);
  };

  const handleDownload = async (invoice) => {
    try {
      // Generate PDF using integration or direct download
      toast.success(`Downloading invoice ${invoice.invoice_number}`);
    } catch (error) {
      toast.error('Download failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Sales Invoices</h1>
          <p className="text-slate-500 mt-1">Manage customer invoices and track payments</p>
        </div>
        <Button onClick={() => { setShowForm(true); setEditingInvoice(null); }} className="gap-2">
          <Plus className="w-4 h-4" />
          New Invoice
        </Button>
      </div>

      {/* Stats */}
      {!isLoading && <InvoiceStats invoices={filteredInvoices} />}

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by invoice number or customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Form or List */}
      {showForm ? (
        <Card>
          <CardHeader className="border-b">
            <CardTitle>{editingInvoice ? 'Edit Invoice' : 'Create New Invoice'}</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <InvoiceForm
              invoice={editingInvoice}
              products={products}
              company={selectedProject}
              onSave={handleSave}
              onCancel={() => { setShowForm(false); setEditingInvoice(null); }}
            />
          </CardContent>
        </Card>
      ) : (
        <InvoiceList invoices={invoices} onEdit={handleEdit} />
      )}
    </div>
  );
}