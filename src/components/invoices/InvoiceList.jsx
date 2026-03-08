import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit, FileText, Download } from "lucide-react";
import { format } from 'date-fns';

export default function InvoiceList({ invoices, onEdit }) {
    const getStatusBadge = (status) => {
        const colors = {
            'Draft': 'bg-gray-100 text-gray-800',
            'Sent': 'bg-blue-100 text-blue-800',
            'Paid': 'bg-green-100 text-green-800',
            'Overdue': 'bg-red-100 text-red-800',
            'Cancelled': 'bg-yellow-100 text-yellow-800'
        };
        return <Badge className={colors[status] || 'bg-gray-100'}>{status}</Badge>;
    };

    return (
        <Card className="glass-card border-white/20">
            <CardHeader>
                <CardTitle>Invoices List</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Invoice #</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {invoices.length > 0 ? invoices.map(inv => (
                            <TableRow key={inv.id}>
                                <TableCell className="font-mono">{inv.invoice_number}</TableCell>
                                <TableCell>{format(new Date(inv.invoice_date), 'MMM dd, yyyy')}</TableCell>
                                <TableCell className="font-medium">{inv.customer_name}</TableCell>
                                <TableCell className="text-right font-mono">${inv.total_amount.toLocaleString()}</TableCell>
                                <TableCell>{getStatusBadge(inv.status)}</TableCell>
                                <TableCell>
                                    <div className="flex gap-2">
                                        <Button variant="ghost" size="icon" onClick={() => onEdit(inv)}><Edit className="w-4 h-4" /></Button>
                                        <Button variant="ghost" size="icon"><Download className="w-4 h-4" /></Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                    No invoices found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}