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
import { Plus, Building, Receipt, Loader2 } from "lucide-react";
import { toast } from "sonner";

import PurchaseInvoiceForm from "../components/invoices/PurchaseInvoiceForm";
import PurchaseInvoiceList from "../components/invoices/PurchaseInvoiceList";
import PurchaseInvoiceStats from "../components/invoices/PurchaseInvoiceStats";

// Default chart of accounts seeded for a company that has none.
const DEFAULT_ACCOUNTS = [
  { account_code: "1000", name: "Cash", type: "Assets", subtype: "Current Assets" },
  { account_code: "1100", name: "Accounts Receivable", type: "Assets", subtype: "Current Assets" },
  { account_code: "1200", name: "Inventory", type: "Assets", subtype: "Current Assets" },
  { account_code: "1500", name: "Equipment", type: "Assets", subtype: "Fixed Assets" },
  { account_code: "2000", name: "Accounts Payable", type: "Liabilities", subtype: "Current Liabilities" },
  { account_code: "2100", name: "Accrued Expenses", type: "Liabilities", subtype: "Current Liabilities" },
  { account_code: "3000", name: "Owner's Equity", type: "Equity", subtype: "Equity" },
  { account_code: "4000", name: "Sales Revenue", type: "Revenue", subtype: "Operating Revenue" },
  { account_code: "4100", name: "Service Revenue", type: "Revenue", subtype: "Operating Revenue" },
  { account_code: "5000", name: "Cost of Goods Sold", type: "Expenses", subtype: "Direct Costs" },
  { account_code: "5100", name: "Labor Expense", type: "Expenses", subtype: "Operating Expenses" },
  { account_code: "5200", name: "Materials Expense", type: "Expenses", subtype: "Operating Expenses" },
  { account_code: "5300", name: "Overhead", type: "Expenses", subtype: "Operating Expenses" },
];

export default function PurchaseInvoices() {
    const [invoices, setInvoices] = useState([]);
    const [products, setProducts] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [projects, setProjects] = useState([]); // companies (Project records) owned by the user
    const [selectedProject, setSelectedProject] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [editingInvoice, setEditingInvoice] = useState(null);
    const [loading, setLoading] = useState(true);
    const [creatingAccounts, setCreatingAccounts] = useState(false);

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
            // Same company selector as Transactions: companies are the user's own Project records.
            const projectsData = await Project.filter({ created_by_id: user.id });
            setProjects(projectsData);
            if (projectsData.length > 0) {
                setSelectedProject(projectsData[0]);
            } else {
                setSelectedProject(null);
            }
        } catch (error) {
            console.error("Error loading data:", error);
            toast.error("Failed to load companies");
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
            const data = await Account.filter({ project_id: selectedProject.id, is_active: true });
            setAccounts(data);
        } catch (error) {
            console.error("Error loading accounts:", error);
        }
    };

    const createDefaultAccounts = async () => {
        if (!selectedProject) return;
        setCreatingAccounts(true);
        try {
            await Account.bulkCreate(
                DEFAULT_ACCOUNTS.map((a) => ({
                    project_id: selectedProject.id,
                    account_code: a.account_code,
                    name: a.name,
                    type: a.type,
                    subtype: a.subtype,
                    balance: 0,
                    is_active: true,
                }))
            );
            toast.success("Default chart of accounts created");
            await loadAccounts();
        } catch (error) {
            console.error("Error creating accounts:", error);
            toast.error("Failed to create accounts: " + (error.message || ""));
        } finally {
            setCreatingAccounts(false);
        }
    };

    const handleSave = async (invoiceData) => {
        try {
            const dataWithCompany = { ...invoiceData, project_id: selectedProject.id };

            if (!dataWithCompany.warehouse_id) {
                toast.error("Please select a warehouse");
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
            toast.success("Purchase invoice saved");
        } catch (error) {
            console.error("Error saving invoice:", error);
            toast.error("Error saving invoice: " + error.message);
        }
    };

    const updateInventoryStock = async (invoice) => {
        for (const item of (invoice.line_items || [])) {
            const product = products.find(p => p.id === item.product_id);
            if (!product || !product.track_inventory) continue;

            if (product.track_batches && item.batch_number) {
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

        if (invoice.id) {
            await PurchaseInvoice.update(invoice.id, {
                transaction_id: transaction.id
            });
        }

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
        return <div className="p-8 text-slate-500">Loading…</div>;
    }

    return (
        <div className="p-4 lg:p-8 space-y-8">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Purchase Invoices</h1>
                    <p className="text-slate-500 mt-1">
                        {selectedProject ? `${selectedProject.name} • ${invoices.length} invoices` : 'Select a company to manage purchases'}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <select
                        value={selectedProject?.id || ''}
                        onChange={(e) => {
                            const p = projects.find((x) => x.id === e.target.value);
                            setSelectedProject(p || null);
                            setInvoices([]);
                            setAccounts([]);
                        }}
                        className="border border-slate-200 rounded-md px-3 py-2.5 text-sm bg-white h-10"
                        disabled={projects.length === 0}
                    >
                        {projects.length === 0 && <option value="">No companies yet</option>}
                        {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <Button onClick={() => { setEditingInvoice(null); setShowForm(true); }} disabled={!selectedProject || accounts.length === 0}>
                        <Plus className="w-4 h-4 mr-2" />
                        New Purchase
                    </Button>
                </div>
            </div>

            {projects.length === 0 ? (
                <div className="text-center py-16">
                    <Building className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-slate-900 mb-2">No Company Yet</h2>
                    <p className="text-slate-500">Create a company first (Companies page), then set up its chart of accounts to record purchases.</p>
                </div>
            ) : !selectedProject ? (
                <div className="text-center py-16">
                    <Building className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-slate-900 mb-2">Select a Company</h2>
                    <p className="text-slate-500">Choose a company above to manage its purchase invoices</p>
                </div>
            ) : accounts.length === 0 ? (
                <div className="text-center py-16">
                    <Receipt className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-slate-900 mb-2">Set up Chart of Accounts First</h2>
                    <p className="text-slate-500 mb-4">You need accounts before recording purchase invoices. Create a default chart to enable New Purchase.</p>
                    <Button onClick={createDefaultAccounts} disabled={creatingAccounts}>
                        {creatingAccounts && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Create default accounts
                    </Button>
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