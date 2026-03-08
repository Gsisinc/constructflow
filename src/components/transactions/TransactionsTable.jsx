import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Edit } from "lucide-react";
import { format } from "date-fns";

const FILTERS = ["all", "Journal Entry", "Sales Invoice", "Purchase Bill", "Posted", "Draft"];
const STATUS_COLORS = { Posted: "bg-emerald-100 text-emerald-800", Draft: "bg-yellow-100 text-yellow-800", Reversed: "bg-red-100 text-red-800" };

export default function TransactionsTable({ transactions, onEdit, filter, onFilterChange }) {
    return (
        <Card className="glass-card border-white/20">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle>Transactions List</CardTitle>
                    <Tabs value={filter} onValueChange={onFilterChange}>
                        <TabsList>{FILTERS.map(f => <TabsTrigger key={f} value={f}>{f === 'all' ? 'All' : f}</TabsTrigger>)}</TabsList>
                    </Tabs>
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {transactions.map(t => (
                            <TableRow key={t.id}>
                                <TableCell>{format(new Date(t.date), 'MMM d, yyyy')}</TableCell>
                                <TableCell>{t.type}</TableCell>
                                <TableCell className="font-medium">{t.description}</TableCell>
                                <TableCell><Badge className={STATUS_COLORS[t.status]}>{t.status}</Badge></TableCell>
                                <TableCell className="text-right font-mono">${t.total_amount?.toLocaleString()}</TableCell>
                                <TableCell><Button variant="ghost" size="icon" onClick={() => onEdit(t)}><Edit className="w-4 h-4" /></Button></TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}