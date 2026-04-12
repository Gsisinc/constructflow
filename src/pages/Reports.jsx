import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Transaction } from "@/entities/Transaction";
import { Account } from "@/entities/Account";
import { Project } from "@/entities/Project";
import { User } from "@/entities/User";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
    Download,
    Building,
    TrendingUp,
    PieChart,
    BarChart3
} from "lucide-react";

import BalanceSheet from "../components/reports/BalanceSheet";
import IncomeStatement from "../components/reports/IncomeStatement";
import TrialBalance from "../components/reports/TrialBalance";
import ReportFilters from "../components/reports/ReportFilters";

export default function Reports() {
    const [projects, setProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState(null);
    const [accounts, setAccounts] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [activeReport, setActiveReport] = useState("balance-sheet");
    const [dateRange, setDateRange] = useState({
        startDate: new Date(new Date().getFullYear(), 0, 1), // Start of current year
        endDate: new Date()
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (selectedProject) {
            loadCompanyData();
        }
    }, [selectedProject, dateRange]);

    const loadData = async () => {
        setLoading(true);
        try {
            const projectsData = await base44.entities.Company.filter({});
            setProjects(projectsData);
            if (projectsData.length > 0) {
                setSelectedProject(projectsData[0]);
            }
        } catch (error) {
            console.error("Error loading data:", error);
        }
        setLoading(false);
    };

    const loadCompanyData = async () => {
        if (!selectedProject) return;
        try {
            const [accountsData, transactionsData] = await Promise.all([
                Account.filter({ project_id: selectedProject.id }),
                Transaction.filter({ 
                    project_id: selectedProject.id,
                    status: "Posted"
                })
            ]);
            
            // Filter transactions by date range
            const filteredTransactions = transactionsData.filter(t => {
                const txnDate = new Date(t.date);
                return txnDate >= dateRange.startDate && txnDate <= dateRange.endDate;
            });

            setAccounts(accountsData);
            setTransactions(filteredTransactions);
        } catch (error) {
            console.error("Error loading company data:", error);
        }
    };

    const reports = [
        {
            id: "balance-sheet",
            title: "Balance Sheet",
            description: "Assets, Liabilities & Equity",
            icon: PieChart,
            color: "emerald"
        },
        {
            id: "income-statement",
            title: "Income Statement",
            description: "Revenue & Expenses",
            icon: TrendingUp,
            color: "blue"
        },
        {
            id: "trial-balance",
            title: "Trial Balance",
            description: "Account Balances Verification",
            icon: BarChart3,
            color: "purple"
        }
    ];

    const renderReport = () => {
        switch (activeReport) {
            case "balance-sheet":
                return <BalanceSheet accounts={accounts} transactions={transactions} />;
            case "income-statement":
                return <IncomeStatement accounts={accounts} transactions={transactions} />;
            case "trial-balance":
                return <TrialBalance accounts={accounts} transactions={transactions} />;
            default:
                return <BalanceSheet accounts={accounts} transactions={transactions} />;
        }
    };

    if (loading) {
        return (
            <div className="p-8">
                <div className="animate-pulse space-y-6">
                    <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 lg:p-8 space-y-8">
            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gradient">Financial Reports</h1>
                    <p className="text-gray-600 mt-1">
                        {selectedProject?.name} • {accounts.length} accounts
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="glass-card border-white/20">
                        <Download className="w-4 h-4 mr-2" />
                        Export PDF
                    </Button>
                    <Button variant="outline" className="glass-card border-white/20">
                        <Download className="w-4 h-4 mr-2" />
                        Export Excel
                    </Button>
                </div>
            </div>

            {!selectedProject ? (
                <div className="text-center py-16">
                    <Building className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">No Company Selected</h2>
                    <p className="text-gray-500">Please select a company to view reports</p>
                </div>
            ) : (
                <>
                    {/* Report Type Selector */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {reports.map((report) => {
                            const IconComponent = report.icon;
                            return (
                                <Card
                                    key={report.id}
                                    className={`cursor-pointer transition-all duration-200 ${
                                        activeReport === report.id
                                            ? `ring-2 ring-${report.color}-500 bg-${report.color}-50`
                                            : 'glass-card border-white/20 hover:bg-white/40'
                                    }`}
                                    onClick={() => setActiveReport(report.id)}
                                >
                                    <CardHeader className="pb-2">
                                        <div className="flex items-center justify-between">
                                            <IconComponent 
                                                className={`w-6 h-6 ${
                                                    activeReport === report.id 
                                                        ? `text-${report.color}-600` 
                                                        : 'text-gray-400'
                                                }`} 
                                            />
                                            {activeReport === report.id && (
                                                <Badge className={`bg-${report.color}-500`}>Active</Badge>
                                            )}
                                        </div>
                                        <CardTitle className="text-lg">{report.title}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-gray-600">{report.description}</p>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>

                    {/* Report Filters */}
                    <ReportFilters
                        dateRange={dateRange}
                        onDateRangeChange={setDateRange}
                        company={selectedProject}
                    />

                    {/* Report Content */}
                    <div className="glass-card border-white/20 rounded-2xl overflow-hidden">
                        {renderReport()}
                    </div>
                </>
            )}
        </div>
    );
}