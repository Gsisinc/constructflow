import React from 'react';

export default function BalanceSheet({ accounts, transactions }) {
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

    const assets = finalAccounts.filter(a => a.type === 'Assets');
    const liabilities = finalAccounts.filter(a => a.type === 'Liabilities');
    const equity = finalAccounts.filter(a => a.type === 'Equity');

    const totalAssets = assets.reduce((sum, a) => sum + a.balance, 0);
    const totalLiabilities = liabilities.reduce((sum, a) => sum + a.balance, 0);
    const totalEquity = equity.reduce((sum, a) => sum + a.balance, 0);

    const ReportRow = ({ label, value, isTotal = false }) => (
        <div className={`flex justify-between py-2 ${isTotal ? 'font-bold border-t' : ''}`}>
            <span>{label}</span>
            <span className="font-mono">${value.toLocaleString()}</span>
        </div>
    );

    const Section = ({ title, items, total }) => (
        <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2 border-b pb-1">{title}</h3>
            {items.map(item => <ReportRow key={item.id} label={item.name} value={item.balance} />)}
            <ReportRow label={`Total ${title}`} value={total} isTotal={true} />
        </div>
    );

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold text-center mb-6">Balance Sheet</h2>
            <div className="grid md:grid-cols-2 gap-8">
                <div>
                    <Section title="Assets" items={assets} total={totalAssets} />
                </div>
                <div>
                    <Section title="Liabilities" items={liabilities} total={totalLiabilities} />
                    <Section title="Equity" items={equity} total={totalEquity} />
                    <ReportRow label="Total Liabilities & Equity" value={totalLiabilities + totalEquity} isTotal={true} />
                </div>
            </div>
        </div>
    );
}