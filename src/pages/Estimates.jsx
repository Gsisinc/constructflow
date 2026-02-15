import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, FileText, Calendar, DollarSign } from 'lucide-react';
import { format } from 'date-fns';

export default function Estimates() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: bidOpportunities = [] } = useQuery({
    queryKey: ['bidOpportunities'],
    queryFn: () => base44.entities.BidOpportunity.list('-created_date')
  });

  const { data: bidEstimates = [] } = useQuery({
    queryKey: ['bidEstimates'],
    queryFn: () => base44.entities.BidEstimate.list('-created_date')
  });

  const stats = {
    estimating: bidOpportunities.filter(b => b.status === 'estimating').length,
    approved: bidOpportunities.filter(b => b.status === 'submitted').length
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">Estimates</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 sm:mt-1">{user?.full_name}</p>
        </div>
        <div className="flex gap-1.5 sm:gap-2">
          <Button variant="outline" size="sm">
            <Search className="h-4 w-4" />
          </Button>
          <Link to={createPageUrl('BidOpportunities')}>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Estimate</span>
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Client Responses</CardTitle>
          </CardHeader>
          <CardContent>
            {bidOpportunities.filter(b => b.status === 'submitted').slice(0, 3).map((bid) => (
              <div key={bid.id} className="flex justify-between items-center py-2">
                <div>
                  <p className="font-medium text-sm">{bid.title}</p>
                  <p className="text-xs text-slate-500">{bid.client_name}</p>
                </div>
                <Badge className="bg-green-100 text-green-800">Approved</Badge>
              </div>
            ))}
            {bidOpportunities.filter(b => b.status === 'submitted').length === 0 && (
              <div className="text-center py-4 text-slate-400 text-sm">
                No Records Available
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Estimates Pending Approval</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4 text-slate-400 text-sm">
              No Records Available
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Won & Lost Estimates</CardTitle>
            <select className="text-sm border rounded px-2 py-1">
              <option>Last Month / This Month</option>
            </select>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Count (0)</span>
                <span className="text-sm font-medium">$0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Count (0)</span>
                <span className="text-sm font-medium">$0</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Estimates by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-32 bg-slate-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${(stats.estimating / (bidOpportunities.length || 1)) * 100}%` }}></div>
                </div>
                <span className="text-sm">Estimating ({stats.estimating})</span>
                <span className="text-sm text-slate-500">60.00%</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-slate-200 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{ width: `${(stats.approved / (bidOpportunities.length || 1)) * 100}%` }}></div>
                </div>
                <span className="text-sm">Approved ({stats.approved})</span>
                <span className="text-sm text-slate-500">40.00%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Estimates Out for Bid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4 text-slate-400 text-sm">
              No Records Available
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Bid Responses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-slate-400 text-sm">
            No Records Available
          </div>
        </CardContent>
      </Card>
    </div>
  );
}