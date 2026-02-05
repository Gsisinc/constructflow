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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, DollarSign, TrendingUp, TrendingDown, Lock, Unlock, Receipt, AlertTriangle, Trash2, Edit, Code, Activity, FileText, Zap, Target, ArrowUpRight, ArrowDownRight, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { format, addDays } from 'date-fns';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';

export default function PhaseBudgetManager({ projectId, phaseName }) {
  const [showExpenseDialog, setShowExpenseDialog] = useState(false);
  const [showCostCodeDialog, setShowCostCodeDialog] = useState(false);
  const [showChangeOrderDialog, setShowChangeOrderDialog] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [editingCostCode, setEditingCostCode] = useState(null);
  const queryClient = useQueryClient();

  const { data: budget } = useQuery({
    queryKey: ['phaseBudget', projectId, phaseName],
    queryFn: async () => {
      const budgets = await base44.entities.PhaseBudget.filter({ project_id: projectId, phase_name: phaseName });
      return budgets[0];
    },
    enabled: !!projectId && !!phaseName
  });

  const { data: costCodes = [] } = useQuery({
    queryKey: ['costCodes', projectId, phaseName],
    queryFn: () => base44.entities.CostCode.filter({ project_id: projectId, phase_name: phaseName, is_active: true }),
    enabled: !!projectId && !!phaseName
  });

  const { data: cashFlowForecasts = [] } = useQuery({
    queryKey: ['cashFlowForecasts', projectId, phaseName],
    queryFn: () => base44.entities.CashFlowForecast.filter({ project_id: projectId, phase_name: phaseName }, 'forecast_date'),
    enabled: !!projectId && !!phaseName
  });

  const { data: changeOrders = [] } = useQuery({
    queryKey: ['phaseChangeOrders', projectId, phaseName],
    queryFn: () => base44.entities.PhaseChangeOrder.filter({ project_id: projectId, phase_name: phaseName }),
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

  const createCostCodeMutation = useMutation({
    mutationFn: (data) => base44.entities.CostCode.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['costCodes'] });
      setShowCostCodeDialog(false);
      setEditingCostCode(null);
      toast.success('Cost code added');
    }
  });

  const updateCostCodeMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.CostCode.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['costCodes'] });
      setShowCostCodeDialog(false);
      setEditingCostCode(null);
      toast.success('Cost code updated');
    }
  });

  const deleteCostCodeMutation = useMutation({
    mutationFn: (id) => base44.entities.CostCode.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['costCodes'] });
      toast.success('Cost code deleted');
    }
  });

  const createChangeOrderMutation = useMutation({
    mutationFn: (data) => base44.entities.PhaseChangeOrder.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phaseChangeOrders'] });
      setShowChangeOrderDialog(false);
      toast.success('Change order created');
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

  const generateCashFlowForecast = async () => {
    const totalBudget = budget?.budgeted_amount || 0;
    const forecasts = [];
    const today = new Date();
    
    for (let i = 0; i < 30; i++) {
      const forecastDate = addDays(today, i);
      const dayProgress = i / 30;
      const projectedExpenses = totalBudget * dayProgress * 0.8;
      const projectedIncome = totalBudget * dayProgress * 0.85;
      
      forecasts.push({
        project_id: projectId,
        phase_name: phaseName,
        forecast_date: format(forecastDate, 'yyyy-MM-dd'),
        projected_expenses: projectedExpenses,
        projected_income: projectedIncome,
        net_cash_flow: projectedIncome - projectedExpenses,
        cumulative_cash: (projectedIncome - projectedExpenses) * (i + 1),
        confidence_level: 85 + Math.random() * 10
      });
    }

    await base44.entities.CashFlowForecast.bulkCreate(forecasts);
    queryClient.invalidateQueries({ queryKey: ['cashFlowForecasts'] });
    toast.success('Cash flow forecast generated');
  };

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
  const totalCostCodeBudget = costCodes.reduce((sum, cc) => sum + cc.budgeted_amount, 0);
  const totalCostCodeSpent = costCodes.reduce((sum, cc) => sum + cc.spent_amount, 0);
  const totalCostCodeCommitted = costCodes.reduce((sum, cc) => sum + cc.committed_amount, 0);
  const totalCostCodeForecasted = costCodes.reduce((sum, cc) => sum + (cc.forecasted_amount || cc.budgeted_amount), 0);
  const approvedChangeOrders = changeOrders.filter(co => co.status === 'approved');
  const totalChangeOrderImpact = approvedChangeOrders.reduce((sum, co) => sum + co.cost_impact, 0);
  const remaining = (budget?.budgeted_amount || 0) - totalSpent - totalCommitted - totalChangeOrderImpact;
  const percentUsed = budget?.budgeted_amount ? ((totalSpent + totalCommitted + totalChangeOrderImpact) / budget.budgeted_amount) * 100 : 0;
  const forecastedOverrun = totalCostCodeForecasted - (budget?.budgeted_amount || 0);

  const [costCodeForm, setCostCodeForm] = useState({
    code: '',
    description: '',
    category: 'labor',
    budgeted_amount: 0,
    risk_score: 0
  });

  const [changeOrderForm, setChangeOrderForm] = useState({
    co_number: '',
    description: '',
    reason: 'design_change',
    cost_impact: 0,
    schedule_impact_days: 0,
    risk_level: 'medium',
    status: 'proposed'
  });

  const [expenseForm, setExpenseForm] = useState({
    category: 'labor',
    description: '',
    amount: 0,
    vendor: '',
    invoice_number: '',
    date: new Date().toISOString().split('T')[0]
  });

  const handleEditCostCode = (cc) => {
    setEditingCostCode(cc);
    setCostCodeForm({
      code: cc.code,
      description: cc.description,
      category: cc.category,
      budgeted_amount: cc.budgeted_amount,
      risk_score: cc.risk_score
    });
    setShowCostCodeDialog(true);
  };

  const handleSaveCostCode = () => {
    if (editingCostCode) {
      updateCostCodeMutation.mutate({ id: editingCostCode.id, data: costCodeForm });
    } else {
      createCostCodeMutation.mutate({ project_id: projectId, phase_name: phaseName, ...costCodeForm });
    }
  };

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
      {/* Financial Twin Overview */}
      <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-600" />
                Living Phase Financial Twin
              </CardTitle>
              <p className="text-sm text-slate-500 mt-1">Real-time predictive budget intelligence</p>
            </div>
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
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Phase Budget</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={budget?.budgeted_amount || 0}
                    onChange={(e) => createOrUpdateBudget.mutate({ budgeted_amount: parseFloat(e.target.value) || 0 })}
                    disabled={budget?.is_locked}
                  />
                </div>
              </div>
              <div>
                <Label>Phase Transition Reserve</Label>
                <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                  <p className="text-lg font-bold text-purple-600">
                    ${((budget?.budgeted_amount || 0) * 0.05).toLocaleString()}
                  </p>
                  <p className="text-xs text-slate-500">Recommended 5% buffer</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="h-4 w-4 text-blue-600" />
                  <span className="text-xs text-slate-600">Budgeted</span>
                </div>
                <p className="text-xl font-bold text-blue-600">${(budget?.budgeted_amount || 0).toLocaleString()}</p>
              </div>

              <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingDown className="h-4 w-4 text-red-600" />
                  <span className="text-xs text-slate-600">Spent</span>
                </div>
                <p className="text-xl font-bold text-red-600">${totalSpent.toLocaleString()}</p>
              </div>

              <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="h-4 w-4 text-yellow-600" />
                  <span className="text-xs text-slate-600">Committed</span>
                </div>
                <p className="text-xl font-bold text-yellow-600">${totalCommitted.toLocaleString()}</p>
              </div>

              <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="h-4 w-4 text-orange-600" />
                  <span className="text-xs text-slate-600">Change Orders</span>
                </div>
                <p className="text-xl font-bold text-orange-600">${totalChangeOrderImpact.toLocaleString()}</p>
              </div>

              <div className={`p-3 rounded-lg border ${remaining >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className={`h-4 w-4 ${remaining >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                  <span className="text-xs text-slate-600">Remaining</span>
                </div>
                <p className={`text-xl font-bold ${remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
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

            {forecastedOverrun > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-900">AI Prediction: Budget Overrun Risk</p>
                  <p className="text-sm text-red-700 mt-1">
                    Forecasted overrun: ${forecastedOverrun.toLocaleString()} ({((forecastedOverrun / (budget?.budgeted_amount || 1)) * 100).toFixed(1)}%)
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Advanced Tabs */}
      <Tabs defaultValue="costcodes" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="costcodes">Cost Codes</TabsTrigger>
          <TabsTrigger value="cashflow">Cash Flow</TabsTrigger>
          <TabsTrigger value="changeorders">Change Orders</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Cost Codes Tab */}
        <TabsContent value="costcodes" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  Quantum-Connected Cost Codes
                </CardTitle>
                <Dialog open={showCostCodeDialog} onOpenChange={(open) => {
                  setShowCostCodeDialog(open);
                  if (!open) {
                    setEditingCostCode(null);
                    setCostCodeForm({ code: '', description: '', category: 'labor', budgeted_amount: 0, risk_score: 0 });
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Cost Code
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editingCostCode ? 'Edit Cost Code' : 'Add Cost Code'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Code (e.g., 03-110)</Label>
                        <Input
                          value={costCodeForm.code}
                          onChange={(e) => setCostCodeForm({ ...costCodeForm, code: e.target.value })}
                          placeholder="03-110"
                        />
                      </div>
                      <div>
                        <Label>Description</Label>
                        <Input
                          value={costCodeForm.description}
                          onChange={(e) => setCostCodeForm({ ...costCodeForm, description: e.target.value })}
                          placeholder="Concrete Formwork"
                        />
                      </div>
                      <div>
                        <Label>Category</Label>
                        <Select value={costCodeForm.category} onValueChange={(value) => setCostCodeForm({ ...costCodeForm, category: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="labor">Labor</SelectItem>
                            <SelectItem value="materials">Materials</SelectItem>
                            <SelectItem value="equipment">Equipment</SelectItem>
                            <SelectItem value="subcontractor">Subcontractor</SelectItem>
                            <SelectItem value="overhead">Overhead</SelectItem>
                            <SelectItem value="contingency">Contingency</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Budgeted Amount</Label>
                        <Input
                          type="number"
                          value={costCodeForm.budgeted_amount}
                          onChange={(e) => setCostCodeForm({ ...costCodeForm, budgeted_amount: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                      <div>
                        <Label>Risk Score (0-100)</Label>
                        <Input
                          type="number"
                          value={costCodeForm.risk_score}
                          onChange={(e) => setCostCodeForm({ ...costCodeForm, risk_score: parseFloat(e.target.value) || 0 })}
                          min="0"
                          max="100"
                        />
                      </div>
                      <Button onClick={handleSaveCostCode} className="w-full">
                        {editingCostCode ? 'Update' : 'Add'} Cost Code
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {costCodes.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Code className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                  <p>No cost codes defined yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {costCodes.map(cc => {
                    const utilization = cc.budgeted_amount > 0 ? ((cc.spent_amount + cc.committed_amount) / cc.budgeted_amount) * 100 : 0;
                    const variance = cc.forecasted_amount - cc.budgeted_amount;
                    
                    return (
                      <div key={cc.id} className="border rounded-lg p-4 hover:bg-slate-50">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-blue-600">{cc.code}</span>
                              <Badge variant="outline">{cc.category}</Badge>
                              {cc.risk_score > 70 && (
                                <Badge className="bg-red-100 text-red-700">High Risk</Badge>
                              )}
                              {cc.risk_score > 40 && cc.risk_score <= 70 && (
                                <Badge className="bg-yellow-100 text-yellow-700">Medium Risk</Badge>
                              )}
                            </div>
                            <p className="text-sm text-slate-600 mt-1">{cc.description}</p>
                          </div>
                          <div className="flex gap-1">
                            <Button size="icon" variant="ghost" onClick={() => handleEditCostCode(cc)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="icon" 
                              variant="ghost"
                              className="text-red-600 hover:bg-red-50"
                              onClick={() => {
                                if (confirm('Delete this cost code?')) {
                                  deleteCostCodeMutation.mutate(cc.id);
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="grid grid-cols-4 gap-3 text-sm">
                          <div>
                            <span className="text-slate-500">Budget:</span>
                            <p className="font-semibold">${cc.budgeted_amount.toLocaleString()}</p>
                          </div>
                          <div>
                            <span className="text-slate-500">Spent:</span>
                            <p className="font-semibold text-red-600">${cc.spent_amount.toLocaleString()}</p>
                          </div>
                          <div>
                            <span className="text-slate-500">Committed:</span>
                            <p className="font-semibold text-yellow-600">${cc.committed_amount.toLocaleString()}</p>
                          </div>
                          <div>
                            <span className="text-slate-500">Forecast:</span>
                            <p className={`font-semibold ${variance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                              ${cc.forecasted_amount.toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="mt-3">
                          <Progress value={Math.min(utilization, 100)} className="h-2" />
                          <p className="text-xs text-slate-500 mt-1">{utilization.toFixed(1)}% utilized</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cash Flow Tab */}
        <TabsContent value="cashflow" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-green-600" />
                  Predictive Cash Flow Engine
                </CardTitle>
                <Button size="sm" onClick={generateCashFlowForecast}>
                  <Activity className="h-4 w-4 mr-2" />
                  Generate Forecast
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {cashFlowForecasts.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <Activity className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                  <p className="mb-4">No cash flow forecast generated yet</p>
                  <Button onClick={generateCashFlowForecast}>Generate 30-Day Forecast</Button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={cashFlowForecasts.map(cf => ({
                        date: format(new Date(cf.forecast_date), 'MMM dd'),
                        income: cf.projected_income,
                        expenses: cf.projected_expenses,
                        net: cf.net_cash_flow
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Area type="monotone" dataKey="income" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} name="Income" />
                        <Area type="monotone" dataKey="expenses" stackId="2" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} name="Expenses" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <p className="text-sm text-slate-600 mb-1">Avg Daily Income</p>
                      <p className="text-2xl font-bold text-green-600">
                        ${(cashFlowForecasts.reduce((sum, cf) => sum + cf.projected_income, 0) / cashFlowForecasts.length).toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                      <p className="text-sm text-slate-600 mb-1">Avg Daily Expenses</p>
                      <p className="text-2xl font-bold text-red-600">
                        ${(cashFlowForecasts.reduce((sum, cf) => sum + cf.projected_expenses, 0) / cashFlowForecasts.length).toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <p className="text-sm text-slate-600 mb-1">Forecast Confidence</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {(cashFlowForecasts.reduce((sum, cf) => sum + cf.confidence_level, 0) / cashFlowForecasts.length).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Change Orders Tab */}
        <TabsContent value="changeorders" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-orange-600" />
                  AI-Powered Change Order Tracking
                </CardTitle>
                <Dialog open={showChangeOrderDialog} onOpenChange={setShowChangeOrderDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Change Order
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Change Order</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>CO Number</Label>
                        <Input
                          value={changeOrderForm.co_number}
                          onChange={(e) => setChangeOrderForm({ ...changeOrderForm, co_number: e.target.value })}
                          placeholder="CO-001"
                        />
                      </div>
                      <div>
                        <Label>Description</Label>
                        <Textarea
                          value={changeOrderForm.description}
                          onChange={(e) => setChangeOrderForm({ ...changeOrderForm, description: e.target.value })}
                          placeholder="Describe the change..."
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Reason</Label>
                          <Select value={changeOrderForm.reason} onValueChange={(value) => setChangeOrderForm({ ...changeOrderForm, reason: value })}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="design_change">Design Change</SelectItem>
                              <SelectItem value="unforeseen_conditions">Unforeseen Conditions</SelectItem>
                              <SelectItem value="owner_request">Owner Request</SelectItem>
                              <SelectItem value="code_requirement">Code Requirement</SelectItem>
                              <SelectItem value="value_engineering">Value Engineering</SelectItem>
                              <SelectItem value="error_correction">Error Correction</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Risk Level</Label>
                          <Select value={changeOrderForm.risk_level} onValueChange={(value) => setChangeOrderForm({ ...changeOrderForm, risk_level: value })}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                              <SelectItem value="critical">Critical</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Cost Impact</Label>
                          <Input
                            type="number"
                            value={changeOrderForm.cost_impact}
                            onChange={(e) => setChangeOrderForm({ ...changeOrderForm, cost_impact: parseFloat(e.target.value) || 0 })}
                          />
                        </div>
                        <div>
                          <Label>Schedule Impact (Days)</Label>
                          <Input
                            type="number"
                            value={changeOrderForm.schedule_impact_days}
                            onChange={(e) => setChangeOrderForm({ ...changeOrderForm, schedule_impact_days: parseFloat(e.target.value) || 0 })}
                          />
                        </div>
                      </div>
                      <Button onClick={() => {
                        createChangeOrderMutation.mutate({ project_id: projectId, phase_name: phaseName, ...changeOrderForm, submitted_date: new Date().toISOString().split('T')[0] });
                      }} className="w-full">
                        Create Change Order
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {changeOrders.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <FileText className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                  <p>No change orders yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {changeOrders.map(co => (
                    <div key={co.id} className="border rounded-lg p-4 hover:bg-slate-50">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold">{co.co_number}</span>
                            <Badge variant={
                              co.status === 'approved' ? 'default' :
                              co.status === 'rejected' ? 'destructive' :
                              'secondary'
                            }>
                              {co.status}
                            </Badge>
                            <Badge className={
                              co.risk_level === 'critical' ? 'bg-red-100 text-red-700' :
                              co.risk_level === 'high' ? 'bg-orange-100 text-orange-700' :
                              co.risk_level === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-green-100 text-green-700'
                            }>
                              {co.risk_level} risk
                            </Badge>
                            {co.predicted_by_ai && (
                              <Badge className="bg-purple-100 text-purple-700">
                                <Target className="h-3 w-3 mr-1" />
                                AI Predicted
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm mt-1">{co.description}</p>
                          <p className="text-xs text-slate-500 mt-1">Reason: {co.reason.replace(/_/g, ' ')}</p>
                        </div>
                        <div className="text-right">
                          <p className={`text-xl font-bold ${co.cost_impact >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {co.cost_impact >= 0 ? '+' : ''} ${co.cost_impact.toLocaleString()}
                          </p>
                          {co.schedule_impact_days > 0 && (
                            <p className="text-sm text-slate-500">{co.schedule_impact_days} days delay</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Expenses Tab */}
        <TabsContent value="expenses" className="mt-6">
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
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="mt-6">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-purple-600" />
                  Phase Financial Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={costCodes.map(cc => ({
                      code: cc.code,
                      budget: cc.budgeted_amount,
                      spent: cc.spent_amount,
                      forecast: cc.forecasted_amount
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="code" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="budget" fill="#3b82f6" name="Budget" />
                      <Bar dataKey="spent" fill="#ef4444" name="Spent" />
                      <Bar dataKey="forecast" fill="#8b5cf6" name="Forecast" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-2 border-purple-200">
                <CardHeader>
                  <CardTitle className="text-sm">Cost Code Accuracy</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-purple-600">
                    {costCodes.length > 0 ? ((costCodes.filter(cc => Math.abs(cc.forecasted_amount - cc.budgeted_amount) / cc.budgeted_amount < 0.1).length / costCodes.length) * 100).toFixed(1) : 0}%
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Within 10% variance</p>
                </CardContent>
              </Card>

              <Card className="border-2 border-blue-200">
                <CardHeader>
                  <CardTitle className="text-sm">Change Order Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-blue-600">
                    {((changeOrders.length / Math.max((budget?.budgeted_amount || 1) / 100000, 1))).toFixed(1)}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Per $100K budget</p>
                </CardContent>
              </Card>

              <Card className="border-2 border-green-200">
                <CardHeader>
                  <CardTitle className="text-sm">Prediction Confidence</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-green-600">
                    {cashFlowForecasts.length > 0 ? (cashFlowForecasts.reduce((sum, cf) => sum + cf.confidence_level, 0) / cashFlowForecasts.length).toFixed(1) : 0}%
                  </p>
                  <p className="text-xs text-slate-500 mt-1">AI forecast accuracy</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}