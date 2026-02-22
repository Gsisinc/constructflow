import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, FileText, DollarSign, Clock, Package, Download, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function CostPlusInvoicing() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [selectedProject, setSelectedProject] = useState('');
  const [markup, setMarkup] = useState(15);
  const [selectedExpenses, setSelectedExpenses] = useState([]);
  const [selectedLaborHours, setSelectedLaborHours] = useState([]);
  const [invoiceTitle, setInvoiceTitle] = useState('');

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list(),
  });

  const { data: expenses = [] } = useQuery({
    queryKey: ['expenses', 'pending'],
    queryFn: () => base44.entities.Expense.filter({ status: 'approved' }, '-date'),
    enabled: !!selectedProject,
  });

  const { data: timeEntries = [] } = useQuery({
    queryKey: ['timeEntries'],
    queryFn: () => base44.entities.VehicleLog ? base44.entities.VehicleLog.list() : Promise.resolve([]),
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ['costPlusInvoices'],
    queryFn: () => base44.entities.Document.filter({ type: 'invoice' }, '-created_date'),
  });

  const projectExpenses = expenses.filter(e => e.project_id === selectedProject);

  const selectedExpensesTotal = projectExpenses
    .filter(e => selectedExpenses.includes(e.id))
    .reduce((s, e) => s + (e.amount || 0), 0);

  const markupAmount = selectedExpensesTotal * (markup / 100);
  const invoiceTotal = selectedExpensesTotal + markupAmount;

  const toggleExpense = (id) => {
    setSelectedExpenses(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Document.create({
      project_id: selectedProject,
      name: data.title,
      type: 'invoice',
      status: 'draft',
      notes: JSON.stringify({
        markup_pct: markup,
        expenses_total: selectedExpensesTotal,
        markup_amount: markupAmount,
        invoice_total: invoiceTotal,
        expense_ids: selectedExpenses,
      }),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['costPlusInvoices'] });
      setShowForm(false);
      setSelectedExpenses([]);
      setInvoiceTitle('');
      toast.success('Cost Plus invoice created');
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Cost Plus Invoicing</h1>
          <p className="text-slate-500 mt-1">Include bills, expenses, and time entries directly on invoices</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="h-4 w-4" /> New Cost Plus Invoice
        </Button>
      </div>

      {/* How it works */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="py-4">
          <div className="flex flex-wrap gap-6 text-sm">
            {[
              { icon: Package, label: 'Select Expenses', desc: 'Pick approved bills & materials' },
              { icon: Clock, label: 'Add Labor/Time', desc: 'Include billable hours' },
              { icon: DollarSign, label: 'Apply Markup', desc: 'Add your markup %' },
              { icon: FileText, label: 'Generate Invoice', desc: 'Send to client' },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-2 text-blue-800">
                <s.icon className="h-4 w-4" />
                <span className="font-medium">{s.label}</span>
                <span className="text-blue-600">— {s.desc}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Existing Invoices */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-5 w-5" /> Cost Plus Invoices
          </CardTitle>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <div className="py-10 text-center">
              <FileText className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No cost plus invoices yet</p>
              <Button className="mt-3" onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-2" /> Create First Invoice
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {invoices.map(inv => {
                let meta = {};
                try { meta = JSON.parse(inv.notes || '{}'); } catch {}
                return (
                  <div key={inv.id} className="flex items-center justify-between py-3 border-b last:border-0">
                    <div>
                      <p className="font-medium">{inv.name}</p>
                      <p className="text-sm text-slate-500">
                        {format(new Date(inv.created_date), 'MMM d, yyyy')} • Markup: {meta.markup_pct || 0}%
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="font-bold">${(meta.invoice_total || 0).toLocaleString()}</p>
                        <Badge className={inv.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}>
                          {inv.status}
                        </Badge>
                      </div>
                      <Button size="sm" variant="outline" className="gap-1">
                        <Eye className="h-3 w-3" /> View
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Invoice Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Cost Plus Invoice</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Invoice Title *</Label>
                <Input placeholder="Invoice #001 - March 2026"
                  value={invoiceTitle} onChange={e => setInvoiceTitle(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Project *</Label>
                <Select value={selectedProject} onValueChange={setSelectedProject}>
                  <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                  <SelectContent>
                    {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Markup Percentage (%)</Label>
              <div className="flex items-center gap-3">
                <Input type="number" value={markup} onChange={e => setMarkup(Number(e.target.value))}
                  className="w-32" min={0} max={100} />
                <span className="text-sm text-slate-500">Applied to all selected expenses</span>
              </div>
            </div>

            {selectedProject && (
              <div className="space-y-2">
                <Label>Select Expenses to Include</Label>
                {projectExpenses.length === 0 ? (
                  <p className="text-sm text-slate-400 py-3">No approved expenses for this project</p>
                ) : (
                  <div className="border rounded-lg divide-y max-h-48 overflow-y-auto">
                    {projectExpenses.map(e => (
                      <div key={e.id} className="flex items-center gap-3 px-3 py-2.5">
                        <Checkbox checked={selectedExpenses.includes(e.id)} onCheckedChange={() => toggleExpense(e.id)} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{e.description || e.vendor || 'Expense'}</p>
                          <p className="text-xs text-slate-500">{e.category} • {e.date}</p>
                        </div>
                        <span className="text-sm font-semibold flex-shrink-0">${(e.amount || 0).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Summary */}
            {selectedExpenses.length > 0 && (
              <div className="bg-slate-50 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Expenses Subtotal</span>
                  <span className="font-medium">${selectedExpensesTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Markup ({markup}%)</span>
                  <span className="font-medium">+${markupAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-base border-t pt-2">
                  <span>Invoice Total</span>
                  <span>${invoiceTotal.toLocaleString()}</span>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2 border-t">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button
                onClick={() => createMutation.mutate({ title: invoiceTitle })}
                disabled={!invoiceTitle || !selectedProject || selectedExpenses.length === 0 || createMutation.isPending}
                className="gap-2"
              >
                <FileText className="h-4 w-4" /> Create Invoice
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}