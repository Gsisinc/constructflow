import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const ACCOUNT_TYPES = ["all", "Assets", "Liabilities", "Equity", "Revenue", "Expenses"];
const TYPE_COLORS = {
    Assets: "bg-blue-100 text-blue-800",
    Liabilities: "bg-red-100 text-red-800",
    Equity: "bg-purple-100 text-purple-800",
    Revenue: "bg-green-100 text-green-800",
    Expenses: "bg-orange-100 text-orange-800",
};

export default function AccountsTable({ accounts, onEdit, filter, onFilterChange }) {
    return (
        <Card className="glass-card border-white/20">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle>Accounts List</CardTitle>
                    <Tabs value={filter} onValueChange={onFilterChange}>
                        <TabsList>
                            {ACCOUNT_TYPES.map(type => (
                                <TabsTrigger key={type} value={type}>{type === 'all' ? 'All' : type}</TabsTrigger>
                            ))}
                        </TabsList>
                    </Tabs>
                </div>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Code</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Subtype</TableHead>
                                <TableHead className="text-right">Balance</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {accounts.map(account => (
                                <TableRow key={account.id}>
                                    <TableCell>{account.account_code}</TableCell>
                                    <TableCell className="font-medium">{account.name}</TableCell>
                                    <TableCell>
                                        <Badge className={TYPE_COLORS[account.type]}>{account.type}</Badge>
                                    </TableCell>
                                    <TableCell>{account.subtype}</TableCell>
                                    <TableCell className="text-right font-mono">${(account.balance || 0).toLocaleString()}</TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="icon" onClick={() => onEdit(account)}>
                                            <Edit className="w-4 h-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}