import React, { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { buildCostToComplete, buildVendorScorecards, levelSubcontractorBids } from '@/lib/phase2';
import { createAuditLog } from '@/lib/auditLog';
import { toast } from 'sonner';
import { CheckCircle2, Clock, TrendingUp } from 'lucide-react';

export default function Phase2Operations() {
  const queryClient = useQueryClient();

  const { data: user } = useQuery({ queryKey: ['currentUser', 'phase2'], queryFn: () => base44.auth.me() });

  const { data: subcontractorBids = [] } = useQuery({
    queryKey: ['subcontractorBids'],
    queryFn: async () => {
      try {
        return await base44.entities.SubcontractorBid.list('-created_date');
      } catch (error) {
        console.warn('SubcontractorBid entity not found; returning empty.', error);
        return [];
      }
    }
  });

  const { data: purchaseOrders = [] } = useQuery({ queryKey: ['purchaseOrders'], queryFn: () => base44.entities.PurchaseOrder.list('-created_date') });
  const { data: invoices = [] } = useQuery({ queryKey: ['invoices'], queryFn: () => base44.entities.Invoice.list('-created_date') });
  const { data: projects = [] } = useQuery({ queryKey: ['projects', 'phase2'], queryFn: () => base44.entities.Project.list('-created_date') });
  const { data: expenses = [] } = useQuery({ queryKey: ['expenses', 'phase2'], queryFn: () => base44.entities.Expense.list('-created_date') });
  const { data: changeOrders = [] } = useQuery({ queryKey: ['changeOrders', 'phase2'], queryFn: () => base44.entities.ChangeOrder.list('-created_date') });

  const leveledBids = useMemo(() => levelSubcontractorBids(subcontractorBids), [subcontractorBids]);
  const vendorScorecards = useMemo(() => buildVendorScorecards(purchaseOrders, invoices), [purchaseOrders, invoices]);
  const costForecast = useMemo(() => buildCostToComplete({ projects, expenses, changeOrders }), [projects, expenses, changeOrders]);

  const changeOrderAction = useMutation({
    mutationFn: async ({ changeOrder, status }) => {
      const updated = await base44.entities.ChangeOrder.update(changeOrder.id, {
        ...changeOrder,
        status,
        approved_date: status === 'approved' ? new Date().toISOString().split('T')[0] : changeOrder.approved_date || null
      });

      await createAuditLog({
        organizationId: user?.organization_id,
        userId: user?.id,
        action: status === 'approved' ? 'change_order_approved' : 'change_order_rejected',
        entityType: 'ChangeOrder',
        entityId: changeOrder.id,
        before: changeOrder,
        after: updated
      });

      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['changeOrders', 'phase2'] });
      toast.success('Change order status updated.');
    },
    onError: () => toast.error('Failed to update change order status.')
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Phase 2 Operations Center</h1>
        <p className="text-sm text-slate-600 mt-1">Bid leveling, change order approvals, and cost-to-complete forecasting.</p>
      </div>

      <Tabs defaultValue="leveling" className="space-y-4">
        <TabsList>
          <TabsTrigger value="leveling">Subcontractor Bid Leveling</TabsTrigger>
          <TabsTrigger value="approvals">Change Order Lifecycle</TabsTrigger>
          <TabsTrigger value="forecast">Cost-to-Complete Forecast</TabsTrigger>
        </TabsList>

        <TabsContent value="leveling" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ranked Bid Leveling Table</CardTitle>
            </CardHeader>
            <CardContent>
              {leveledBids.length === 0 ? (
                <p className="text-sm text-slate-500">No subcontractor bids found. Populate `SubcontractorBid` to activate ranking.</p>
              ) : (
                <div className="space-y-2">
                  {leveledBids.map((bid, index) => (
                    <div key={bid.id || `${bid.vendor}-${index}`} className="border rounded-lg p-3 flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-slate-900">#{index + 1} {bid.vendor || bid.subcontractor_name || 'Vendor'}</p>
                        <p className="text-xs text-slate-500">Amount: ${(bid.bid_amount || 0).toLocaleString()} • Compliance: {bid.compliance_score || 0}</p>
                      </div>
                      <Badge>{bid.weighted_score}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Vendor Scorecards</CardTitle>
            </CardHeader>
            <CardContent>
              {vendorScorecards.length === 0 ? (
                <p className="text-sm text-slate-500">No purchase orders/invoices to score yet.</p>
              ) : (
                <div className="space-y-2">
                  {vendorScorecards.map((vendor) => (
                    <div key={vendor.vendor} className="border rounded-lg p-3 flex justify-between items-center">
                      <div>
                        <p className="font-medium">{vendor.vendor}</p>
                        <p className="text-xs text-slate-500">POs: {vendor.po_count} • On-time: {vendor.on_time_deliveries} • Invoices: ${vendor.invoice_total.toLocaleString()}</p>
                      </div>
                      <Badge className={vendor.score >= 80 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                        Score {vendor.score}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approvals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Change Order Approval Queue</CardTitle>
            </CardHeader>
            <CardContent>
              {changeOrders.length === 0 ? (
                <p className="text-sm text-slate-500">No change orders available.</p>
              ) : (
                <div className="space-y-3">
                  {changeOrders.map((co) => (
                    <div key={co.id} className="border rounded-lg p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-900">{co.title || co.change_order_number || 'Change Order'}</p>
                          <p className="text-sm text-slate-600">{co.description || 'No description provided.'}</p>
                          <p className="text-xs text-slate-500 mt-1">Cost impact: ${(co.cost_impact || 0).toLocaleString()} • Schedule: {co.schedule_impact_days || 0} days</p>
                        </div>
                        <Badge variant="outline">{co.status || 'pending'}</Badge>
                      </div>
                      <div className="mt-3 flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => changeOrderAction.mutate({ changeOrder: co, status: 'approved' })}
                          disabled={changeOrderAction.isPending || co.status === 'approved'}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" /> Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => changeOrderAction.mutate({ changeOrder: co, status: 'rejected' })}
                          disabled={changeOrderAction.isPending || co.status === 'rejected'}
                        >
                          <Clock className="h-4 w-4 mr-1" /> Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="forecast" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cost-to-Complete Dashboard</CardTitle>
            </CardHeader>
            <CardContent>
              {costForecast.length === 0 ? (
                <p className="text-sm text-slate-500">No projects available to forecast.</p>
              ) : (
                <div className="space-y-2">
                  {costForecast.map((row) => (
                    <div key={row.project_id} className="border rounded-lg p-3 flex justify-between items-center">
                      <div>
                        <p className="font-semibold">{row.project_name}</p>
                        <p className="text-xs text-slate-500">Budget: ${row.budget.toLocaleString()} • Forecast total: ${row.forecast_total.toLocaleString()} • CTC: ${row.cost_to_complete.toLocaleString()}</p>
                      </div>
                      <Badge className={row.variance >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        <TrendingUp className="h-3 w-3 mr-1" /> {row.variance_percent}%
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
