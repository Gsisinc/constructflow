import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";

export default function TrialBalance({ accounts, transactions }) {
    const calculateBalances = () => {
        const balances = accounts.reduce((acc, account) => {
            acc[account.id] = { ...account, balance: 0 };
            return acc;
        }, {});

        transactions.forEach(txn => {
            txn.entries.forEach(entry => {
                if (balances[entry.account_id]) {
                    // Normal balances: Assets/Expenses are debit, others are credit
                    const isDebitNormal = ['Assets', 'Expenses'].includes(balances[entry.account_id].type);
                    if(isDebitNormal) {
                        balances[entry.account_id].balance += (entry.debit || 0) - (entry.credit || 0);
                    } else {
                        balances[entry.account_id].balance += (entry.credit || 0) - (entry.debit || 0);
                    }
                }
            });
        });
        return Object.values(balances).filter(a => a.balance !== 0);
    };

    const finalAccounts = calculateBalances();

    const totalDebits = finalAccounts.filter(a => ['Assets', 'Expenses'].includes(a.type)).reduce((sum, a) => sum + a.balance, 0);
    const totalCredits = finalAccounts.filter(a => ['Liabilities', 'Equity', 'Revenue'].includes(a.type)).reduce((sum, a) => sum + a.balance, 0);

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold text-center mb-6">Trial Balance</h2>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Account</TableHead>
                        <TableHead className="text-right">Debit</TableHead>
                        <TableHead className="text-right">Credit</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {finalAccounts.map(account => (
                        <TableRow key={account.id}>
                            <TableCell>{account.name}</TableCell>
                            <TableCell className="text-right font-mono">
                                {['Assets', 'Expenses'].includes(account.type) ? `$${account.balance.toLocaleString()}` : ''}
                            </TableCell>
                             <TableCell className="text-right font-mono">
                                {['Liabilities', 'Equity', 'Revenue'].includes(account.type) ? `$${account.balance.toLocaleString()}` : ''}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
                <TableFooter>
                    <TableRow className="font-bold text-lg">
                        <TableCell>Totals</TableCell>
                        <TableCell className="text-right font-mono">${totalDebits.toLocaleString()}</TableCell>
                        <TableCell className="text-right font-mono">${totalCredits.toLocaleString()}</TableCell>
                    </TableRow>
                </TableFooter>
            </Table>
        </div>
    );
}