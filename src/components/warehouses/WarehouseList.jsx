import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit, Warehouse as WarehouseIcon } from "lucide-react";

export default function WarehouseList({ warehouses, onEdit }) {
    return (
        <Card className="glass-card border-white/20">
            <CardHeader>
                <CardTitle>Warehouse List</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {warehouses.length > 0 ? warehouses.map(w => (
                            <TableRow key={w.id}>
                                <TableCell className="font-medium">{w.name}</TableCell>
                                <TableCell>{w.location}</TableCell>
                                <TableCell>
                                    <Badge variant={w.is_active ? "default" : "destructive"}>
                                        {w.is_active ? "Active" : "Inactive"}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <Button variant="ghost" size="icon" onClick={() => onEdit(w)}>
                                        <Edit className="w-4 h-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">
                                    <WarehouseIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                    No warehouses found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}