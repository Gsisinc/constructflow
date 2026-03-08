import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DollarSign, Receipt, CheckCircle } from "lucide-react";

export default function TransactionStats({ transactions }) {
    const totalVolume = transactions.reduce((sum, t) => sum + (t.total_amount || 0), 0);
    const postedCount = transactions.filter(t => t.status === "Posted").length;
    
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="glass-card border-white/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
                    <Receipt className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{transactions.length}</div>
                </CardContent>
            </Card>
            <Card className="glass-card border-white/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">${totalVolume.toLocaleString()}</div>
                </CardContent>
            </Card>
            <Card className="glass-card border-white/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Posted</CardTitle>
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{postedCount}</div>
                </CardContent>
            </Card>
        </div>
    );
}