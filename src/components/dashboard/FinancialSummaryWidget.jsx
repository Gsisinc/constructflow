import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function FinancialSummaryWidget() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ['projects', user?.organization_id],
    queryFn: async () => {
      if (!user?.organization_id) return [];
      const list = await base44.entities.Project.filter(
        { organization_id: user.organization_id },
        '-created_date'
      );
      return list.slice(0, 5); // Get top 5 projects
    },
    enabled: !!user?.organization_id
  });

  const [financialData, setFinancialData] = useState({
    totalBudget: 0,
    totalSpent: 0,
    totalRemaining: 0,
    projectCount: 0
  });

  useEffect(() => {
    if (projects.length > 0) {
      const totalBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0);
      const totalSpent = projects.reduce((sum, p) => sum + (p.spent || 0), 0);
      
      setFinancialData({
        totalBudget,
        totalSpent,
        totalRemaining: totalBudget - totalSpent,
        projectCount: projects.length
      });
    }
  }, [projects]);

  if (projectsLoading) {
    return (
      <Card className="p-6">
        <Skeleton className="h-32" />
      </Card>
    );
  }

  const budgetUtilization = financialData.totalBudget > 0 
    ? (financialData.totalSpent / financialData.totalBudget * 100).toFixed(1)
    : 0;

  return (
    <Card className="p-6 bg-gradient-to-br from-emerald-50 to-blue-50 border-emerald-200">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">Financial Summary</h3>
          <DollarSign className="h-5 w-5 text-emerald-600" />
        </div>

        {/* Financial Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-lg p-3 border border-emerald-100">
            <p className="text-xs text-slate-600 mb-1">Total Budget</p>
            <p className="text-lg font-bold text-slate-900">
              ${financialData.totalBudget.toLocaleString()}
            </p>
          </div>
          <div className="bg-white rounded-lg p-3 border border-red-100">
            <p className="text-xs text-slate-600 mb-1">Total Spent</p>
            <p className="text-lg font-bold text-red-600">
              ${financialData.totalSpent.toLocaleString()}
            </p>
          </div>
          <div className="bg-white rounded-lg p-3 border border-blue-100">
            <p className="text-xs text-slate-600 mb-1">Remaining</p>
            <p className="text-lg font-bold text-blue-600">
              ${financialData.totalRemaining.toLocaleString()}
            </p>
          </div>
          <div className="bg-white rounded-lg p-3 border border-amber-100">
            <p className="text-xs text-slate-600 mb-1">Utilization</p>
            <p className="text-lg font-bold text-amber-600">{budgetUtilization}%</p>
          </div>
        </div>

        {/* Budget Utilization Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600">Budget Utilization</span>
            <span className="font-semibold text-slate-900">{budgetUtilization}%</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all ${
                budgetUtilization > 90 ? 'bg-red-500' : 
                budgetUtilization > 75 ? 'bg-amber-500' : 
                'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(budgetUtilization, 100)}%` }}
            />
          </div>
        </div>

        {/* Quick Links */}
        <div className="flex gap-2 pt-2">
          <Link to={createPageUrl('FinancialDashboard')} className="flex-1">
            <Button variant="outline" size="sm" className="w-full text-xs">
              <TrendingUp className="h-3 w-3 mr-1" />
              Dashboard
            </Button>
          </Link>
          <Link to={createPageUrl('SalesInvoices')} className="flex-1">
            <Button variant="outline" size="sm" className="w-full text-xs">
              <DollarSign className="h-3 w-3 mr-1" />
              Invoices
            </Button>
          </Link>
          <Link to={createPageUrl('Reports')} className="flex-1">
            <Button variant="outline" size="sm" className="w-full text-xs">
              <ArrowRight className="h-3 w-3 mr-1" />
              Reports
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}
