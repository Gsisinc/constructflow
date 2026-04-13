import React, { useState, useEffect } from "react";
import { Account } from "@/entities/Account";
import { Project } from "@/entities/Project";
import { User } from "@/entities/User";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Building } from "lucide-react";

import AccountForm from "../components/accounts/AccountForm";
import AccountsTable from "../components/accounts/AccountsTable";
import AccountTypeChart from "../components/accounts/AccountTypeChart";
import SetupChartOfAccounts from "../components/accounts/SetupChartOfAccounts";

export default function Accounts() {
    const [accounts, setAccounts] = useState([]);
    const [projects, setProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [editingAccount, setEditingAccount] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all");

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (selectedProject) {
            loadAccounts();
        }
    }, [selectedProject]);

    const loadData = async () => {
        setLoading(true);
        try {
            const user = await User.me();
            const projectsData = await Project.filter({ created_by: user.email });
            setProjects(projectsData);
            if (projectsData.length > 0) {
                setSelectedProject(projectsData[0]);
            }
        } catch (error) {
            console.error("Error loading data:", error);
        }
        setLoading(false);
    };

    const loadAccounts = async () => {
        if (!selectedProject) return;
        try {
            const data = await Account.filter({ project_id: selectedProject.id });
            setAccounts(data);
        } catch (error) {
            console.error("Error loading accounts:", error);
        }
    };

    const handleSave = async (accountData) => {
        try {
            const dataWithCompany = { ...accountData, project_id: selectedProject.id };
            if (editingAccount) {
                await Account.update(editingAccount.id, dataWithCompany);
            } else {
                await Account.create(dataWithCompany);
            }
            setShowForm(false);
            setEditingAccount(null);
            loadAccounts();
        } catch (error) {
            console.error("Error saving account:", error);
        }
    };

    const filteredAccounts = accounts.filter(account => {
        if (filter === "all") return true;
        return account.type === filter;
    });

    const accountsByType = accounts.reduce((acc, account) => {
        acc[account.type] = (acc[account.type] || 0) + 1;
        return acc;
    }, {});

    const totalBalance = accounts.reduce((sum, account) => sum + (account.balance || 0), 0);

    if (loading) {
        return (
            <div className="p-8">
                <div className="animate-pulse space-y-6">
                    <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="h-24 bg-gray-200 rounded-xl"></div>
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
                    <h1 className="text-3xl font-bold text-gradient">Chart of Accounts</h1>
                    <p className="text-gray-600 mt-1">
                        {selectedProject?.name} • {accounts.length} accounts
                    </p>
                </div>
                <Button
                    onClick={() => setShowForm(true)}
                    className="bg-gradient-to-r from-emerald-500 to-emerald-600"
                    disabled={!selectedProject}
                >
                    <Plus className="w-4 h-4 mr-2" />
                    New Account
                </Button>
            </div>

            {!selectedProject ? (
                <div className="text-center py-16">
                    <Building className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">No Company Selected</h2>
                    <p className="text-gray-500">Please select a company to manage accounts</p>
                </div>
            ) : accounts.length === 0 ? (
                <SetupChartOfAccounts companyId={selectedProject.id} onSetupComplete={loadAccounts} />
            ) : (
                <>
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <Card className="glass-card border-white/20">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-gray-600">Total Accounts</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-gradient">{accounts.length}</div>
                            </CardContent>
                        </Card>
                        <Card className="glass-card border-white/20">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-gray-600">Assets</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-emerald-600">
                                    {accountsByType['Assets'] || 0}
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="glass-card border-white/20">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-gray-600">Liabilities</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-rose-600">
                                    {accountsByType['Liabilities'] || 0}
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="glass-card border-white/20">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-gray-600">Total Balance</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-blue-600">
                                    ${totalBalance.toLocaleString()}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Account Form Modal */}
                    {showForm && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                            <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                                <AccountForm
                                    account={editingAccount}
                                    onSave={handleSave}
                                    onCancel={() => {
                                        setShowForm(false);
                                        setEditingAccount(null);
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Main Content */}
                    <div className="grid lg:grid-cols-4 gap-6">
                        <div className="lg:col-span-3">
                            <AccountsTable
                                accounts={filteredAccounts}
                                onEdit={(account) => {
                                    setEditingAccount(account);
                                    setShowForm(true);
                                }}
                                filter={filter}
                                onFilterChange={setFilter}
                            />
                        </div>
                        <div>
                            <AccountTypeChart accounts={accounts} />
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}