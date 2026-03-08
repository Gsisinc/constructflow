import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

export default function StatsCard({ title, value, change, trend, icon: Icon, gradient }) {
    return (
        <Card className="glass-card border-white/20 relative overflow-hidden group hover:shadow-xl transition-all duration-300">
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${gradient} opacity-10 rounded-full transform translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform duration-300`} />
            
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${gradient} bg-opacity-10`}>
                        <Icon className={`w-4 h-4 bg-gradient-to-br ${gradient} bg-clip-text text-transparent`} />
                    </div>
                </div>
            </CardHeader>
            
            <CardContent>
                <div className="text-2xl font-bold text-slate-900 mb-2">{value}</div>
                {change && (
                    <div className={`flex items-center text-sm ${
                        trend === 'up' ? 'text-emerald-600' : 'text-rose-600'
                    }`}>
                        {trend === 'up' ? (
                            <ArrowUpRight className="w-4 h-4 mr-1" />
                        ) : (
                            <ArrowDownRight className="w-4 h-4 mr-1" />
                        )}
                        <span className="font-medium">{change}</span>
                        <span className="text-gray-500 ml-1">from last month</span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}