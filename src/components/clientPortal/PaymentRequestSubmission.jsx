import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DollarSign,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  Download,
  Eye,
  Send,
  Calendar,
  User,
  TrendingUp
} from 'lucide-react';

export default function PaymentRequestSubmission() {
  const [invoices] = useState([
    {
      id: 'INV-2024-001',
      invoiceNumber: '#001',
      period: 'January 2024',
      amount: 250000,
      status: 'paid',
      submittedDate: new Date('2024-02-01'),
      dueDate: new Date('2024-02-15'),
      paidDate: new Date('2024-02-10'),
      description: 'Foundation & Site Preparation - Phase 1',
      items: [
        { description: 'Labor', amount: 120000 },
        { description: 'Materials', amount: 100000 },
        { description: 'Equipment Rental', amount: 30000 }
      ]
    },
    {
      id: 'INV-2024-002',
      invoiceNumber: '#002',
      period: 'February 2024',
      amount: 320000,
      status: 'paid',
      submittedDate: new Date('2024-03-01'),
      dueDate: new Date('2024-03-15'),
      paidDate: new Date('2024-03-12'),
      description: 'Structural Work - Phase 1 Continuation',
      items: [
        { description: 'Labor', amount: 180000 },
        { description: 'Materials', amount: 120000 },
        { description: 'Equipment Rental', amount: 20000 }
      ]
    },
    {
      id: 'INV-2024-003',
      invoiceNumber: '#003',
      period: 'March 2024',
      amount: 280000,
      status: 'approved',
      submittedDate: new Date('2024-04-01'),
      dueDate: new Date('2024-04-15'),
      approvedDate: new Date('2024-04-05'),
      description: 'MEP Systems Installation - Phase 2',
      items: [
        { description: 'Labor', amount: 140000 },
        { description: 'Materials', amount: 110000 },
        { description: 'Equipment Rental', amount: 30000 }
      ]
    },
    {
      id: 'INV-2024-004',
      invoiceNumber: '#004',
      period: 'April 2024',
      amount: 310000,
      status: 'pending',
      submittedDate: new Date('2024-05-01'),
      dueDate: new Date('2024-05-15'),
      description: 'Interior Finishes - Phase 2',
      items: [
        { description: 'Labor', amount: 160000 },
        { description: 'Materials', amount: 130000 },
        { description: 'Equipment Rental', amount: 20000 }
      ]
    }
  ]);

  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'paid':
        return { label: 'Paid', color: 'bg-green-100 text-green-800', icon: CheckCircle2 };
      case 'approved':
        return { label: 'Approved', color: 'bg-blue-100 text-blue-800', icon: CheckCircle2 };
      case 'pending':
        return { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: Clock };
      default:
        return { label: status, color: 'bg-slate-100 text-slate-800', icon: AlertCircle };
    }
  };

  const stats = {
    total: invoices.reduce((sum, inv) => sum + inv.amount, 0),
    paid: invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.amount, 0),
    pending: invoices.filter(inv => inv.status === 'pending').reduce((sum, inv) => sum + inv.amount, 0),
    approved: invoices.filter(inv => inv.status === 'approved').reduce((sum, inv) => sum + inv.amount, 0)
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <DollarSign className="w-8 h-8 text-green-600" />
          Payment Requests & Invoices
        </h1>
        <p className="text-slate-600 mt-1">Track and manage all project invoices and payments</p>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600">Total Invoiced</p>
            <p className="text-2xl font-bold mt-2 text-blue-600">${(stats.total / 1000000).toFixed(2)}M</p>
          </CardContent>
        </Card>
        <Card className="border-green-200">
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600">Paid</p>
            <p className="text-2xl font-bold mt-2 text-green-600">${(stats.paid / 1000000).toFixed(2)}M</p>
          </CardContent>
        </Card>
        <Card className="border-blue-200">
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600">Approved</p>
            <p className="text-2xl font-bold mt-2 text-blue-600">${(stats.approved / 1000000).toFixed(2)}M</p>
          </CardContent>
        </Card>
        <Card className="border-yellow-200">
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600">Pending</p>
            <p className="text-2xl font-bold mt-2 text-yellow-600">${(stats.pending / 1000000).toFixed(2)}M</p>
          </CardContent>
        </Card>
      </div>

      {/* Invoices List */}
      <div className="space-y-4">
        {invoices.map((invoice) => {
          const statusInfo = getStatusBadge(invoice.status);
          const StatusIcon = statusInfo.icon;

          return (
            <Card 
              key={invoice.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setSelectedInvoice(selectedInvoice?.id === invoice.id ? null : invoice)}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold">{invoice.invoiceNumber} - {invoice.period}</h3>
                      <Badge className={statusInfo.color}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {statusInfo.label}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-600">{invoice.description}</p>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-2xl font-bold text-green-600">${invoice.amount.toLocaleString()}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 py-4 border-y">
                  <div>
                    <p className="text-xs text-slate-600">Submitted</p>
                    <p className="font-medium flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {invoice.submittedDate.toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600">Due Date</p>
                    <p className="font-medium">{invoice.dueDate.toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600">Status</p>
                    <p className="font-medium">
                      {invoice.status === 'paid' && `Paid ${invoice.paidDate.toLocaleDateString()}`}
                      {invoice.status === 'approved' && `Approved ${invoice.approvedDate.toLocaleDateString()}`}
                      {invoice.status === 'pending' && 'Awaiting Review'}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="text-sm text-slate-600">
                    {invoice.items.length} line items
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="gap-2">
                      <Eye className="w-4 h-4" />
                      View
                    </Button>
                    <Button size="sm" variant="outline" className="gap-2">
                      <Download className="w-4 h-4" />
                      Download
                    </Button>
                    {invoice.status === 'pending' && (
                      <Button size="sm" className="gap-2 bg-blue-600 hover:bg-blue-700">
                        <Send className="w-4 h-4" />
                        Send for Approval
                      </Button>
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                {selectedInvoice?.id === invoice.id && (
                  <div className="mt-6 pt-6 border-t space-y-4">
                    <div>
                      <h4 className="font-semibold mb-3">Invoice Items</h4>
                      <div className="space-y-2">
                        {invoice.items.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded">
                            <span className="text-sm">{item.description}</span>
                            <span className="font-semibold">${item.amount.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <span className="font-semibold">Total Invoice Amount</span>
                      <span className="text-xl font-bold text-blue-600">${invoice.amount.toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Payment Terms */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle>Payment Terms</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>• Invoices are due within 15 days of submission</p>
          <p>• Payment can be made via ACH transfer, check, or credit card</p>
          <p>• Late payments may incur 1.5% monthly interest</p>
          <p>• All invoices are subject to final inspection and approval</p>
        </CardContent>
      </Card>
    </div>
  );
}
