import React, { useState, useEffect } from "react";
import { PurchaseInvoice } from "@/entities/PurchaseInvoice";
import { Product } from "@/entities/Product";
import { Account } from "@/entities/Account";
import { Transaction } from "@/entities/Transaction";
import { InventoryStock } from "@/entities/InventoryStock";
import { Warehouse } from "@/entities/Warehouse";
import { Batch } from "@/entities/Batch";
import { BatchStock } from "@/entities/BatchStock";
import { Project } from "@/entities/Project";
import { User } from "@/entities/User";
import { Button } from "@/components/ui/button";
import { Plus, Building } from "lucide-react";

import PurchaseInvoiceForm from "../components/invoices/PurchaseInvoiceForm";
import PurchaseInvoiceList from "../components/invoices/PurchaseInvoiceList";
import PurchaseInvoiceStats from "../components/invoices/PurchaseInvoiceStats";

export default function PurchaseInvoices() {
    const [invoices, setInvoices] = useState([]);
    const [products, setProducts] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [projects, setProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [editingInvoice, setEditingInvoice] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (selectedProject) {
            loadInvoices();
            loadProducts();
            loadWarehouses();
            loadAccounts();
        }
    }, [selectedProject]);

    const loadData = async () => {
        setLoading(true);
        try {
            const user = await User.me();
            const projectsData = await Project.filter({ created_by: user.email });
            setProjects(projectsData);
            if (projectsData.length > 0) {
                const companyId = localStorage.getItem('selectedProjectId') || projectsData[0].id;
                setSelectedProject(projectsData.find(c => c.id === companyId) || projectsData[0]);
            }
        } catch (error) {
            console.error("Error loading data:", error);
        }
        setLoading(false);
    };

    const loadInvoices = async () => {
        if (!selectedProject) return;
        try {
            const data = await PurchaseInvoice.filter({ project_id: selectedProject.id }, "-invoice_date");
            setInvoices(data);
        } catch (error) {
            console.error("Error loading invoices:", error);
        }
    };

    const loadProducts = async () => {
        if (!selectedProject) return;
        try {
            const data = await Product.filter({ project_id: selectedProject.id });
            setProducts(data);
        } catch (error) {
            console.error("Error loading products:", error);
        }
    };

    const loadWarehouses = async () => {
        if (!selectedProject) return;
        try {
            const data = await Warehouse.filter({ project_id: selectedProject.id, is_active: true });
            setWarehouses(data);
        } catch (error) {
            console.error("Error loading warehouses:", error);
        }
    };

    const loadAccounts = async () => {
        if (!selectedProject) return;
        try {
            const data = await Account.filter({ project_id: selectedProject.id });
            setAccounts(data);
        } catch (error) {
            console.error("Error loading accounts:", error);
        }
    };

    const handleSave = async (invoiceData) => {
        try {
            const dataWithCompany = { ...invoiceData, project_id: selectedProject.id };
            
            if (!dataWithCompany.warehouse_id) {
                alert("Please select a warehouse");
                return;
            }

            let savedInvoice;
            if (editingInvoice) {
                await PurchaseInvoice.update(editingInvoice.id, dataWithCompany);
                savedInvoice = { id: editingInvoice.id, ...dataWithCompany };
            } else {
                savedInvoice = await PurchaseInvoice.create(dataWithCompany);
            }

            // Update inventory and create accounting transaction when status changes to Received or Paid
            if ((dataWithCompany.status === 'Received' || dataWithCompany.status === 'Paid') && 
                (!editingInvoice || editingInvoice.status === 'Draft')) {
                await updateInventoryStock(savedInvoice);
                await createAccountingTransaction(savedInvoice);
            }

            setShowForm(false);
            setEditingInvoice(null);
            await loadInvoices();
        } catch (error) {
            console.error("Error saving invoice:", error);
            alert("Error saving invoice: " + error.message);
        }
    };

    const updateInventoryStock = async (invoice) => {
        for (const item of invoice.line_items) {
            const product = products.find(p => p.id === item.product_id);
            if (!product || !product.track_inventory) continue;

            if (product.track_batches && item.batch_number) {
                // Check if batch already exists
                const existingBatches = await Batch.filter({ 
                    product_id: item.product_id, 
                    batch_number: item.batch_number 
                });

                let batch;
                if (existingBatches.length > 0) {
                    batch = existingBatches[0];
                } else {
                    batch = await Batch.create({
                        product_id: item.product_id,
                        batch_number: item.batch_number,
                        expiry_date: item.expiry_date || null,
                        purchase_price: item.unit_price
                    });
                }

                const existingBatchStock = await BatchStock.filter({ 
                    batch_id: batch.id, 
                    warehouse_id: invoice.warehouse_id 
                });

                if (existingBatchStock.length > 0) {
                    await BatchStock.update(existingBatchStock[0].id, {
                        quantity: existingBatchStock[0].quantity + item.quantity
                    });
                } else {
                    await BatchStock.create({
                        batch_id: batch.id,
                        warehouse_id: invoice.warehouse_id,
                        quantity: item.quantity
                    });
                }
            }
            
            // Always update regular inventory stock (sum of all batches or direct)
            const existingStock = await InventoryStock.filter({ 
                product_id: item.product_id, 
                warehouse_id: invoice.warehouse_id 
            });

            if (existingStock.length > 0) {
                await InventoryStock.update(existingStock[0].id, {
                    quantity: existingStock[0].quantity + item.quantity
                });
            } else {
                await InventoryStock.create({
                    product_id: item.product_id,
                    warehouse_id: invoice.warehouse_id,
                    quantity: item.quantity
                });
            }
        }
    };

    const createAccountingTransaction = async (invoice) => {
        const inventoryAccount = accounts.find(a => a.name.includes('Inventory') || (a.type === 'Assets' && a.subtype === 'Current Assets'));
        const payableAccount = accounts.find(a => a.name.includes('Payable') || a.name.includes('Creditor'));
        const taxAccount = accounts.find(a => a.name.includes('GST') || a.name.includes('Tax'));

        if (!inventoryAccount || !payableAccount) {
            console.warn('Required accounts not found. Please set up Inventory and Payables accounts.');
            return;
        }

        const entries = [
            {
                account_id: inventoryAccount.id,
                account_name: inventoryAccount.name,
                debit: invoice.subtotal,
                credit: 0,
                description: `Purchase from ${invoice.supplier_name}`
            },
            {
                account_id: payableAccount.id,
                account_name: payableAccount.name,
                debit: 0,
                credit: invoice.total_amount,
                description: `Purchase Invoice - ${invoice.invoice_number}`
            }
        ];

        if (invoice.tax_amount > 0 && taxAccount) {
            entries.push({
                account_id: taxAccount.id,
                account_name: taxAccount.name,
                debit: invoice.tax_amount,
                credit: 0,
                description: 'GST Input Tax Credit'
            });
        }

        const transaction = await Transaction.create({
            project_id: selectedProject.id,
            transaction_number: `PI-${invoice.invoice_number}`,
            type: 'Purchase Bill',
            date: invoice.invoice_date,
            reference: invoice.invoice_number,
            description: `Purchase Invoice - ${invoice.supplier_name}`,
            total_amount: invoice.total_amount,
            status: 'Posted',
            entries
        });

        // Update invoice with transaction reference
        if (invoice.id) {
            await PurchaseInvoice.update(invoice.id, {
                transaction_id: transaction.id
            });
        }

        // Update account balances
        for (const entry of entries) {
            const account = accounts.find(a => a.id === entry.account_id);
            if (account) {
                const newBalance = account.balance + entry.debit - entry.credit;
                await Account.update(account.id, { balance: newBalance });
            }
        }
    };

    const handleEdit = (invoice) => {
        setEditingInvoice(invoice);
        setShowForm(true);
    };

    if (loading) {
        return <div className="p-8">Loading...</div>;
    }

    return (
        <div className="p-4 lg:p-8 space-y-8">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gradient">Purchase Invoices</h1>
                    <p className="text-gray-600 mt-1">{selectedProject?.name} • {invoices.length} invoices</p>
                </div>
                <Button onClick={() => { setEditingInvoice(null); setShowForm(true); }} className="bg-gradient-to-r from-emerald-500 to-emerald-600" disabled={!selectedProject}>
                    <Plus className="w-4 h-4 mr-2" />
                    New Purchase
                </Button>
            </div>

            {!selectedProject ? (
                <div className="text-center py-16">
                    <Building className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">No Company Selected</h2>
                    <p className="text-gray-500">Please select a company to manage purchases.</p>
                </div>
            ) : (
                <>
                    <PurchaseInvoiceStats invoices={invoices} />
                    
                    {showForm && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
                            <div className="bg-white rounded-2xl max-w-4xl w-full my-8">
                                <PurchaseInvoiceForm
                                    invoice={editingInvoice}
                                    products={products}
                                    warehouses={warehouses}
                                    company={selectedProject}
                                    onSave={handleSave}
                                    onCancel={() => { setShowForm(false); setEditingInvoice(null); }}
                                />
                            </div>
                        </div>
                    )}
                    <PurchaseInvoiceList invoices={invoices} onEdit={handleEdit} />
                </>
            )}
        </div>
    );
}