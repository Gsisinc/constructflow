import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, DollarSign, Clock, CheckCircle } from 'lucide-react';

export default function PurchaseInvoiceStats({ invoices }) {
    const totalInvoices = invoices.length;
    const totalPurchases = invoices.filter(i => i.status === 'Paid').reduce((sum, i) => sum + i.total_amount, 0);
    const pendingAmount = invoices.filter(i => i.status === 'Received').reduce((sum, i) => sum + i.total_amount, 0);
    const receivedCount = invoices.filter(i => i.status === 'Received').length;

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="glass-card border-white/20">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-medium text-gray-600">Total Purchases</CardTitle>
                    <FileText className="w-4 h-4 text-gray-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-gradient">{totalInvoices}</div>
                </CardContent>
            </Card>
            <Card className="glass-card border-white/20">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-medium text-gray-600">Total Paid</CardTitle>
                    <CheckCircle className="w-4 h-4 text-gray-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-emerald-600">${totalPurchases.toLocaleString()}</div>
                </CardContent>
            </Card>
            <Card className="glass-card border-white/20">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-medium text-gray-600">Pending Payment</CardTitle>
                    <Clock className="w-4 h-4 text-gray-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-blue-600">${pendingAmount.toLocaleString()}</div>
                </CardContent>
            </Card>
            <Card className="glass-card border-white/20">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-medium text-gray-600">Received</CardTitle>
                    <DollarSign className="w-4 h-4 text-gray-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-slate-900">{receivedCount}</div>
                </CardContent>
            </Card>
        </div>
    );
}