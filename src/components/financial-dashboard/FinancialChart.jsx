import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { TrendingUp } from "lucide-react";

export default function FinancialChart({ selectedCompany }) {
    // Mock data for demonstration
    const revenueData = [
        { month: 'Jan', revenue: 45000, expenses: 32000 },
        { month: 'Feb', revenue: 52000, expenses: 35000 },
        { month: 'Mar', revenue: 48000, expenses: 31000 },
        { month: 'Apr', revenue: 61000, expenses: 42000 },
        { month: 'May', revenue: 55000, expenses: 38000 },
        { month: 'Jun', revenue: 67000, expenses: 45000 },
    ];

    return (
        <Card className="glass-card border-white/20">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-emerald-600" />
                    Revenue vs Expenses
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={revenueData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                            <XAxis 
                                dataKey="month" 
                                stroke="#64748b"
                                fontSize={12}
                            />
                            <YAxis 
                                stroke="#64748b"
                                fontSize={12}
                                tickFormatter={(value) => `$${value / 1000}k`}
                            />
                            <Tooltip 
                                formatter={(value) => [`$${value.toLocaleString()}`, '']}
                                labelStyle={{ color: '#1e293b' }}
                                contentStyle={{
                                    backgroundColor: 'rgba(255,255,255,0.95)',
                                    border: '1px solid rgba(0,0,0,0.1)',
                                    borderRadius: '8px',
                                    backdropFilter: 'blur(10px)'
                                }}
                            />
                            <Bar 
                                dataKey="revenue" 
                                fill="url(#revenueGradient)" 
                                radius={[4, 4, 0, 0]}
                                name="Revenue"
                            />
                            <Bar 
                                dataKey="expenses" 
                                fill="url(#expenseGradient)" 
                                radius={[4, 4, 0, 0]}
                                name="Expenses"
                            />
                            <defs>
                                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.9}/>
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.6}/>
                                </linearGradient>
                                <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.9}/>
                                    <stop offset="95%" stopColor="#f97316" stopOpacity={0.6}/>
                                </linearGradient>
                            </defs>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}