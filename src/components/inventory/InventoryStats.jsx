
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, DollarSign, AlertTriangle } from 'lucide-react';

export default function InventoryStats({ products }) {
    const totalProducts = products.length;
    const totalStockValue = products.reduce((sum, p) => {
        // Use quantity_on_hand which is now an aggregated value on the product object
        return sum + (p.purchase_price * (p.quantity_on_hand || 0));
    }, 0);
    const lowStockItems = products.filter(p => p.track_inventory && (p.quantity_on_hand || 0) <= p.reorder_level).length;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="glass-card border-white/20">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-medium text-gray-600">Total Products</CardTitle>
                    <Package className="w-4 h-4 text-gray-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-gradient">{totalProducts}</div>
                </CardContent>
            </Card>
            <Card className="glass-card border-white/20">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-medium text-gray-600">Total Stock Value</CardTitle>
                    <DollarSign className="w-4 h-4 text-gray-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-emerald-600">${totalStockValue.toLocaleString()}</div>
                </CardContent>
            </Card>
            <Card className="glass-card border-white/20">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-medium text-gray-600">Low Stock Items</CardTitle>
                    <AlertTriangle className="w-4 h-4 text-gray-500" />
                </CardHeader>
                <CardContent>
                    <div className={`text-2xl font-bold ${lowStockItems > 0 ? 'text-rose-600' : 'text-slate-900'}`}>{lowStockItems}</div>
                </CardContent>
            </Card>
        </div>
    );
}
