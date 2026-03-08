
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CardHeader, CardContent, CardFooter, CardTitle } from "@/components/ui/card";
import { Save, X, Plus, Trash2, Printer } from "lucide-react";
import TransactionPrintLayout from './TransactionPrintLayout';
import { Company } from '@/entities/Company';

const TRANSACTION_TYPES = ["Journal Entry", "Sales Invoice", "Purchase Bill", "Payment", "Receipt", "Expense"];
const STATUSES = ["Draft", "Posted", "Reversed"];

export default function TransactionForm({ transaction, accounts, onSave, onCancel }) {
    const [formData, setFormData] = useState({
        type: 'Journal Entry',
        date: new Date().toISOString().split('T')[0],
        reference: '',
        description: '',
        status: 'Draft',
        entries: [{ account_id: '', debit: 0, credit: 0, description: '' }]
    });
    const [showPrintView, setShowPrintView] = useState(false);
    const [company, setCompany] = useState(null);

    useEffect(() => {
        if (transaction) {
            setFormData({
                ...transaction,
                date: new Date(transaction.date).toISOString().split('T')[0],
                // Enrich entries with account names for printing
                entries: transaction.entries.map(e => ({
                    ...e,
                    account_name: accounts.find(a => a.id === e.account_id)?.name || 'Unknown Account'
                }))
            });
            // Load company data if transaction has a company_id
            if (transaction.company_id) {
                loadCompany(transaction.company_id);
            }
        }
    }, [transaction, accounts]); // Added accounts to dependency array as it's used to enrich entries

    const loadCompany = async (companyId) => {
        try {
            const companyData = await Company.get(companyId);
            setCompany(companyData);
        } catch (error) {
            console.error("Failed to load company data:", error);
            setCompany(null); // Ensure company is null on error
        }
    };

    useEffect(() => {
        if (showPrintView) {
            // Give a short delay to ensure the print layout is rendered
            const printTimeout = setTimeout(() => {
                window.print();
                setShowPrintView(false); // Reset print view state after printing
            }, 100);

            // Cleanup timeout if component unmounts or showPrintView changes
            return () => clearTimeout(printTimeout);
        }
    }, [showPrintView]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (name, value) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleEntryChange = (index, field, value) => {
        const newEntries = [...formData.entries];
        // Convert debit/credit values to numbers
        if (field === 'debit' || field === 'credit') {
            newEntries[index][field] = parseFloat(value) || 0;
        } else {
            newEntries[index][field] = value;
        }
        setFormData(prev => ({ ...prev, entries: newEntries }));
    };

    const addEntry = () => {
        setFormData(prev => ({
            ...prev,
            entries: [...prev.entries, { account_id: '', debit: 0, credit: 0, description: '' }]
        }));
    };

    const removeEntry = (index) => {
        const newEntries = formData.entries.filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, entries: newEntries }));
    };

    const totalDebits = formData.entries.reduce((sum, e) => sum + (e.debit || 0), 0);
    const totalCredits = formData.entries.reduce((sum, e) => sum + (e.credit || 0), 0);
    // Use a small epsilon for floating-point comparison to check balance
    const isBalanced = Math.abs(totalDebits - totalCredits) < 0.001;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!isBalanced) {
            alert("Transaction is not balanced. Debits must equal credits.");
            return;
        }
        // When saving, remove the transient account_name property from entries
        const entriesToSave = formData.entries.map(({ account_name, ...rest }) => rest);
        onSave({ ...formData, total_amount: totalDebits, entries: entriesToSave });
    };

    const handlePrint = () => {
        setShowPrintView(true);
    };

    return (
        <>
            <form onSubmit={handleSubmit} className="no-print">
                <CardHeader className="bg-slate-50 flex flex-row items-center justify-between">
                    <CardTitle>{transaction ? 'Edit' : 'New'} Transaction</CardTitle>
                    {transaction && ( // Only show print button if transaction exists
                        <Button type="button" variant="outline" onClick={handlePrint}>
                            <Printer className="w-4 h-4 mr-2" />
                            Print / PDF
                        </Button>
                    )}
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div><Label>Type</Label><Select value={formData.type} onValueChange={(v) => handleSelectChange('type', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{TRANSACTION_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
                        <div><Label>Date</Label><Input type="date" name="date" value={formData.date} onChange={handleInputChange} /></div>
                        <div><Label>Status</Label><Select value={formData.status} onValueChange={(v) => handleSelectChange('status', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
                    </div>
                    <div><Label>Description</Label><Input name="description" value={formData.description} onChange={handleInputChange} /></div>
                    
                    <h3 className="text-lg font-semibold">Journal Entries</h3>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Account</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead className="text-right">Debit</TableHead>
                                <TableHead className="text-right">Credit</TableHead>
                                <TableHead></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {formData.entries.map((entry, index) => (
                                <TableRow key={index}>
                                    <TableCell>
                                        <Select value={entry.account_id} onValueChange={(v) => handleEntryChange(index, 'account_id', v)}>
                                            <SelectTrigger><SelectValue placeholder="Select Account" /></SelectTrigger>
                                            <SelectContent>{accounts.map(acc => <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>)}</SelectContent>
                                        </Select>
                                    </TableCell>
                                    <TableCell><Input value={entry.description} onChange={(e) => handleEntryChange(index, 'description', e.target.value)} /></TableCell>
                                    <TableCell><Input type="number" className="text-right" value={entry.debit} onChange={(e) => handleEntryChange(index, 'debit', e.target.value)} /></TableCell>
                                    <TableCell><Input type="number" className="text-right" value={entry.credit} onChange={(e) => handleEntryChange(index, 'credit', e.target.value)} /></TableCell>
                                    <TableCell><Button type="button" variant="ghost" size="icon" onClick={() => removeEntry(index)}><Trash2 className="w-4 h-4 text-red-500" /></Button></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    <Button type="button" variant="outline" onClick={addEntry}><Plus className="w-4 h-4 mr-2" />Add Entry</Button>

                    <div className="flex justify-end gap-8 font-semibold">
                        <div>Total Debits: ${totalDebits.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        <div>Total Credits: ${totalCredits.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    </div>
                    {!isBalanced && <div className="text-right text-red-500 font-semibold">Out of Balance: ${(totalDebits - totalCredits).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>}
                </CardContent>
                <CardFooter className="bg-slate-50 flex justify-end gap-3">
                    <Button type="button" variant="outline" onClick={onCancel}><X className="w-4 h-4 mr-2" /> Cancel</Button>
                    <Button type="submit" disabled={!isBalanced} className="bg-gradient-to-r from-emerald-500 to-emerald-600"><Save className="w-4 h-4 mr-2" /> Save Transaction</Button>
                </CardFooter>
            </form>

            {/* Print Layout - hidden normally, shown for printing */}
            {showPrintView && (
                <div className="hidden printable-area">
                    <TransactionPrintLayout transaction={formData} company={company} />
                </div>
            )}
        </>
    );
}
