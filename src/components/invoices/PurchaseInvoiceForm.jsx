import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CardHeader, CardContent, CardFooter, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Save, X, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";

export default function PurchaseInvoiceForm({ invoice, products, warehouses, company, onSave, onCancel }) {
    const [formData, setFormData] = useState({
        invoice_number: '',
        invoice_date: format(new Date(), 'yyyy-MM-dd'),
        due_date: format(new Date(Date.now() + 30*24*60*60*1000), 'yyyy-MM-dd'),
        supplier_name: '',
        supplier_email: '',
        supplier_phone: '',
        warehouse_id: '',
        line_items: [],
        subtotal: 0,
        tax_amount: 0,
        total_amount: 0,
        payment_terms: 'Net 30',
        notes: '',
        status: 'Draft'
    });

    useEffect(() => {
        if (invoice) {
            setFormData(invoice);
        } else {
            setFormData(prev => ({ 
                ...prev, 
                invoice_number: `PINV-${Date.now().toString().slice(-8)}`,
                warehouse_id: warehouses.length > 0 ? warehouses[0].id : ''
            }));
        }
    }, [invoice, warehouses]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const addLineItem = () => {
        setFormData(prev => ({
            ...prev,
            line_items: [...prev.line_items, { 
                product_id: '', 
                product_name: '', 
                batch_number: '', 
                expiry_date: '', 
                quantity: 1, 
                unit_price: 0, 
                tax_rate: 0, 
                tax_amount: 0, 
                total: 0 
            }]
        }));
    };

    const updateLineItem = (index, field, value) => {
        const updatedItems = [...formData.line_items];
        updatedItems[index][field] = value;

        if (field === 'product_id') {
            const product = products.find(p => p.id === value);
            if (product) {
                updatedItems[index].product_name = product.name;
                updatedItems[index].unit_price = product.purchase_price;
                updatedItems[index].tax_rate = product.tax_rate || 0;
            }
        }

        if (field === 'quantity' || field === 'unit_price' || field === 'tax_rate') {
            const item = updatedItems[index];
            const subtotal = item.quantity * item.unit_price;
            item.tax_amount = (subtotal * item.tax_rate) / 100;
            item.total = subtotal + item.tax_amount;
        }

        const subtotal = updatedItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
        const tax_amount = updatedItems.reduce((sum, item) => sum + item.tax_amount, 0);
        const total_amount = subtotal + tax_amount;

        setFormData(prev => ({
            ...prev,
            line_items: updatedItems,
            subtotal,
            tax_amount,
            total_amount
        }));
    };

    const removeLineItem = (index) => {
        const updatedItems = formData.line_items.filter((_, i) => i !== index);
        const subtotal = updatedItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
        const tax_amount = updatedItems.reduce((sum, item) => sum + item.tax_amount, 0);
        const total_amount = subtotal + tax_amount;
        
        setFormData(prev => ({
            ...prev,
            line_items: updatedItems,
            subtotal,
            tax_amount,
            total_amount
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <form onSubmit={handleSubmit}>
            <CardHeader className="bg-slate-50">
                <CardTitle>{invoice ? 'Edit Purchase Invoice' : 'Create New Purchase Invoice'}</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <Label>Invoice Number</Label>
                        <Input name="invoice_number" value={formData.invoice_number} onChange={handleInputChange} required />
                    </div>
                    <div>
                        <Label>Invoice Date</Label>
                        <Input type="date" name="invoice_date" value={formData.invoice_date} onChange={handleInputChange} required />
                    </div>
                    <div>
                        <Label>Due Date</Label>
                        <Input type="date" name="due_date" value={formData.due_date} onChange={handleInputChange} required />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <Label>Supplier Name</Label>
                        <Input name="supplier_name" value={formData.supplier_name} onChange={handleInputChange} required />
                    </div>
                    <div>
                        <Label>Supplier Email</Label>
                        <Input type="email" name="supplier_email" value={formData.supplier_email} onChange={handleInputChange} />
                    </div>
                    <div>
                        <Label>Warehouse</Label>
                        <Select value={formData.warehouse_id} onValueChange={(val) => setFormData(prev => ({...prev, warehouse_id: val}))}>
                            <SelectTrigger><SelectValue placeholder="Select warehouse" /></SelectTrigger>
                            <SelectContent>
                                {warehouses.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div>
                    <div className="flex justify-between items-center mb-2">
                        <Label>Line Items</Label>
                        <Button type="button" size="sm" onClick={addLineItem}><Plus className="w-4 h-4 mr-1" /> Add Item</Button>
                    </div>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Product</TableHead>
                                <TableHead>Batch</TableHead>
                                <TableHead>Expiry</TableHead>
                                <TableHead>Qty</TableHead>
                                <TableHead>Price</TableHead>
                                <TableHead>Tax %</TableHead>
                                <TableHead>Total</TableHead>
                                <TableHead></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {formData.line_items.map((item, idx) => {
                                const product = products.find(p => p.id === item.product_id);
                                return (
                                    <TableRow key={idx}>
                                        <TableCell>
                                            <Select value={item.product_id} onValueChange={(val) => updateLineItem(idx, 'product_id', val)}>
                                                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                                                <SelectContent>
                                                    {products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                        <TableCell>
                                            {product?.track_batches ? (
                                                <Input placeholder="Batch #" value={item.batch_number} onChange={(e) => updateLineItem(idx, 'batch_number', e.target.value)} />
                                            ) : '-'}
                                        </TableCell>
                                        <TableCell>
                                            {product?.track_batches ? (
                                                <Input type="date" value={item.expiry_date} onChange={(e) => updateLineItem(idx, 'expiry_date', e.target.value)} />
                                            ) : '-'}
                                        </TableCell>
                                        <TableCell><Input type="number" value={item.quantity} onChange={(e) => updateLineItem(idx, 'quantity', parseFloat(e.target.value) || 0)} /></TableCell>
                                        <TableCell><Input type="number" step="0.01" value={item.unit_price} onChange={(e) => updateLineItem(idx, 'unit_price', parseFloat(e.target.value) || 0)} /></TableCell>
                                        <TableCell><Input type="number" step="0.01" value={item.tax_rate} onChange={(e) => updateLineItem(idx, 'tax_rate', parseFloat(e.target.value) || 0)} /></TableCell>
                                        <TableCell>${item.total.toFixed(2)}</TableCell>
                                        <TableCell><Button type="button" variant="ghost" size="icon" onClick={() => removeLineItem(idx)}><Trash2 className="w-4 h-4" /></Button></TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>

                <div className="flex justify-end">
                    <div className="w-64 space-y-2">
                        <div className="flex justify-between"><span>Subtotal:</span><span className="font-semibold">${formData.subtotal.toFixed(2)}</span></div>
                        <div className="flex justify-between"><span>Tax:</span><span className="font-semibold">${formData.tax_amount.toFixed(2)}</span></div>
                        <div className="flex justify-between text-lg font-bold border-t pt-2"><span>Total:</span><span>${formData.total_amount.toFixed(2)}</span></div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label>Payment Terms</Label>
                        <Input name="payment_terms" value={formData.payment_terms} onChange={handleInputChange} />
                    </div>
                    <div>
                        <Label>Status</Label>
                        <Select value={formData.status} onValueChange={(val) => setFormData(prev => ({...prev, status: val}))}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Draft">Draft</SelectItem>
                                <SelectItem value="Received">Received</SelectItem>
                                <SelectItem value="Paid">Paid</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div>
                    <Label>Notes</Label>
                    <Textarea name="notes" value={formData.notes} onChange={handleInputChange} />
                </div>
            </CardContent>
            <CardFooter className="bg-slate-50 flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={onCancel}><X className="w-4 h-4 mr-2" /> Cancel</Button>
                <Button type="submit" className="bg-gradient-to-r from-emerald-500 to-emerald-600"><Save className="w-4 h-4 mr-2" /> Save</Button>
            </CardFooter>
        </form>
    );
}