import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CardHeader, CardContent, CardFooter, CardTitle } from "@/components/ui/card";
import { Save, X } from "lucide-react";

export default function ProductForm({ product, onSave, onCancel }) {
    const [formData, setFormData] = useState({
        name: '',
        sku: '',
        hsn_code: '',
        description: '',
        category: '',
        purchase_price: 0,
        sale_price: 0,
        tax_rate: 18,
        tax_type: 'CGST+SGST',
        reorder_level: 0,
        track_inventory: true,
        track_batches: false,
    });

    useEffect(() => {
        if (product) {
            setFormData({
                name: product.name || '',
                sku: product.sku || '',
                hsn_code: product.hsn_code || '',
                description: product.description || '',
                category: product.category || '',
                purchase_price: product.purchase_price || 0,
                sale_price: product.sale_price || 0,
                tax_rate: product.tax_rate || 18,
                tax_type: product.tax_type || 'CGST+SGST',
                reorder_level: product.reorder_level || 0,
                track_inventory: product.track_inventory !== undefined ? product.track_inventory : true,
                track_batches: product.track_batches || false,
            });
        } else {
            setFormData(prev => ({ ...prev, sku: `PROD-${Date.now().toString().slice(-6)}` }));
        }
    }, [product]);

    const handleInputChange = (e) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) || 0 : value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <form onSubmit={handleSubmit}>
            <CardHeader className="bg-slate-50">
                <CardTitle>{product ? 'Edit Product' : 'Create New Product'}</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="name">Product Name</Label>
                        <Input id="name" name="name" value={formData.name} onChange={handleInputChange} required />
                    </div>
                    <div>
                        <Label htmlFor="sku">SKU</Label>
                        <Input id="sku" name="sku" value={formData.sku} onChange={handleInputChange} required />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="hsn_code">HSN/SAC Code</Label>
                        <Input id="hsn_code" name="hsn_code" value={formData.hsn_code} onChange={handleInputChange} placeholder="e.g., 8471" />
                    </div>
                    <div>
                        <Label htmlFor="category">Category</Label>
                        <Input id="category" name="category" value={formData.category} onChange={handleInputChange} />
                    </div>
                </div>
                <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" name="description" value={formData.description} onChange={handleInputChange} />
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="purchase_price">Purchase Price ($)</Label>
                        <Input id="purchase_price" name="purchase_price" type="number" step="0.01" value={formData.purchase_price} onChange={handleInputChange} />
                    </div>
                    <div>
                        <Label htmlFor="sale_price">Sale Price ($)</Label>
                        <Input id="sale_price" name="sale_price" type="number" step="0.01" value={formData.sale_price} onChange={handleInputChange} />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg bg-emerald-50">
                    <div>
                        <Label htmlFor="tax_rate">GST Rate (%)</Label>
                        <Input id="tax_rate" name="tax_rate" type="number" step="0.01" value={formData.tax_rate} onChange={handleInputChange} />
                    </div>
                    <div>
                        <Label htmlFor="tax_type">Tax Type</Label>
                        <Select value={formData.tax_type} onValueChange={(val) => setFormData(prev => ({...prev, tax_type: val}))}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="CGST+SGST">CGST + SGST</SelectItem>
                                <SelectItem value="IGST">IGST</SelectItem>
                                <SelectItem value="Exempt">Exempt</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="flex items-center space-x-2 pt-2">
                    <Switch id="track_inventory" checked={formData.track_inventory} onCheckedChange={(checked) => setFormData(prev => ({...prev, track_inventory: checked}))} />
                    <Label htmlFor="track_inventory">Track Inventory</Label>
                </div>
                <div className="flex items-center space-x-2">
                    <Switch id="track_batches" checked={formData.track_batches} onCheckedChange={(checked) => setFormData(prev => ({...prev, track_batches: checked}))} />
                    <Label htmlFor="track_batches">Track Batches & Expiry Dates</Label>
                </div>
                {formData.track_inventory && (
                    <div className="grid grid-cols-1 gap-4 p-4 border rounded-lg bg-slate-50">
                        <div>
                            <Label htmlFor="reorder_level">Reorder Level</Label>
                            <Input id="reorder_level" name="reorder_level" type="number" value={formData.reorder_level} onChange={handleInputChange} />
                        </div>
                        <div className="text-sm text-gray-500 rounded-lg">
                            Stock quantities are managed through Purchase Invoices, Sales Invoices, and Stock Adjustments.
                            {formData.track_batches && " Batch details will be captured during purchase."}
                        </div>
                    </div>
                )}
            </CardContent>
            <CardFooter className="bg-slate-50 flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={onCancel}><X className="w-4 h-4 mr-2" /> Cancel</Button>
                <Button type="submit" className="bg-gradient-to-r from-emerald-500 to-emerald-600"><Save className="w-4 h-4 mr-2" /> Save Product</Button>
            </CardFooter>
        </form>
    );
}