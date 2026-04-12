import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Account } from "@/entities/Account";
import { Transaction } from "@/entities/Transaction";
import { Project } from "@/entities/Project";
import { User } from "@/entities/User";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Building, FileText } from "lucide-react";
import { format } from "date-fns";

export default function Ledger() {
    const [accounts, setAccounts] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [projects, setProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState(null);
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [dateFrom, setDateFrom] = useState(format(new Date(new Date().getFullYear(), 0, 1), 'yyyy-MM-dd'));
    const [dateTo, setDateTo] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [ledgerEntries, setLedgerEntries] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (selectedProject) {
            loadAccounts();
            loadTransactions();
        }
    }, [selectedProject]);

    useEffect(() => {
        if (selectedAccount) {
            generateLedger();
        }
    }, [selectedAccount, transactions, dateFrom, dateTo]);

    const loadData = async () => {
        setLoading(true);
        try {
            const projectsData = await base44.entities.Company.filter({});
            setProjects(projectsData);
            if (projectsData.length > 0) {
                const companyId = localStorage.getItem('selectedProjectId') || projectsData[0].id;
                setSelectedProject(projectsData.find(c => c.id === companyId) || projectsData[0]);
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

    const loadTransactions = async () => {
        if (!selectedProject) return;
        try {
            const data = await Transaction.filter({ project_id: selectedProject.id, status: 'Posted' }, '-date');
            setTransactions(data);
        } catch (error) {
            console.error("Error loading transactions:", error);
        }
    };

    const generateLedger = () => {
        if (!selectedAccount) return;

        const entries = [];
        let runningBalance = selectedAccount.balance || 0;

        // Filter and process transactions
        const filteredTxns = transactions.filter(txn => {
            const txnDate = new Date(txn.date);
            return txnDate >= new Date(dateFrom) && txnDate <= new Date(dateTo);
        });

        filteredTxns.forEach(txn => {
            txn.entries?.forEach(entry => {
                if (entry.account_id === selectedAccount.id) {
                    const debit = entry.debit || 0;
                    const credit = entry.credit || 0;
                    runningBalance += debit - credit;
                    
                    entries.push({
                        date: txn.date,
                        reference: txn.reference || txn.transaction_number,
                        description: entry.description || txn.description,
                        debit,
                        credit,
                        balance: runningBalance
                    });
                }
            });
        });

        setLedgerEntries(entries);
    };

    if (loading) {
        return <div className="p-8">Loading...</div>;
    }

    const totalDebit = ledgerEntries.reduce((sum, e) => sum + e.debit, 0);
    const totalCredit = ledgerEntries.reduce((sum, e) => sum + e.credit, 0);

    return (
        <div className="p-4 lg:p-8 space-y-8">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gradient">Account Ledger</h1>
                    <p className="text-gray-600 mt-1">{selectedProject?.name}</p>
                </div>
            </div>

            {!selectedProject ? (
                <div className="text-center py-16">
                    <Building className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">No Company Selected</h2>
                    <p className="text-gray-500">Please select a company to view ledger.</p>
                </div>
            ) : (
                <>
                    <Card className="glass-card border-white/20">
                        <CardContent className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div>
                                    <Label>Select Account</Label>
                                    <Select value={selectedAccount?.id} onValueChange={(val) => setSelectedAccount(accounts.find(a => a.id === val))}>
                                        <SelectTrigger><SelectValue placeholder="Choose account" /></SelectTrigger>
                                        <SelectContent>
                                            {accounts.map(acc => (
                                                <SelectItem key={acc.id} value={acc.id}>
                                                    {acc.account_code} - {acc.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label>From Date</Label>
                                    <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                                </div>
                                <div>
                                    <Label>To Date</Label>
                                    <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                                </div>
                                <div className="flex items-end">
                                    <Button onClick={generateLedger} className="w-full">Generate Report</Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {selectedAccount && (
                        <Card className="glass-card border-white/20">
                            <CardHeader>
                                <CardTitle>
                                    Ledger: {selectedAccount.account_code} - {selectedAccount.name}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Reference</TableHead>
                                            <TableHead>Description</TableHead>
                                            <TableHead className="text-right">Debit</TableHead>
                                            <TableHead className="text-right">Credit</TableHead>
                                            <TableHead className="text-right">Balance</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {ledgerEntries.length > 0 ? ledgerEntries.map((entry, idx) => (
                                            <TableRow key={idx}>
                                                <TableCell>{format(new Date(entry.date), 'MMM dd, yyyy')}</TableCell>
                                                <TableCell className="font-mono text-sm">{entry.reference}</TableCell>
                                                <TableCell>{entry.description}</TableCell>
                                                <TableCell className="text-right font-mono">{entry.debit > 0 ? `$${entry.debit.toLocaleString()}` : '-'}</TableCell>
                                                <TableCell className="text-right font-mono">{entry.credit > 0 ? `$${entry.credit.toLocaleString()}` : '-'}</TableCell>
                                                <TableCell className="text-right font-mono font-semibold">${entry.balance.toLocaleString()}</TableCell>
                                            </TableRow>
                                        )) : (
                                            <TableRow>
                                                <TableCell colSpan={6} className="h-24 text-center">
                                                    <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                                    {selectedAccount ? 'No transactions found for the selected period.' : 'Please select an account.'}
                                                </TableCell>
                                            </TableRow>
                                        )}
                                        {ledgerEntries.length > 0 && (
                                            <TableRow className="font-bold bg-slate-50">
                                                <TableCell colSpan={3}>Total</TableCell>
                                                <TableCell className="text-right">${totalDebit.toLocaleString()}</TableCell>
                                                <TableCell className="text-right">${totalCredit.toLocaleString()}</TableCell>
                                                <TableCell className="text-right">${(totalDebit - totalCredit).toLocaleString()}</TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    )}
                </>
            )}
        </div>
    );
}