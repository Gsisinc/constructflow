import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Transaction } from "@/entities/Transaction";
import { Account } from "@/entities/Account";
import { Project } from "@/entities/Project";
import { User } from "@/entities/User";
import { Button } from "@/components/ui/button";
import { Plus, Receipt, Building } from "lucide-react";

import TransactionForm from "../components/transactions/TransactionForm";
import TransactionsTable from "../components/transactions/TransactionsTable";
import TransactionStats from "../components/transactions/TransactionStats";
import GenerateSampleTransactions from "../components/transactions/GenerateSampleTransactions";

export default function Transactions() {
    const [transactions, setTransactions] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [projects, setProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all");

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (selectedProject) {
            loadTransactions();
            loadAccounts();
        }
    }, [selectedProject]);

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

    const loadTransactions = async () => {
        if (!selectedProject) return;
        try {
            const data = await Transaction.filter({ project_id: selectedProject.id }, "-date");
            setTransactions(data);
        } catch (error) {
            console.error("Error loading transactions:", error);
        }
    };

    const loadAccounts = async () => {
        if (!selectedProject) return;
        try {
            const data = await Account.filter({ project_id: selectedProject.id, is_active: true });
            setAccounts(data);
        } catch (error) {
            console.error("Error loading accounts:", error);
        }
    };

    const generateTransactionNumber = () => {
        return `TXN-${Date.now()}`;
    };

    const handleSave = async (transactionData) => {
        try {
            const dataWithCompany = {
                ...transactionData,
                project_id: selectedProject.id,
                transaction_number: transactionData.transaction_number || generateTransactionNumber()
            };

            if (editingTransaction) {
                await Transaction.update(editingTransaction.id, dataWithCompany);
            } else {
                await Transaction.create(dataWithCompany);
            }

            setShowForm(false);
            setEditingTransaction(null);
            loadTransactions();
        } catch (error) {
            console.error("Error saving transaction:", error);
        }
    };

    const filteredTransactions = transactions.filter(transaction => {
        if (filter === "all") return true;
        return transaction.type === filter || transaction.status === filter;
    });

    if (loading) {
        return (
            <div className="p-8">
                <div className="animate-pulse space-y-6">
                    <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[...Array(3)].map((_, i) => (
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
                    <h1 className="text-3xl font-bold text-gradient">Transactions</h1>
                    <p className="text-gray-600 mt-1">
                        {selectedProject?.name} • {transactions.length} transactions
                    </p>
                </div>
                <Button
                    onClick={() => setShowForm(true)}
                    className="bg-gradient-to-r from-emerald-500 to-emerald-600"
                    disabled={!selectedProject || accounts.length === 0}
                >
                    <Plus className="w-4 h-4 mr-2" />
                    New Transaction
                </Button>
            </div>

            {!selectedProject ? (
                <div className="text-center py-16">
                    <Building className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">No Company Selected</h2>
                    <p className="text-gray-500">Please select a company to manage transactions</p>
                </div>
            ) : accounts.length === 0 ? (
                <div className="text-center py-16">
                    <Receipt className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Set up Chart of Accounts First</h2>
                    <p className="text-gray-500">You need to create accounts before recording transactions</p>
                </div>
            ) : transactions.length === 0 ? (
                <GenerateSampleTransactions 
                    companyId={selectedProject.id} 
                    accounts={accounts} 
                    onGenerationComplete={loadTransactions} 
                />
            ) : (
                <>
                    {/* Stats */}
                    <TransactionStats transactions={transactions} />

                    {/* Transaction Form Modal */}
                    {showForm && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                                <TransactionForm
                                    transaction={editingTransaction}
                                    accounts={accounts}
                                    onSave={handleSave}
                                    onCancel={() => {
                                        setShowForm(false);
                                        setEditingTransaction(null);
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Transactions Table */}
                    <TransactionsTable
                        transactions={filteredTransactions}
                        onEdit={(transaction) => {
                            setEditingTransaction(transaction);
                            setShowForm(true);
                        }}
                        filter={filter}
                        onFilterChange={setFilter}
                    />
                </>
            )}
        </div>
    );
}