import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { format } from "date-fns";

export default function TransactionPrintLayout({ transaction, company }) {
    if (!transaction) return null;
    
    const totalDebits = transaction.entries.reduce((sum, e) => sum + (e.debit || 0), 0);

    return (
        <div className="p-8 font-sans text-sm">
            <header className="flex justify-between items-start mb-8">
                <div>
                    <h1 className="text-2xl font-bold">{company?.name || 'Your Company'}</h1>
                    <p>{company?.address?.street}</p>
                    <p>{company?.address?.city}, {company?.address?.state} {company?.address?.postal_code}</p>
                </div>
                <div className="text-right">
                    <h2 className="text-3xl font-bold uppercase text-gray-700">{transaction.type}</h2>
                    <p className="text-gray-500">#{transaction.transaction_number}</p>
                </div>
            </header>
            
            <section className="grid grid-cols-2 gap-8 mb-8">
                 <div>
                    <h3 className="font-semibold border-b mb-2 pb-1">Transaction Details</h3>
                    <p><strong>Date:</strong> {format(new Date(transaction.date), 'MMMM d, yyyy')}</p>
                    <p><strong>Status:</strong> {transaction.status}</p>
                    <p><strong>Description:</strong> {transaction.description}</p>
                </div>
            </section>
            
            <section>
                 <Table>
                    <TableHeader>
                        <TableRow className="bg-gray-100">
                            <TableHead>Account</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead className="text-right">Debit</TableHead>
                            <TableHead className="text-right">Credit</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {transaction.entries.map((entry, index) => (
                            <TableRow key={index}>
                                <TableCell>{entry.account_name || 'N/A'}</TableCell>
                                <TableCell>{entry.description}</TableCell>
                                <TableCell className="text-right">${(entry.debit || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</TableCell>
                                <TableCell className="text-right">${(entry.credit || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                    <TableFooter>
                        <TableRow className="font-bold text-base">
                            <TableCell colSpan={2}>Total</TableCell>
                            <TableCell className="text-right">${totalDebits.toLocaleString(undefined, {minimumFractionDigits: 2})}</TableCell>
                             <TableCell className="text-right">${totalDebits.toLocaleString(undefined, {minimumFractionDigits: 2})}</TableCell>
                        </TableRow>
                    </TableFooter>
                </Table>
            </section>
            
            <footer className="text-center text-xs text-gray-400 mt-16">
                <p>Thank you for your business.</p>
                <p>{company?.name} - {company?.contact?.email} - {company?.contact?.website}</p>
            </footer>
        </div>
    );
}