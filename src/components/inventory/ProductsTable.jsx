import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit, Package } from "lucide-react";

export default function ProductsTable({ products, onEdit }) {

    const getStockBadge = (product) => {
        if (!product.track_inventory) {
            return <Badge variant="secondary">Not Tracked</Badge>;
        }
        if (product.quantity_on_hand <= 0) {
            return <Badge className="bg-red-100 text-red-800">Out of Stock</Badge>;
        }
        if (product.quantity_on_hand <= product.reorder_level) {
            return <Badge className="bg-yellow-100 text-yellow-800">Low Stock</Badge>;
        }
        return <Badge className="bg-green-100 text-green-800">In Stock</Badge>;
    };

    return (
        <Card className="glass-card border-white/20">
            <CardHeader>
                <CardTitle>Products List</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>SKU</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>HSN</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead className="text-right">Sale Price</TableHead>
                                <TableHead className="text-right">Tax %</TableHead>
                                <TableHead className="text-right">Qty</TableHead>
                                <TableHead>Stock</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {products.length > 0 ? products.map(product => (
                                <TableRow key={product.id}>
                                    <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                                    <TableCell className="font-medium">
                                        {product.name}
                                        {product.track_batches && <Badge variant="secondary" className="ml-2 text-xs">Batch</Badge>}
                                    </TableCell>
                                    <TableCell className="text-xs">{product.hsn_code || '-'}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{product.category || '-'}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right font-mono">${(product.sale_price || 0).toLocaleString()}</TableCell>
                                    <TableCell className="text-right font-medium text-emerald-600">{product.tax_rate || 0}%</TableCell>
                                    <TableCell className="text-right font-medium">{product.track_inventory ? product.quantity_on_hand : 'N/A'}</TableCell>
                                    <TableCell>{getStockBadge(product)}</TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="icon" onClick={() => onEdit(product)}>
                                            <Edit className="w-4 h-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={9} className="h-24 text-center">
                                        <Package className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                        No products found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}