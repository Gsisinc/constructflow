import React from 'react';

export default function IncomeStatement({ accounts, transactions }) {
    const calculateBalances = () => {
        const balances = accounts.reduce((acc, account) => {
            acc[account.id] = { ...account, balance: 0 };
            return acc;
        }, {});

        transactions.forEach(txn => {
            txn.entries.forEach(entry => {
                if (balances[entry.account_id]) {
                    balances[entry.account_id].balance += (entry.debit || 0) - (entry.credit || 0);
                }
            });
        });
        return Object.values(balances);
    };
    
    const finalAccounts = calculateBalances();

    const revenue = finalAccounts.filter(a => a.type === 'Revenue');
    const expenses = finalAccounts.filter(a => a.type === 'Expenses');

    const totalRevenue = revenue.reduce((sum, a) => sum - a.balance, 0); // Revenue has credit balance
    const totalExpenses = expenses.reduce((sum, a) => sum + a.balance, 0); // Expenses have debit balance
    const netIncome = totalRevenue - totalExpenses;

    const ReportRow = ({ label, value, isTotal = false, isFinal = false }) => (
        <div className={`flex justify-between py-2 ${isTotal ? 'font-bold border-t' : ''} ${isFinal ? 'text-lg border-double border-t-4 pt-2 mt-2' : ''}`}>
            <span>{label}</span>
            <span className="font-mono">${value.toLocaleString()}</span>
        </div>
    );
    
    return (
        <div className="p-6 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-6">Income Statement</h2>
            <div className="space-y-4">
                <h3 className="font-semibold">Revenue</h3>
                {revenue.map(item => <ReportRow key={item.id} label={item.name} value={-item.balance} />)}
                <ReportRow label="Total Revenue" value={totalRevenue} isTotal={true} />

                <h3 className="font-semibold mt-6">Expenses</h3>
                {expenses.map(item => <ReportRow key={item.id} label={item.name} value={item.balance} />)}
                <ReportRow label="Total Expenses" value={totalExpenses} isTotal={true} />

                <ReportRow label="Net Income" value={netIncome} isFinal={true} />
            </div>
        </div>
    );
}