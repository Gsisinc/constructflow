import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Plus, DollarSign, TrendingUp, TrendingDown, Lock, Unlock, Receipt, AlertTriangle, Trash2, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function PhaseBudgetManager({ projectId, phaseName }) {
  const [showExpenseDialog, setShowExpenseDialog] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const queryClient = useQueryClient();

  const { data: budget } = useQuery({
    queryKey: ['phaseBudget', projectId, phaseName],
    queryFn: async () => {
      const budgets = await base44.entities.PhaseBudget.filter({ project_id: projectId, phase_name: phaseName });
      return budgets[0];
    },
    enabled: !!projectId && !!phaseName
  });

  const { data: expenses = [] } = useQuery({
    queryKey: ['phaseExpenses', projectId, phaseName],
    queryFn: () => base44.entities.Expense.filter({ project_id: projectId }),
    enabled: !!projectId
  });

  const createOrUpdateBudget = useMutation({
    mutationFn: (data) => {
      if (budget) {
        return base44.entities.PhaseBudget.update(budget.id, data);
      }
      return base44.entities.PhaseBudget.create({ project_id: projectId, phase_name: phaseName, ...data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phaseBudget'] });
      toast.success('Budget updated');
    }
  });

  const createExpenseMutation = useMutation({
    mutationFn: (data) => base44.entities.Expense.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phaseExpenses'] });
      setShowExpenseDialog(false);
      setEditingExpense(null);
      toast.success('Expense added');
    }
  });

  const updateExpenseMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Expense.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phaseExpenses'] });
      setShowExpenseDialog(false);
      setEditingExpense(null);
      toast.success('Expense updated');
    }
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: (id) => base44.entities.Expense.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phaseExpenses'] });
      toast.success('Expense deleted');
    }
  });

  const toggleLock = () => {
    if (budget) {
      createOrUpdateBudget.mutate({
        is_locked: !budget.is_locked,
        locked_date: !budget.is_locked ? new Date().toISOString().split('T')[0] : null
      });
    }
  };

  const totalSpent = expenses.reduce((sum, e) => sum + (e.status === 'paid' ? e.amount : 0), 0);
  const totalPending = expenses.reduce((sum, e) => sum + (e.status === 'pending' ? e.amount : 0), 0);
  const totalCommitted = expenses.reduce((sum, e) => sum + (e.status === 'approved' ? e.amount : 0), 0);
  const remaining = (budget?.budgeted_amount || 0) - totalSpent - totalCommitted;
  const percentUsed = budget?.budgeted_amount ? ((totalSpent + totalCommitted) / budget.budgeted_amount) * 100 : 0;

  const [budgetForm, setBudgetForm] = useState({
    budgeted_amount: budget?.budgeted_amount || 0
  });

  const [expenseForm, setExpenseForm] = useState({
    category: 'labor',
    description: '',
    amount: 0,
    vendor: '',
    invoice_number: '',
    date: new Date().toISOString().split('T')[0]
  });

  const handleEditExpense = (expense) => {
    setEditingExpense(expense);
    setExpenseForm({
      category: expense.category,
      description: expense.description,
      amount: expense.amount,
      vendor: expense.vendor || '',
      invoice_number: expense.invoice_number || '',
      date: expense.date
    });
    setShowExpenseDialog(true);
  };

  const handleSaveExpense = () => {
    if (editingExpense) {
      updateExpenseMutation.mutate({ id: editingExpense.id, data: expenseForm });
    } else {
      createExpenseMutation.mutate({ project_id: projectId, status: 'pending', ...expenseForm });
    }
  };

  return (
    <div className="space-y-6">
      {/* Budget Overview */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Budget Overview</CardTitle>
            <div className="flex gap-2">
              {budget?.is_locked ? (
                <Button size="sm" variant="outline" onClick={toggleLock}>
                  <Unlock className="h-4 w-4 mr-2" />
                  Unlock Budget
                </Button>
              ) : (
                <Button size="sm" variant="outline" onClick={toggleLock}>
                  <Lock className="h-4 w-4 mr-2" />
                  Lock Budget
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {budget?.is_locked ? (
            <div className="text-center py-8 text-slate-500">
              <Lock className="h-12 w-12 mx-auto mb-3 text-slate-300" />
              <p>Budget is locked. Unlock to make changes.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Total Budget</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      value={budgetForm.budgeted_amount}
                      onChange={(e) => setBudgetForm({ budgeted_amount: parseFloat(e.target.value) || 0 })}
                    />
                    <Button onClick={() => createOrUpdateBudget.mutate(budgetForm)}>
                      Save
                    </Button>
                  </div>
                </div>
              </div>

              {budget && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <DollarSign className="h-4 w-4 text-blue-600" />
                        <span className="text-sm text-slate-600">Budgeted</span>
                      </div>
                      <p className="text-2xl font-bold text-blue-600">${budget.budgeted_amount.toLocaleString()}</p>
                    </div>

                    <div className="bg-red-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <TrendingDown className="h-4 w-4 text-red-600" />
                        <span className="text-sm text-slate-600">Spent</span>
                      </div>
                      <p className="text-2xl font-bold text-red-600">${totalSpent.toLocaleString()}</p>
                    </div>

                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        <span className="text-sm text-slate-600">Committed</span>
                      </div>
                      <p className="text-2xl font-bold text-yellow-600">${totalCommitted.toLocaleString()}</p>
                    </div>

                    <div className={`p-4 rounded-lg ${remaining >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <TrendingUp className={`h-4 w-4 ${remaining >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                        <span className="text-sm text-slate-600">Remaining</span>
                      </div>
                      <p className={`text-2xl font-bold ${remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${remaining.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Budget Utilization</span>
                      <span className="font-semibold">{percentUsed.toFixed(1)}%</span>
                    </div>
                    <Progress value={Math.min(percentUsed, 100)} className="h-3" />
                  </div>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Expenses */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Expenses</CardTitle>
            <Dialog open={showExpenseDialog} onOpenChange={(open) => {
              setShowExpenseDialog(open);
              if (!open) {
                setEditingExpense(null);
                setExpenseForm({
                  category: 'labor',
                  description: '',
                  amount: 0,
                  vendor: '',
                  invoice_number: '',
                  date: new Date().toISOString().split('T')[0]
                });
              }
            }}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Expense
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingExpense ? 'Edit Expense' : 'Add Expense'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Category</Label>
                    <Select value={expenseForm.category} onValueChange={(value) => setExpenseForm({ ...expenseForm, category: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="labor">Labor</SelectItem>
                        <SelectItem value="materials">Materials</SelectItem>
                        <SelectItem value="equipment">Equipment</SelectItem>
                        <SelectItem value="subcontractor">Subcontractor</SelectItem>
                        <SelectItem value="permits">Permits</SelectItem>
                        <SelectItem value="overhead">Overhead</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={expenseForm.description}
                      onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                      placeholder="What is this expense for?"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Amount</Label>
                      <Input
                        type="number"
                        value={expenseForm.amount}
                        onChange={(e) => setExpenseForm({ ...expenseForm, amount: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div>
                      <Label>Date</Label>
                      <Input
                        type="date"
                        value={expenseForm.date}
                        onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Vendor</Label>
                    <Input
                      value={expenseForm.vendor}
                      onChange={(e) => setExpenseForm({ ...expenseForm, vendor: e.target.value })}
                      placeholder="Vendor name"
                    />
                  </div>

                  <div>
                    <Label>Invoice Number</Label>
                    <Input
                      value={expenseForm.invoice_number}
                      onChange={(e) => setExpenseForm({ ...expenseForm, invoice_number: e.target.value })}
                      placeholder="Invoice #"
                    />
                  </div>

                  <Button onClick={handleSaveExpense} className="w-full">
                    {editingExpense ? 'Update' : 'Add'} Expense
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {expenses.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Receipt className="h-12 w-12 mx-auto mb-3 text-slate-300" />
              <p>No expenses recorded yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {expenses.map(expense => (
                <div key={expense.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={
                        expense.status === 'paid' ? 'default' :
                        expense.status === 'approved' ? 'secondary' :
                        expense.status === 'rejected' ? 'destructive' :
                        'outline'
                      }>
                        {expense.status}
                      </Badge>
                      <span className="text-sm text-slate-500">{expense.category}</span>
                    </div>
                    <p className="font-medium">{expense.description}</p>
                    <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                      {expense.vendor && <span>Vendor: {expense.vendor}</span>}
                      {expense.invoice_number && <span>Invoice: {expense.invoice_number}</span>}
                      <span>{format(new Date(expense.date), 'MMM d, yyyy')}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xl font-bold">${expense.amount.toLocaleString()}</span>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => handleEditExpense(expense)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="ghost"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => {
                          if (confirm('Delete this expense?')) {
                            deleteExpenseMutation.mutate(expense.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}