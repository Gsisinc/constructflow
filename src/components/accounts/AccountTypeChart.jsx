import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';
import { PieChart as PieChartIcon } from "lucide-react";

const COLORS = {
    Assets: "#3b82f6",
    Liabilities: "#ef4444",
    Equity: "#8b5cf6",
    Revenue: "#22c55e",
    Expenses: "#f97316",
};

export default function AccountTypeChart({ accounts }) {
    const data = Object.entries(
        accounts.reduce((acc, account) => {
            acc[account.type] = (acc[account.type] || 0) + 1;
            return acc;
        }, {})
    ).map(([name, value]) => ({ name, value }));

    return (
        <Card className="glass-card border-white/20">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <PieChartIcon className="w-5 h-5 text-emerald-600" />
                    Accounts by Type
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[entry.name]} />
                                ))}
                            </Pie>
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}