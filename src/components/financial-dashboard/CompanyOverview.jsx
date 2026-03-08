import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, FileText, TrendingUp } from "lucide-react";

export default function CompanyOverview({ company, accountsCount, transactionsCount }) {
    if (!company) return null;

    return (
        <Card className="glass-card border-white/20">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-emerald-600" />
                    Company Overview
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <h3 className="font-semibold text-lg">{company.name}</h3>
                    {company.legal_name && (
                        <p className="text-sm text-gray-600">{company.legal_name}</p>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/30 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                            <FileText className="w-4 h-4 text-blue-600" />
                            <span className="text-xs font-medium text-gray-600">Accounts</span>
                        </div>
                        <p className="text-lg font-bold text-blue-600">{accountsCount}</p>
                    </div>
                    
                    <div className="bg-white/30 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                            <TrendingUp className="w-4 h-4 text-emerald-600" />
                            <span className="text-xs font-medium text-gray-600">Transactions</span>
                        </div>
                        <p className="text-lg font-bold text-emerald-600">{transactionsCount}</p>
                    </div>
                </div>

                <div className="pt-2 border-t border-white/20">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Base Currency</span>
                        <span className="font-medium">{company.currency}</span>
                    </div>
                    {company.fiscal_year_end && (
                        <div className="flex items-center justify-between text-sm mt-1">
                            <span className="text-gray-600">Fiscal Year End</span>
                            <span className="font-medium">{company.fiscal_year_end}</span>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}