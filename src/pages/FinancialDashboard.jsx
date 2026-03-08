import React, { useState, useEffect } from "react";
import { Project } from "@/entities/Project";
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
    Banknote,
    MapPin
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";

import StatsCard from "../components/financial-dashboard/StatsCard";
import RecentTransactions from "../components/financial-dashboard/RecentTransactions";
import FinancialChart from "../components/financial-dashboard/FinancialChart";
import CompanyOverview from "../components/financial-dashboard/CompanyOverview";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export default function FinancialDashboard() {
    const [projects, setProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState(null);
    const [selectedPhase, setSelectedPhase] = useState(null);
    const [phases, setPhases] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [financialData, setFinancialData] = useState({
        totalRevenue: 0,
        totalExpenses: 0,
        netProfit: 0,
        totalAssets: 0,
        cashFlow: 0,
        budgetUtilization: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, []);

    useEffect(() => {
        if (selectedProject) {
            loadProjectFinancials();
        }
    }, [selectedProject, selectedPhase]);

    const loadDashboardData = async () => {
        setLoading(true);
        try {
            const user = await User.me();
            // Load projects instead of companies
            const projectsData = await Project.filter({ created_by: user.email });
            setProjects(projectsData);

            if (projectsData.length > 0) {
                const project = projectsData[0];
                setSelectedProject(project);
                
                // Load project phases if available
                if (project.phases && Array.isArray(project.phases)) {
                    setPhases(project.phases);
                    if (project.phases.length > 0) {
                        setSelectedPhase(project.phases[0].id);
                    }
                }
            }
        } catch (error) {
            console.error("Error loading dashboard:", error);
        }
        setLoading(false);
    };

    const loadProjectFinancials = async () => {
        try {
            if (!selectedProject) return;

            const filters = { 
                project_id: selectedProject.id,
                status: "Posted"
            };

            // Add phase filter if selected
            if (selectedPhase) {
                filters.phase_id = selectedPhase;
            }

            const [transactionsData, accountsData] = await Promise.all([
                Transaction.filter(filters, "-date", 10),
                Account.filter({ project_id: selectedProject.id, is_active: true })
            ]);

            setTransactions(transactionsData);
            setAccounts(accountsData);
            
            // Calculate financial metrics for project
            calculateFinancialMetrics(transactionsData, accountsData, selectedProject);
        } catch (error) {
            console.error("Error loading project financials:", error);
        }
    };

    const calculateFinancialMetrics = (transactions, accounts, project) => {
        let totalRevenue = 0;
        let totalExpenses = 0;
        let totalAssets = 0;
        let budgetUtilization = 0;

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

        // Calculate budget utilization for construction project
        if (project.budget) {
            budgetUtilization = (totalExpenses / project.budget) * 100;
        }

        const netProfit = totalRevenue - totalExpenses;
        const cashFlow = transactions
            .filter(t => t.type === 'Receipt' || t.type === 'Payment')
            .reduce((sum, t) => sum + (t.type === 'Receipt' ? t.total_amount : -t.total_amount), 0);

        setFinancialData({
            totalRevenue,
            totalExpenses,
            netProfit,
            totalAssets,
            cashFlow,
            budgetUtilization
        });
    };

    if (loading) {
        return <div className="p-8">Loading financial dashboard...</div>;
    }

    return (
        <div className="space-y-8 p-8">
            {/* Header with Project Selection */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold">Project Financial Dashboard</h1>
                    <Link to={createPageUrl("Projects")}>
                        <Button variant="outline">View All Projects</Button>
                    </Link>
                </div>

                {/* Project and Phase Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm font-medium">Select Project</label>
                        <Select value={selectedProject?.id || ""} onValueChange={(id) => {
                            const project = projects.find(p => p.id === id);
                            setSelectedProject(project);
                        }}>
                            <SelectTrigger>
                                <SelectValue placeholder="Choose a project" />
                            </SelectTrigger>
                            <SelectContent>
                                {projects.map(project => (
                                    <SelectItem key={project.id} value={project.id}>
                                        <div className="flex items-center gap-2">
                                            <MapPin className="w-4 h-4" />
                                            {project.name}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {phases.length > 0 && (
                        <div>
                            <label className="text-sm font-medium">Select Phase (Optional)</label>
                            <Select value={selectedPhase || ""} onValueChange={setSelectedPhase}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All phases" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">All Phases</SelectItem>
                                    {phases.map(phase => (
                                        <SelectItem key={phase.id} value={phase.id}>
                                            {phase.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>
            </div>

            {/* Financial Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <StatsCard
                    title="Total Revenue"
                    value={`$${financialData.totalRevenue.toLocaleString()}`}
                    icon={<TrendingUp className="w-5 h-5" />}
                    trend="+12%"
                />
                <StatsCard
                    title="Total Expenses"
                    value={`$${financialData.totalExpenses.toLocaleString()}`}
                    icon={<TrendingDown className="w-5 h-5" />}
                    trend="+8%"
                />
                <StatsCard
                    title="Net Profit"
                    value={`$${financialData.netProfit.toLocaleString()}`}
                    icon={<DollarSign className="w-5 h-5" />}
                    trend={financialData.netProfit > 0 ? "+5%" : "-3%"}
                />
                <StatsCard
                    title="Cash Flow"
                    value={`$${financialData.cashFlow.toLocaleString()}`}
                    icon={<Banknote className="w-5 h-5" />}
                    trend="+2%"
                />
                <StatsCard
                    title="Budget Utilization"
                    value={`${financialData.budgetUtilization.toFixed(1)}%`}
                    icon={<FileText className="w-5 h-5" />}
                    trend={financialData.budgetUtilization > 100 ? "Over budget" : "On track"}
                />
            </div>

            {/* Charts and Details */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <FinancialChart transactions={transactions} />
                </div>
                <div>
                    <CompanyOverview project={selectedProject} financialData={financialData} />
                </div>
            </div>

            {/* Recent Transactions */}
            <div>
                <RecentTransactions transactions={transactions} />
            </div>

            {/* Quick Links */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Link to={createPageUrl("SalesInvoices")}>
                    <Button variant="outline" className="w-full">View Invoices</Button>
                </Link>
                <Link to={createPageUrl("Transactions")}>
                    <Button variant="outline" className="w-full">View Transactions</Button>
                </Link>
                <Link to={createPageUrl("Reports")}>
                    <Button variant="outline" className="w-full">View Reports</Button>
                </Link>
                <Link to={createPageUrl("Budget")}>
                    <Button variant="outline" className="w-full">Budget Tracking</Button>
                </Link>
            </div>
        </div>
    );
}
