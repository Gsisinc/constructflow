import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Upload, FileText, Download, Trash2, Edit2, Loader2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { jsPDF } from 'jspdf';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import EmptyState from '../components/ui/EmptyState';

const statusColors = {
  draft: 'bg-slate-100 text-slate-700 border-slate-200',
  sent: 'bg-blue-100 text-blue-700 border-blue-200',
  acknowledged: 'bg-purple-100 text-purple-700 border-purple-200',
  partially_received: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  received: 'bg-green-100 text-green-700 border-green-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
};

export default function PurchaseOrders() {
  const [showForm, setShowForm] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [editingPO, setEditingPO] = useState(null);
  const queryClient = useQueryClient();

  const { data: pos = [], isLoading } = useQuery({
    queryKey: ['purchaseOrders'],
    queryFn: () => base44.entities.PurchaseOrder.list('-created_date'),
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.PurchaseOrder.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
      setShowForm(false);
      setEditingPO(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.PurchaseOrder.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
      setShowForm(false);
      setEditingPO(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.PurchaseOrder.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
    },
  });

  const totalValue = pos.reduce((sum, po) => sum + (po.total || 0), 0);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">Purchase Orders</h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">Manage vendor orders and receipts</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowUpload(true)} variant="outline" className="min-h-[44px]">
            <Upload className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Upload</span>
          </Button>
          <Button onClick={() => { setEditingPO(null); setShowForm(true); }} className="bg-amber-600 hover:bg-amber-700 min-h-[44px]">
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Create</span>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-white rounded-lg sm:rounded-xl border border-amber-100 p-3 sm:p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs sm:text-sm text-slate-600">Total PO Value</p>
            <p className="text-lg sm:text-2xl font-semibold mt-0.5">${totalValue.toLocaleString()}</p>
          </div>
          <div className="text-right text-xs sm:text-sm text-slate-600">
            <p className="font-medium">{pos.length} orders</p>
          </div>
        </div>
      </div>

      {/* PO List */}
      {isLoading ? (
        <div className="space-y-3 sm:space-y-4">
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className="h-20 sm:h-16 bg-slate-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : pos.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No purchase orders"
          description="Create or upload your first purchase order"
          actionLabel="Create PO"
          onAction={() => setShowForm(true)}
        />
      ) : (
        <div className="sm:hidden space-y-2">
          {pos.map((po) => (
            <div key={po.id} className="bg-white rounded-lg border border-amber-100 p-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-slate-900 truncate">{po.po_number || 'Untitled'}</h3>
                  <p className="text-xs text-slate-600">{po.vendor}</p>
                </div>
                <Badge className={cn("border text-xs py-0.5 px-1.5 flex-shrink-0", statusColors[po.status])}>
                  {po.status?.replace('_', ' ')}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><p className="text-slate-500">Total</p><p className="font-semibold">${(po.total || 0).toLocaleString()}</p></div>
                <div><p className="text-slate-500">Date</p><p className="font-semibold">{po.po_date ? format(new Date(po.po_date), 'MMM d') : '-'}</p></div>
              </div>
              <div className="flex gap-1 pt-1 border-t border-slate-100">
                <Button size="sm" variant="ghost" onClick={() => { setEditingPO(po); setShowForm(true); }} className="flex-1">
                  <Edit2 className="h-3 w-3 mr-1" /> Edit
                </Button>
                <Button size="sm" variant="ghost" onClick={() => generatePDF(po)} className="flex-1">
                  <Download className="h-3 w-3 mr-1" /> PDF
                </Button>
                <Button size="sm" variant="ghost" onClick={() => deleteMutation.mutate(po.id)} className="flex-1 text-red-600">
                  <Trash2 className="h-3 w-3 mr-1" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Desktop Table */}
      {!isLoading && pos.length > 0 && (
        <div className="hidden sm:block bg-white rounded-xl border border-amber-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-amber-100 bg-amber-50/30">
                <tr>
                  <th className="text-left p-4 font-semibold text-xs text-slate-900">PO Number</th>
                  <th className="text-left p-4 font-semibold text-xs text-slate-900">Vendor</th>
                  <th className="text-left p-4 font-semibold text-xs text-slate-900">Date</th>
                  <th className="text-left p-4 font-semibold text-xs text-slate-900">Total</th>
                  <th className="text-left p-4 font-semibold text-xs text-slate-900">Status</th>
                  <th className="text-right p-4 font-semibold text-xs text-slate-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pos.map((po) => (
                  <tr key={po.id} className="border-b border-slate-100 hover:bg-amber-50/30">
                    <td className="p-4 font-medium text-slate-900">{po.po_number || '-'}</td>
                    <td className="p-4 text-slate-600">{po.vendor}</td>
                    <td className="p-4 text-slate-600">{po.po_date ? format(new Date(po.po_date), 'MMM d, yyyy') : '-'}</td>
                    <td className="p-4 font-semibold">${(po.total || 0).toLocaleString()}</td>
                    <td className="p-4"><Badge className={cn("border text-xs", statusColors[po.status])}>{po.status?.replace('_', ' ')}</Badge></td>
                    <td className="p-4 text-right space-x-1">
                      <Button size="sm" variant="ghost" onClick={() => { setEditingPO(po); setShowForm(true); }}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => generatePDF(po)}>
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => deleteMutation.mutate(po.id)} className="text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Forms */}
      <POForm
        open={showForm}
        onOpenChange={(open) => { setShowForm(open); if (!open) setEditingPO(null); }}
        po={editingPO}
        projects={projects}
        onSubmit={(data) => {
          if (editingPO) {
            updateMutation.mutate({ id: editingPO.id, data });
          } else {
            createMutation.mutate(data);
          }
        }}
        loading={createMutation.isPending || updateMutation.isPending}
      />

      <UploadDialog
        open={showUpload}
        onOpenChange={setShowUpload}
        onUpload={(data) => {
          createMutation.mutate(data);
          setShowUpload(false);
        }}
        projects={projects}
      />
    </div>
  );
}

function generatePDF(po) {
  const doc = new jsPDF();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPos = 10;

  // Header
  doc.setFontSize(20);
  doc.text('PURCHASE ORDER', 20, yPos);
  yPos += 15;

  // PO Details
  doc.setFontSize(10);
  doc.text(`PO Number: ${po.po_number || 'N/A'}`, 20, yPos);
  yPos += 6;
  doc.text(`Date: ${po.po_date ? format(new Date(po.po_date), 'MMM d, yyyy') : 'N/A'}`, 20, yPos);
  yPos += 6;
  doc.text(`Vendor: ${po.vendor}`, 20, yPos);
  yPos += 10;

  // Line Items
  if (po.line_items && po.line_items.length > 0) {
    doc.text('Line Items:', 20, yPos);
    yPos += 6;
    
    po.line_items.forEach((item) => {
      if (yPos > pageHeight - 20) {
        doc.addPage();
        yPos = 10;
      }
      doc.setFontSize(9);
      doc.text(`${item.description} - Qty: ${item.quantity} @ $${(item.unit_price || 0).toFixed(2)}`, 20, yPos);
      yPos += 4;
    });
  }

  yPos += 5;

  // Totals
  doc.setFontSize(10);
  doc.text(`Subtotal: $${(po.subtotal || 0).toLocaleString()}`, 20, yPos);
  yPos += 6;
  if (po.tax) {
    doc.text(`Tax: $${(po.tax || 0).toLocaleString()}`, 20, yPos);
    yPos += 6;
  }
  if (po.shipping) {
    doc.text(`Shipping: $${(po.shipping || 0).toLocaleString()}`, 20, yPos);
    yPos += 6;
  }
  doc.setFontSize(12);
  doc.text(`Total: $${(po.total || 0).toLocaleString()}`, 20, yPos);

  doc.save(`PO-${po.po_number || 'export'}.pdf`);
}

function POForm({ open, onOpenChange, po, projects, onSubmit, loading }) {
  const [formData, setFormData] = React.useState(po || {
    project_id: '',
    po_number: '',
    vendor: '',
    po_date: format(new Date(), 'yyyy-MM-dd'),
    status: 'draft',
    subtotal: '',
    tax: '',
    shipping: '',
    total: '',
    line_items: [],
  });
  const [newItem, setNewItem] = React.useState({});

  React.useEffect(() => {
    if (po) {
      setFormData(po);
    } else {
      setFormData({
        project_id: '',
        po_number: '',
        vendor: '',
        po_date: format(new Date(), 'yyyy-MM-dd'),
        status: 'draft',
        subtotal: '',
        tax: '',
        shipping: '',
        total: '',
        line_items: [],
      });
    }
  }, [po]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const subtotal = parseFloat(formData.subtotal) || 0;
    const tax = parseFloat(formData.tax) || 0;
    const shipping = parseFloat(formData.shipping) || 0;
    const total = subtotal + tax + shipping;

    onSubmit({
      ...formData,
      subtotal,
      tax,
      shipping,
      total,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{po ? 'Edit PO' : 'Create Purchase Order'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>PO Number</Label>
              <Input
                value={formData.po_number}
                onChange={(e) => setFormData({ ...formData, po_number: e.target.value })}
                placeholder="PO-001"
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['draft', 'sent', 'acknowledged', 'partially_received', 'received', 'cancelled'].map(s => (
                    <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Vendor *</Label>
            <Input
              value={formData.vendor}
              onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
              placeholder="Vendor name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Date</Label>
            <Input type="date" value={formData.po_date} onChange={(e) => setFormData({ ...formData, po_date: e.target.value })} />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>Subtotal</Label>
              <Input type="number" value={formData.subtotal} onChange={(e) => setFormData({ ...formData, subtotal: e.target.value })} placeholder="0.00" />
            </div>
            <div className="space-y-2">
              <Label>Tax</Label>
              <Input type="number" value={formData.tax} onChange={(e) => setFormData({ ...formData, tax: e.target.value })} placeholder="0.00" />
            </div>
            <div className="space-y-2">
              <Label>Shipping</Label>
              <Input type="number" value={formData.shipping} onChange={(e) => setFormData({ ...formData, shipping: e.target.value })} placeholder="0.00" />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading || !formData.vendor} className="bg-slate-900 hover:bg-slate-800">
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {po ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function UploadDialog({ open, onOpenChange, projects, onUpload }) {
  const [file, setFile] = React.useState(null);
  const [formData, setFormData] = React.useState({
    project_id: '',
    po_number: '',
    vendor: '',
    po_date: format(new Date(), 'yyyy-MM-dd'),
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file && !formData.vendor) return;

    if (file) {
      const fileContent = await file.text();
      // Simple CSV parsing - adjust based on your format
      onUpload({
        ...formData,
        file_name: file.name,
      });
    } else {
      onUpload(formData);
    }
    setFile(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload Purchase Order</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Upload File (PDF, CSV, or Excel)</Label>
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-amber-400 transition-colors cursor-pointer">
              <input
                type="file"
                accept=".pdf,.csv,.xlsx,.xls"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer block">
                <Upload className="h-8 w-8 mx-auto mb-2 text-slate-400" />
                <p className="text-sm font-medium text-slate-700">Drop file here or click to browse</p>
                <p className="text-xs text-slate-500 mt-1">{file?.name || 'No file selected'}</p>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>PO Number</Label>
              <Input value={formData.po_number} onChange={(e) => setFormData({ ...formData, po_number: e.target.value })} placeholder="PO-001" />
            </div>
            <div className="space-y-2">
              <Label>Vendor *</Label>
              <Input value={formData.vendor} onChange={(e) => setFormData({ ...formData, vendor: e.target.value })} placeholder="Vendor" required />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={!formData.vendor} className="bg-slate-900 hover:bg-slate-800">
              <Upload className="h-4 w-4 mr-2" /> Upload
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}