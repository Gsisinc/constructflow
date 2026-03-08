import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Receipt, ArrowUpRight } from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function RecentTransactions({ transactions }) {
    const statusColors = {
        Posted: "bg-emerald-100 text-emerald-800",
        Draft: "bg-yellow-100 text-yellow-800",
        Reversed: "bg-red-100 text-red-800"
    };

    return (
        <Card className="glass-card border-white/20">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <Receipt className="w-5 h-5 text-emerald-600" />
                        Recent Transactions
                    </CardTitle>
                    <Link 
                        to={createPageUrl("Transactions")}
                        className="text-emerald-600 hover:text-emerald-700 flex items-center gap-1 text-sm font-medium"
                    >
                        View all
                        <ArrowUpRight className="w-4 h-4" />
                    </Link>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {transactions.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <Receipt className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>No transactions yet</p>
                    </div>
                ) : (
                    transactions.slice(0, 5).map((transaction) => (
                        <div key={transaction.id} className="flex items-center justify-between p-3 rounded-lg bg-white/30 hover:bg-white/40 transition-colors">
                            <div className="flex-1">
                                <p className="font-medium text-sm">{transaction.description || transaction.type}</p>
                                <p className="text-xs text-gray-500">
                                    {format(new Date(transaction.date), 'MMM d, yyyy')}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="font-semibold text-sm">
                                    ${transaction.total_amount?.toLocaleString()}
                                </p>
                                <Badge 
                                    className={`text-xs ${statusColors[transaction.status] || 'bg-gray-100 text-gray-800'}`}
                                >
                                    {transaction.status}
                                </Badge>
                            </div>
                        </div>
                    ))
                )}
            </CardContent>
        </Card>
    );
}