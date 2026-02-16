import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  FileText,
  DollarSign,
  Calendar,
  User,
  MessageSquare,
  Download,
  Eye
} from 'lucide-react';

export default function ChangeOrderApproval() {
  const [changeOrders] = useState([
    {
      id: 'CO-001',
      title: 'Additional Structural Reinforcement',
      description: 'Engineering assessment identified need for additional structural reinforcement in the east wing to meet updated building codes.',
      status: 'pending',
      amount: 45000,
      percentage: 1.8,
      reason: 'Code Compliance',
      submittedBy: 'John Smith',
      submittedDate: new Date('2024-04-10'),
      dueDate: new Date('2024-04-20'),
      impact: 'Timeline: +5 days, Budget: +$45,000',
      attachments: 2,
      comments: 3
    },
    {
      id: 'CO-002',
      title: 'HVAC System Upgrade',
      description: 'Client requested upgrade to high-efficiency HVAC system for improved energy performance and comfort.',
      status: 'approved',
      amount: 32000,
      percentage: 1.3,
      reason: 'Client Request',
      submittedBy: 'Sarah Johnson',
      submittedDate: new Date('2024-03-25'),
      approvedDate: new Date('2024-03-28'),
      dueDate: new Date('2024-03-28'),
      impact: 'Timeline: +3 days, Budget: +$32,000',
      attachments: 1,
      comments: 2
    },
    {
      id: 'CO-003',
      title: 'Additional Paint & Finishing',
      description: 'Client requested additional paint finishes and premium materials in common areas.',
      status: 'rejected',
      amount: 18000,
      percentage: 0.7,
      reason: 'Client Request',
      submittedBy: 'Mike Davis',
      submittedDate: new Date('2024-04-01'),
      rejectedDate: new Date('2024-04-05'),
      rejectionReason: 'Budget constraints - client chose alternative materials',
      dueDate: new Date('2024-04-05'),
      impact: 'Timeline: +2 days, Budget: +$18,000',
      attachments: 3,
      comments: 5
    },
    {
      id: 'CO-004',
      title: 'Electrical Panel Relocation',
      description: 'Existing electrical panel needs relocation due to architectural changes in Phase 2.',
      status: 'pending',
      amount: 12000,
      percentage: 0.5,
      reason: 'Design Change',
      submittedBy: 'John Smith',
      submittedDate: new Date('2024-04-12'),
      dueDate: new Date('2024-04-22'),
      impact: 'Timeline: +2 days, Budget: +$12,000',
      attachments: 2,
      comments: 1
    }
  ]);

  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);

  const filteredOrders = filterStatus === 'all' 
    ? changeOrders 
    : changeOrders.filter(co => co.status === filterStatus);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return { label: 'Approved', color: 'bg-green-100 text-green-800', icon: CheckCircle2 };
      case 'rejected':
        return { label: 'Rejected', color: 'bg-red-100 text-red-800', icon: XCircle };
      case 'pending':
        return { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: Clock };
      default:
        return { label: status, color: 'bg-slate-100 text-slate-800', icon: AlertCircle };
    }
  };

  const stats = {
    total: changeOrders.length,
    pending: changeOrders.filter(co => co.status === 'pending').length,
    approved: changeOrders.filter(co => co.status === 'approved').length,
    rejected: changeOrders.filter(co => co.status === 'rejected').length,
    totalAmount: changeOrders.reduce((sum, co) => sum + co.amount, 0)
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <FileText className="w-8 h-8 text-blue-600" />
          Change Orders
        </h1>
        <p className="text-slate-600 mt-1">Review and approve project modifications</p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600">Total Orders</p>
            <p className="text-2xl font-bold mt-2">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="border-yellow-200">
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600">Pending</p>
            <p className="text-2xl font-bold mt-2 text-yellow-600">{stats.pending}</p>
          </CardContent>
        </Card>
        <Card className="border-green-200">
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600">Approved</p>
            <p className="text-2xl font-bold mt-2 text-green-600">{stats.approved}</p>
          </CardContent>
        </Card>
        <Card className="border-red-200">
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600">Rejected</p>
            <p className="text-2xl font-bold mt-2 text-red-600">{stats.rejected}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600">Total Amount</p>
            <p className="text-2xl font-bold mt-2">${(stats.totalAmount / 1000).toFixed(0)}K</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex gap-4">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Orders</SelectItem>
            <SelectItem value="pending">Pending Approval</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Change Orders List */}
      <div className="space-y-4">
        {filteredOrders.map((order) => {
          const statusInfo = getStatusBadge(order.status);
          const StatusIcon = statusInfo.icon;

          return (
            <Card 
              key={order.id} 
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setSelectedOrder(selectedOrder?.id === order.id ? null : order)}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold">{order.title}</h3>
                      <Badge className={statusInfo.color}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {statusInfo.label}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-600">{order.description}</p>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-2xl font-bold text-blue-600">${order.amount.toLocaleString()}</p>
                    <p className="text-sm text-slate-600">+{order.percentage}% of budget</p>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4 py-4 border-y">
                  <div>
                    <p className="text-xs text-slate-600">Reason</p>
                    <p className="font-medium">{order.reason}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600">Submitted By</p>
                    <p className="font-medium">{order.submittedBy}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600">Submitted Date</p>
                    <p className="font-medium">{order.submittedDate.toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600">Due Date</p>
                    <p className="font-medium">{order.dueDate.toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-slate-600">
                    <span className="flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {order.impact}
                    </span>
                    <span className="flex items-center gap-1">
                      <Download className="w-4 h-4" />
                      {order.attachments} attachments
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-4 h-4" />
                      {order.comments} comments
                    </span>
                  </div>

                  {order.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="gap-2">
                        <Eye className="w-4 h-4" />
                        Review
                      </Button>
                      <Button size="sm" className="gap-2 bg-green-600 hover:bg-green-700">
                        <CheckCircle2 className="w-4 h-4" />
                        Approve
                      </Button>
                      <Button size="sm" variant="outline" className="gap-2 text-red-600">
                        <XCircle className="w-4 h-4" />
                        Reject
                      </Button>
                    </div>
                  )}
                </div>

                {/* Expanded Details */}
                {selectedOrder?.id === order.id && (
                  <div className="mt-6 pt-6 border-t space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Impact Analysis</h4>
                      <p className="text-sm text-slate-600">{order.impact}</p>
                    </div>
                    {order.status === 'approved' && order.approvedDate && (
                      <div>
                        <h4 className="font-semibold mb-2">Approval Details</h4>
                        <p className="text-sm text-slate-600">Approved on {order.approvedDate.toLocaleDateString()}</p>
                      </div>
                    )}
                    {order.status === 'rejected' && order.rejectionReason && (
                      <div>
                        <h4 className="font-semibold mb-2">Rejection Reason</h4>
                        <p className="text-sm text-slate-600">{order.rejectionReason}</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
