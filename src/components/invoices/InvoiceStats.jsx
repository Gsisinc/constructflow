import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, DollarSign, Clock, CheckCircle } from 'lucide-react';

export default function InvoiceStats({ invoices }) {
    const totalInvoices = invoices.length;
    const totalRevenue = invoices.filter(i => i.status === 'Paid').reduce((sum, i) => sum + i.total_amount, 0);
    const pendingAmount = invoices.filter(i => i.status === 'Sent').reduce((sum, i) => sum + i.total_amount, 0);
    const overdueCount = invoices.filter(i => i.status === 'Overdue').length;

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="glass-card border-white/20">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-medium text-gray-600">Total Invoices</CardTitle>
                    <FileText className="w-4 h-4 text-gray-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-gradient">{totalInvoices}</div>
                </CardContent>
            </Card>
            <Card className="glass-card border-white/20">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-medium text-gray-600">Total Revenue</CardTitle>
                    <CheckCircle className="w-4 h-4 text-gray-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-emerald-600">${totalRevenue.toLocaleString()}</div>
                </CardContent>
            </Card>
            <Card className="glass-card border-white/20">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-medium text-gray-600">Pending Amount</CardTitle>
                    <Clock className="w-4 h-4 text-gray-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-blue-600">${pendingAmount.toLocaleString()}</div>
                </CardContent>
            </Card>
            <Card className="glass-card border-white/20">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-medium text-gray-600">Overdue Invoices</CardTitle>
                    <DollarSign className="w-4 h-4 text-gray-500" />
                </CardHeader>
                <CardContent>
                    <div className={`text-2xl font-bold ${overdueCount > 0 ? 'text-rose-600' : 'text-slate-900'}`}>{overdueCount}</div>
                </CardContent>
            </Card>
        </div>
    );
}