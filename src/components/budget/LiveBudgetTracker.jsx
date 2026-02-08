import React from 'react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, AlertTriangle, DollarSign, Clock, FileText } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export default function LiveBudgetTracker({ project, expenses = [], changeOrders = [] }) {
  const originalBudget = project?.budget || 0;
  const approvedExpenses = expenses.filter(e => e.status === 'approved' || e.status === 'paid').reduce((sum, e) => sum + (e.amount || 0), 0);
  const spent = approvedExpenses > 0 ? approvedExpenses : project?.spent || 0;
  const committedCosts = project?.committed_costs || 0;
  const pendingCosts = changeOrders.filter(co => co.status === 'pending_review' || co.status === 'client_review')
    .reduce((sum, co) => sum + (co.cost_impact || 0), 0);
  
  const projectedFinalCost = project?.projected_final_cost || (spent + committedCosts + pendingCosts);
  const contingency = originalBudget * (project?.contingency_percent || 10) / 100;
  const remainingBudget = originalBudget - spent;
  const budgetVariance = originalBudget - projectedFinalCost;

  const pieData = [
    { name: 'Spent', value: spent, color: '#10B981' },
    { name: 'Committed', value: committedCosts, color: '#3B82F6' },
    { name: 'Pending Changes', value: pendingCosts, color: '#F59E0B' },
    { name: 'Remaining', value: Math.max(0, remainingBudget - committedCosts - pendingCosts), color: '#E5E7EB' },
  ].filter(d => d.value > 0);

  const healthColor = budgetVariance >= 0 ? 'text-green-600' : budgetVariance >= -contingency ? 'text-amber-600' : 'text-red-600';

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">Living Budget</h3>
        <div className={cn("flex items-center gap-1 text-sm font-medium", healthColor)}>
          {budgetVariance >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
          {budgetVariance >= 0 ? 'Under Budget' : 'Over Budget'}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-50 rounded-xl p-4">
          <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
            <DollarSign className="h-4 w-4" />
            Original Budget
          </div>
          <p className="text-xl font-semibold">${originalBudget.toLocaleString()}</p>
        </div>
        <div className="bg-green-50 rounded-xl p-4">
          <div className="flex items-center gap-2 text-green-600 text-sm mb-1">
            <TrendingDown className="h-4 w-4" />
            Spent to Date
          </div>
          <p className="text-xl font-semibold text-green-700">${spent.toLocaleString()}</p>
        </div>
        <div className="bg-blue-50 rounded-xl p-4">
          <div className="flex items-center gap-2 text-blue-600 text-sm mb-1">
            <FileText className="h-4 w-4" />
            Committed Costs
          </div>
          <p className="text-xl font-semibold text-blue-700">${committedCosts.toLocaleString()}</p>
        </div>
        <div className="bg-amber-50 rounded-xl p-4">
          <div className="flex items-center gap-2 text-amber-600 text-sm mb-1">
            <Clock className="h-4 w-4" />
            Pending Changes
          </div>
          <p className="text-xl font-semibold text-amber-700">${pendingCosts.toLocaleString()}</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1">
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-4 mt-2">
            {pieData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-xs text-slate-600">{item.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 space-y-4">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-4 text-white">
            <p className="text-slate-400 text-sm">Projected Final Cost</p>
            <p className="text-2xl font-semibold mt-1">${projectedFinalCost.toLocaleString()}</p>
            <div className={cn("flex items-center gap-1 mt-2 text-sm", 
              budgetVariance >= 0 ? "text-green-400" : "text-red-400"
            )}>
              {budgetVariance >= 0 ? (
                <>
                  <TrendingDown className="h-4 w-4" />
                  ${Math.abs(budgetVariance).toLocaleString()} under budget
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4" />
                  ${Math.abs(budgetVariance).toLocaleString()} over budget
                </>
              )}
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-500">Budget Utilization</span>
              <span className="font-medium">{((spent / originalBudget) * 100).toFixed(1)}%</span>
            </div>
            <Progress value={(spent / originalBudget) * 100} className="h-2" />
          </div>

          <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <span className="text-sm text-amber-800">
              Contingency: ${contingency.toLocaleString()} ({project?.contingency_percent || 10}%)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}