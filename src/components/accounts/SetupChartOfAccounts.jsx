import React, { useState } from 'react';
import { Account } from '@/entities/Account';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Wand2, Loader2 } from 'lucide-react';

const STANDARD_ACCOUNTS = [
    // Assets
    { account_code: '1010', name: 'Cash on Hand', type: 'Assets', subtype: 'Current Assets' },
    { account_code: '1020', name: 'Accounts Receivable', type: 'Assets', subtype: 'Current Assets' },
    { account_code: '1050', name: 'Office Equipment', type: 'Assets', subtype: 'Fixed Assets' },
    // Liabilities
    { account_code: '2010', name: 'Accounts Payable', type: 'Liabilities', subtype: 'Current Liabilities' },
    { account_code: '2020', name: 'Credit Card Payable', type: 'Liabilities', subtype: 'Current Liabilities' },
    // Equity
    { account_code: '3010', name: 'Owner\'s Contribution', type: 'Equity', subtype: 'Owner\'s Equity' },
    { account_code: '3020', name: 'Retained Earnings', type: 'Equity', subtype: 'Retained Earnings' },
    // Revenue
    { account_code: '4010', name: 'Sales Revenue', type: 'Revenue', subtype: 'Operating Revenue' },
    { account_code: '4020', name: 'Service Revenue', type: 'Revenue', subtype: 'Operating Revenue' },
    // Expenses
    { account_code: '5010', name: 'Cost of Goods Sold', type: 'Expenses', subtype: 'Cost of Goods Sold' },
    { account_code: '5020', name: 'Office Supplies Expense', type: 'Expenses', subtype: 'Operating Expenses' },
    { account_code: '5030', name: 'Rent Expense', type: 'Expenses', subtype: 'Operating Expenses' },
    { account_code: '5040', name: 'Salaries Expense', type: 'Expenses', subtype: 'Operating Expenses' },
];

export default function SetupChartOfAccounts({ companyId, onSetupComplete }) {
    const [isSettingUp, setIsSettingUp] = useState(false);

    const handleSetup = async () => {
        setIsSettingUp(true);
        const accountsToCreate = STANDARD_ACCOUNTS.map(acc => ({ ...acc, company_id: companyId }));
        try {
            await Account.bulkCreate(accountsToCreate);
            onSetupComplete();
        } catch (error) {
            console.error("Failed to setup standard chart of accounts", error);
            // Optionally show an error message to the user
        }
        setIsSettingUp(false);
    };

    return (
        <Card className="glass-card border-white/20 mt-8 text-center">
            <CardHeader>
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-full flex items-center justify-center">
                    <PieChart className="w-8 h-8 text-emerald-700" />
                </div>
                <CardTitle className="mt-4">Set up your Chart of Accounts</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-gray-600 mb-6">
                    Get started quickly by generating a standard chart of accounts for your business.
                </p>
                <Button 
                    onClick={handleSetup} 
                    disabled={isSettingUp}
                    className="bg-gradient-to-r from-emerald-500 to-emerald-600"
                >
                    {isSettingUp ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                        <Wand2 className="w-4 h-4 mr-2" />
                    )}
                    {isSettingUp ? 'Setting up...' : 'Generate Standard Accounts'}
                </Button>
            </CardContent>
        </Card>
    );
}