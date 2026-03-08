import React, { useState } from 'react';
import { Transaction } from '@/entities/Transaction';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Receipt, Wand2, Loader2 } from 'lucide-react';

// Helper to find account by name from the accounts list
const findAccount = (accounts, name) => accounts.find(a => a.name === name);

export default function GenerateSampleTransactions({ companyId, accounts, onGenerationComplete }) {
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerate = async () => {
        setIsGenerating(true);

        const cash = findAccount(accounts, "Cash on Hand");
        const ar = findAccount(accounts, "Accounts Receivable");
        const ap = findAccount(accounts, "Accounts Payable");
        const sales = findAccount(accounts, "Sales Revenue");
        const officeExpense = findAccount(accounts, "Office Supplies Expense");
        const rentExpense = findAccount(accounts, "Rent Expense");

        if (!cash || !ar || !ap || !sales || !officeExpense || !rentExpense) {
            alert("Could not find all required standard accounts. Please ensure your Chart of Accounts is set up correctly.");
            setIsGenerating(false);
            return;
        }

        const transactionsToCreate = [
            {
                company_id: companyId,
                type: 'Sales Invoice',
                date: new Date().toISOString().split('T')[0],
                description: 'Web design services for Client A',
                total_amount: 5000,
                status: 'Posted',
                entries: [
                    { account_id: ar.id, debit: 5000, credit: 0 },
                    { account_id: sales.id, debit: 0, credit: 5000 }
                ]
            },
            {
                company_id: companyId,
                type: 'Purchase Bill',
                date: new Date().toISOString().split('T')[0],
                description: 'Office supplies from Supplier B',
                total_amount: 350,
                status: 'Posted',
                entries: [
                    { account_id: officeExpense.id, debit: 350, credit: 0 },
                    { account_id: ap.id, debit: 0, credit: 350 }
                ]
            },
            {
                company_id: companyId,
                type: 'Expense',
                date: new Date().toISOString().split('T')[0],
                description: 'Monthly office rent',
                total_amount: 2500,
                status: 'Posted',
                entries: [
                    { account_id: rentExpense.id, debit: 2500, credit: 0 },
                    { account_id: cash.id, debit: 0, credit: 2500 }
                ]
            },
            {
                company_id: companyId,
                type: 'Receipt',
                date: new Date().toISOString().split('T')[0],
                description: 'Payment from Client A',
                total_amount: 2500,
                status: 'Posted',
                entries: [
                    { account_id: cash.id, debit: 2500, credit: 0 },
                    { account_id: ar.id, debit: 0, credit: 2500 }
                ]
            }
        ];

        try {
            await Transaction.bulkCreate(transactionsToCreate);
            onGenerationComplete();
        } catch (error) {
            console.error("Failed to generate sample transactions", error);
        }
        setIsGenerating(false);
    };

    return (
        <Card className="glass-card border-white/20 mt-8 text-center">
            <CardHeader>
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center">
                    <Receipt className="w-8 h-8 text-blue-700" />
                </div>
                <CardTitle className="mt-4">Generate Sample Transactions</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-gray-600 mb-6">
                    Populate your books with sample data to see the application in action.
                </p>
                <Button 
                    onClick={handleGenerate} 
                    disabled={isGenerating}
                    className="bg-gradient-to-r from-blue-500 to-blue-600"
                >
                    {isGenerating ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                        <Wand2 className="w-4 h-4 mr-2" />
                    )}
                    {isGenerating ? 'Generating...' : 'Generate Sample Data'}
                </Button>
            </CardContent>
        </Card>
    );
}