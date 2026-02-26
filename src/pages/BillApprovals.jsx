import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, FileText } from 'lucide-react';
import { format } from 'date-fns';

/**
 * Bill Approval Workflows – Approve or reject bills/vendor invoices.
 * Matches: Bill Approval Workflows.
 */
export default function BillApprovals() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('pending');

  const { data: expenses = [] } = useQuery({
    queryKey: ['expenses', 'billApprovals'],
    queryFn: () => base44.entities.Expense.list('-created_at')
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Expense.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['expenses', 'billApprovals'] })
  });

  const pendingBills = expenses.filter(e => (e.status === 'pending' || e.status === 'pending_approval') && e.amount > 0);
  const approved = expenses.filter(e => e.status === 'approved' || e.status === 'paid');
  const rejected = expenses.filter(e => e.status === 'rejected');

  const handleApprove = (id) => updateMutation.mutate({ id, data: { status: 'approved' } });
  const handleReject = (id) => updateMutation.mutate({ id, data: { status: 'rejected' } });

  const list = filter === 'pending' ? pendingBills : filter === 'approved' ? approved : rejected;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Bill Approval Workflows</h1>
        <p className="text-slate-600 mt-1">Review and approve or reject vendor bills and expenses.</p>
      </div>

      <div className="flex gap-2">
        <Button variant={filter === 'pending' ? 'default' : 'outline'} onClick={() => setFilter('pending')}>
          Pending ({pendingBills.length})
        </Button>
        <Button variant={filter === 'approved' ? 'default' : 'outline'} onClick={() => setFilter('approved')}>
          Approved
        </Button>
        <Button variant={filter === 'rejected' ? 'default' : 'outline'} onClick={() => setFilter('rejected')}>
          Rejected
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5" /> Bills
          </CardTitle>
        </CardHeader>
        <CardContent>
          {list.length === 0 ? (
            <p className="text-slate-600 py-6 text-center">No bills in this category.</p>
          ) : (
            <ul className="space-y-3">
              {list.map((bill) => (
                <li key={bill.id} className="flex items-center justify-between py-3 border-b last:border-0">
                  <div>
                    <p className="font-medium">{bill.description || bill.vendor || 'Bill'}</p>
                    <p className="text-sm text-slate-600">
                      ${Number(bill.amount || 0).toLocaleString()} • {bill.expense_date || bill.date ? format(new Date(bill.expense_date || bill.date), 'MMM d, yyyy') : '—'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {filter === 'pending' && (
                      <>
                        <Button size="sm" className="gap-1" onClick={() => handleApprove(bill.id)}><Check className="h-4 w-4" /> Approve</Button>
                        <Button size="sm" variant="outline" className="gap-1" onClick={() => handleReject(bill.id)}><X className="h-4 w-4" /> Reject</Button>
                      </>
                    )}
                    {filter !== 'pending' && <Badge>{bill.status}</Badge>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
