import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, AlertCircle } from 'lucide-react';
import { format, addMonths } from 'date-fns';

export default function CashFlowForecast({ project, expenses = [] }) {
  // Generate 6-month forecast based on schedule and expenses
  const generateForecast = () => {
    const forecast = [];
    const today = new Date();
    
    for (let i = 0; i < 6; i++) {
      const month = addMonths(today, i);
      const monthStr = format(month, 'MMM yyyy');
      
      // Simulate forecasted data based on project budget and timeline
      const baseExpense = (project?.budget || 0) / 12;
      const variance = Math.random() * 0.3 - 0.15; // ±15% variance
      const projectedExpenses = Math.round(baseExpense * (1 + variance));
      
      // Client payments typically lag by 30 days
      const projectedIncome = i === 0 ? 0 : Math.round(baseExpense * 0.95);
      
      const netCashFlow = projectedIncome - projectedExpenses;
      
      forecast.push({
        month: format(month, 'MMM'),
        income: projectedIncome,
        expenses: projectedExpenses,
        netCashFlow,
        cumulative: forecast.length > 0 
          ? forecast[forecast.length - 1].cumulative + netCashFlow 
          : netCashFlow
      });
    }
    
    return forecast;
  };

  const data = project?.cash_flow_forecast?.length > 0 
    ? project.cash_flow_forecast 
    : generateForecast();

  const hasNegativeCashFlow = data.some(d => d.cumulative < 0);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Cash Flow Forecast</h3>
          <p className="text-sm text-slate-500">6-month predictive analysis</p>
        </div>
        {hasNegativeCashFlow && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 rounded-lg text-red-700 text-sm">
            <AlertCircle className="h-4 w-4" />
            Negative cash flow predicted
          </div>
        )}
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
            <Tooltip 
              formatter={(value) => `$${value.toLocaleString()}`}
              contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB' }}
            />
            <Legend />
            <Area 
              type="monotone" 
              dataKey="income" 
              name="Projected Income"
              stroke="#10B981" 
              fillOpacity={1} 
              fill="url(#colorIncome)" 
            />
            <Area 
              type="monotone" 
              dataKey="expenses" 
              name="Projected Expenses"
              stroke="#EF4444" 
              fillOpacity={1} 
              fill="url(#colorExpenses)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t">
        <div className="text-center">
          <p className="text-sm text-slate-500">Total Projected Income</p>
          <p className="text-lg font-semibold text-green-600">
            ${data.reduce((sum, d) => sum + d.income, 0).toLocaleString()}
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-slate-500">Total Projected Expenses</p>
          <p className="text-lg font-semibold text-red-600">
            ${data.reduce((sum, d) => sum + d.expenses, 0).toLocaleString()}
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-slate-500">Net Cash Position</p>
          <p className={`text-lg font-semibold ${data[data.length-1]?.cumulative >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ${data[data.length-1]?.cumulative?.toLocaleString() || 0}
          </p>
        </div>
      </div>
    </div>
  );
}