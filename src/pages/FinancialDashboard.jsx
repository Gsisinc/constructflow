import React, { useState, useEffect } from "react";
import { Company } from "@/entities/Company";
import { Account } from "@/entities/Account";
import { Transaction } from "@/entities/Transaction";
import { User } from "@/entities/User";
import { Button } from "@/components/ui/button";
import {
    Building2,
    TrendingUp,
    TrendingDown,
    DollarSign,
    FileText,
    Calendar,
    Banknote
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";

import StatsCard from "../components/financial-dashboard/StatsCard";
import RecentTransactions from "../components/financial-dashboard/RecentTransactions";
import FinancialChart from "../components/financial-dashboard/FinancialChart";
import CompanyOverview from "../components/financial-dashboard/CompanyOverview";

export default function Dashboard() {
    const [companies, setCompanies] = useState([]);
    const [selectedCompany, setSelectedCompany] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [financialData, setFinancialData] = useState({
        totalRevenue: 0,
        totalExpenses: 0,
        netProfit: 0,
        totalAssets: 0,
        cashFlow: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        setLoading(true);
        try {
            const user = await User.me();
            const companiesData = await Company.filter({ created_by: user.email });
            setCompanies(companiesData);

            if (companiesData.length > 0) {
                const company = companiesData[0]; // Use first company for demo
                setSelectedCompany(company);
                
                // Load company-specific data
                const [transactionsData, accountsData] = await Promise.all([
                    Transaction.filter({ company_id: company.id, status: "Posted" }, "-date", 10),
                    Account.filter({ company_id: company.id, is_active: true })
                ]);

                setTransactions(transactionsData);
                setAccounts(accountsData);
                
                // Calculate financial metrics
                calculateFinancialMetrics(transactionsData, accountsData);
            }
        } catch (error) {
            console.error("Error loading dashboard:", error);
        }
        setLoading(false);
    };

    const calculateFinancialMetrics = (transactions, accounts) => {
        let totalRevenue = 0;
        let totalExpenses = 0;
        let totalAssets = 0;

        // Calculate from accounts
        accounts.forEach(account => {
            switch (account.type) {
                case 'Revenue':
                    totalRevenue += account.balance || 0;
                    break;
                case 'Expenses':
                    totalExpenses += account.balance || 0;
                    break;
                case 'Assets':
                    totalAssets += account.balance || 0;
                    break;
            }
        });

        const netProfit = totalRevenue - totalExpenses;
        const cashFlow = transactions
            .filter(t => t.type === 'Receipt' || t.type === 'Payment')
            .reduce((sum, t) => sum + (t.type === 'Receipt' ? t.total_amount : -t.total_amount), 0);

        setFinancialData({
            totalRevenue,
            totalExpenses,
            netProfit,
            totalAssets,
            cashFlow
        });
    };

    if (loading) {
        return (
            <div className="p-8">
                <div className="animate-pulse space-y-6">
                    <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
                        ))}
                    </div>
                    <div className="grid lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 h-96 bg-gray-200 rounded-xl"></div>
                        <div className="h-96 bg-gray-200 rounded-xl"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (companies.length === 0) {
        return (
            <div className="p-8">
                <div className="text-center py-16">
                    <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to AccountingPro</h2>
                    <p className="text-gray-500 mb-6">Get started by creating your first company</p>
                    <Link to={createPageUrl("Companies")}>
                        <Button className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700">
                            <Building2 className="w-4 h-4 mr-2" />
                            Create Company
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 lg:p-8 space-y-8">
            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gradient">Financial Dashboard</h1>
                    <p className="text-gray-600 mt-1">
                        {selectedCompany?.name} • {format(new Date(), 'MMMM yyyy')}
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="glass-card border-white/20">
                        <Calendar className="w-4 h-4 mr-2" />
                        This Month
                    </Button>
                    <Link to={createPageUrl("Reports")}>
                        <Button className="bg-gradient-to-r from-emerald-500 to-emerald-600">
                            <FileText className="w-4 h-4 mr-2" />
                            View Reports
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard
                    title="Total Revenue"
                    value={`$${Math.abs(financialData.totalRevenue).toLocaleString()}`}
                    change="+12.5%"
                    trend="up"
                    icon={TrendingUp}
                    gradient="from-emerald-500 to-emerald-600"
                />
                <StatsCard
                    title="Total Expenses"
                    value={`$${financialData.totalExpenses.toLocaleString()}`}
                    change="+8.2%"
                    trend="up"
                    icon={TrendingDown}
                    gradient="from-rose-500 to-rose-600"
                />
                <StatsCard
                    title="Net Profit"
                    value={`$${financialData.netProfit.toLocaleString()}`}
                    change="+15.3%"
                    trend="up"
                    icon={DollarSign}
                    gradient="from-blue-500 to-blue-600"
                />
                <StatsCard
                    title="Total Assets"
                    value={`$${financialData.totalAssets.toLocaleString()}`}
                    change="+5.7%"
                    trend="up"
                    icon={Banknote}
                    gradient="from-purple-500 to-purple-600"
                />
            </div>

            {/* Main Content Grid */}
            <div className="grid lg:grid-cols-3 gap-6">
                {/* Left Column - Charts and Analytics */}
                <div className="lg:col-span-2 space-y-6">
                    <FinancialChart selectedCompany={selectedCompany} />
                </div>

                {/* Right Column - Overview and Transactions */}
                <div className="space-y-6">
                    <CompanyOverview 
                        company={selectedCompany}
                        accountsCount={accounts.length}
                        transactionsCount={transactions.length}
                    />
                    <RecentTransactions transactions={transactions} />
                </div>
            </div>
        </div>
    );
}