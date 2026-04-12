import React, { useState, useEffect } from "react";
import { SalesInvoice } from "@/entities/SalesInvoice";
import { Product } from "@/entities/Product";
import { Account } from "@/entities/Account";
import { Transaction } from "@/entities/Transaction";
import { InventoryStock } from "@/entities/InventoryStock";
import { BatchStock } from "@/entities/BatchStock";
import { Batch } from "@/entities/Batch";
import { Project } from "@/entities/Project";
import { User } from "@/entities/User";
import { Button } from "@/components/ui/button";
import { Plus, FileText, Building } from "lucide-react";

import InvoiceForm from "../components/invoices/InvoiceForm";
import InvoiceList from "../components/invoices/InvoiceList";
import InvoiceStats from "../components/invoices/InvoiceStats";

export default function SalesInvoices() {
    const [invoices, setInvoices] = useState([]);
    const [products, setProducts] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [projects, setProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState(null);
    const [selectedPhase, setSelectedPhase] = useState(null);
    const [phases, setPhases] = useState([]);
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
            loadAccounts();
            // Load phases if available
            if (selectedProject.phases && Array.isArray(selectedProject.phases)) {
                setPhases(selectedProject.phases);
            }
        }
    }, [selectedProject, selectedPhase]);

    const loadData = async () => {
        setLoading(true);
        try {
            const user = await User.me();
            const projectsData = await Project.filter({ created_by: user.email });
            setProjects(projectsData);
            if (projectsData.length > 0) {
                const projectId = localStorage.getItem('selectedProjectId') || projectsData[0].id;
                setSelectedProject(projectsData.find(p => p.id === projectId) || projectsData[0]);
            }
        } catch (error) {
            console.error("Error loading data:", error);
        }
        setLoading(false);
    };

    const loadInvoices = async () => {
        if (!selectedProject) return;
        try {
            const filters = { project_id: selectedProject.id };
            if (selectedPhase) {
                filters.phase_id = selectedPhase;
            }
            const data = await SalesInvoice.filter(filters, "-invoice_date");
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
            const dataWithProject = { ...invoiceData, project_id: selectedProject.id, phase_id: selectedPhase || null };
            
            let savedInvoice;
            if (editingInvoice) {
                await SalesInvoice.update(editingInvoice.id, dataWithProject);
                savedInvoice = { id: editingInvoice.id, ...dataWithProject };
            } else {
                savedInvoice = await SalesInvoice.create(dataWithProject);
            }

            // Update inventory and create accounting transaction when status changes to Sent or Paid
            if ((dataWithProject.status === 'Paid' || dataWithProject.status === 'Sent') && 
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

            // Get all warehouses' stock for this product
            const allStocks = await InventoryStock.filter({ product_id: item.product_id });
            
            let remainingQty = item.quantity;

            // Deduct from available stock across warehouses
            for (const stock of allStocks) {
                if (remainingQty <= 0) break;
                
                if (stock.quantity > 0) {
                    const deductQty = Math.min(stock.quantity, remainingQty);
                    await InventoryStock.update(stock.id, {
                        quantity: stock.quantity - deductQty
                    });
                    remainingQty -= deductQty;
                }
            }

            if (remainingQty > 0) {
                console.warn(`Insufficient stock for product ${product.name}. Short by ${remainingQty} units.`);
            }
        }
    };

    const createAccountingTransaction = async (invoice) => {
        const revenueAccount = accounts.find(a => a.type === 'Revenue');
        const receivablesAccount = accounts.find(a => a.name.includes('Receivable') || a.name.includes('Debtor'));
        const taxAccount = accounts.find(a => a.name.includes('GST') || a.name.includes('Tax'));

        if (!revenueAccount || !receivablesAccount) {
            console.warn('Required accounts not found. Please set up Revenue and Receivables accounts.');
            return;
        }

        const entries = [
            {
                account_id: receivablesAccount.id,
                account_name: receivablesAccount.name,
                debit: invoice.total_amount,
                credit: 0,
                description: `Sales to ${invoice.customer_name}`
            },
            {
                account_id: revenueAccount.id,
                account_name: revenueAccount.name,
                debit: 0,
                credit: invoice.subtotal,
                description: `Sales Revenue - ${invoice.invoice_number}`
            }
        ];

        if (invoice.tax_amount > 0 && taxAccount) {
            entries.push({
                account_id: taxAccount.id,
                account_name: taxAccount.name,
                debit: 0,
                credit: invoice.tax_amount,
                description: 'GST Output Tax'
            });
        }

        const transaction = await Transaction.create({
            project_id: selectedProject.id,
            transaction_number: `SI-${invoice.invoice_number}`,
            type: 'Sales Invoice',
            date: invoice.invoice_date,
            reference: invoice.invoice_number,
            description: `Sales Invoice - ${invoice.customer_name}`,
            total_amount: invoice.total_amount,
            status: 'Posted',
            entries
        });

        // Update invoice with transaction reference
        if (invoice.id) {
            await SalesInvoice.update(invoice.id, {
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
                    <h1 className="text-3xl font-bold text-gradient">Sales Invoices</h1>
                    <p className="text-gray-600 mt-1">{selectedProject?.name} • {invoices.length} invoices</p>
                </div>
                <Button onClick={() => { setEditingInvoice(null); setShowForm(true); }} className="bg-gradient-to-r from-emerald-500 to-emerald-600" disabled={!selectedProject}>
                    <Plus className="w-4 h-4 mr-2" />
                    New Invoice
                </Button>
            </div>

            !selectedProject ? (
                <div className="text-center py-16">
                    <Building className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">No Project Selected</h2>
                    <p className="text-gray-500">Please select a project to manage invoices.</p>
                </div>
            ) : (
                <>
                    {/* Phase Filter */}
                    {phases.length > 0 && (
                        <div className="bg-slate-50 p-4 rounded-lg">
                            <label className="text-sm font-medium">Filter by Phase (Optional)</label>
                            <select 
                                value={selectedPhase || ""} 
                                onChange={(e) => setSelectedPhase(e.target.value || null)}
                                className="mt-2 w-full p-2 border rounded"
                            >
                                <option value="">All Phases</option>
                                {phases.map(phase => (
                                    <option key={phase.id} value={phase.id}>{phase.name}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    <InvoiceStats invoices={invoices} />
                    
                    {showForm && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
                            <div className="bg-white rounded-2xl max-w-4xl w-full my-8">
                                <InvoiceForm
                                    invoice={editingInvoice}
                                    products={products}
                                    company={selectedProject}
                                    onSave={handleSave}
                                    onCancel={() => { setShowForm(false); setEditingInvoice(null); }}
                                />
                            </div>
                        </div>
                    )}
                    <InvoiceList invoices={invoices} onEdit={handleEdit} />
                </>>
            )}
        </div>
    );
}