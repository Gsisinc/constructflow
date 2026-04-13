import React, { useState, useEffect } from "react";
import { Product } from "@/entities/Product";
import { Project } from "@/entities/Project";
import { User } from "@/entities/User";
import { InventoryStock } from "@/entities/InventoryStock";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Package, Building, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

import ProductsTable from "../components/inventory/ProductsTable";
import ProductForm from "../components/inventory/ProductForm";
import InventoryStats from "../components/inventory/InventoryStats";


export default function Inventory() {
    const [products, setProducts] = useState([]);
    const [inventoryStocks, setInventoryStocks] = useState([]);
    const [projects, setProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (selectedProject) {
            loadProducts();
        }
    }, [selectedProject]);

    useEffect(() => {
        // Refresh products when page becomes visible
        const handleVisibilityChange = () => {
            if (!document.hidden && selectedProject) {
                loadProducts();
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
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

    const loadProducts = async () => {
        if (!selectedProject) return;
        try {
            const [productData, stockData] = await Promise.all([
                Product.filter({ project_id: selectedProject.id }),
                InventoryStock.list() // Note: This fetches all stock. Needs filtering if secured by company
            ]);
            
            const productsWithStock = productData.map(p => {
                const relatedStocks = stockData.filter(s => s.product_id === p.id);
                const quantity_on_hand = relatedStocks.reduce((sum, s) => sum + s.quantity, 0);
                return { ...p, quantity_on_hand };
            });

            setProducts(productsWithStock);
            setInventoryStocks(stockData);
        } catch (error) {
            console.error("Error loading products:", error);
        }
    };

    const handleSave = async (productData) => {
        try {
            const dataWithCompany = { ...productData, project_id: selectedProject.id };
            if (editingProduct) {
                await Product.update(editingProduct.id, dataWithCompany);
            } else {
                await Product.create(dataWithCompany);
            }
            setShowForm(false);
            setEditingProduct(null);
            loadProducts();
        } catch (error) {
            console.error("Error saving product:", error);
        }
    };

    const handleEdit = (product) => {
        setEditingProduct(product);
        setShowForm(true);
    };

    const filteredProducts = products.filter(p => 
        (p.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (p.sku?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return <div className="p-8">Loading...</div>;
    }

    return (
        <div className="p-4 lg:p-8 space-y-8">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gradient">Inventory Management</h1>
                    <p className="text-gray-600 mt-1">{selectedProject?.name} • {products.length} products</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={loadProducts} variant="outline" disabled={!selectedProject}>
                        Refresh
                    </Button>
                    <Button onClick={() => { setEditingProduct(null); setShowForm(true); }} className="bg-gradient-to-r from-emerald-500 to-emerald-600" disabled={!selectedProject}>
                        <Plus className="w-4 h-4 mr-2" />
                        New Product
                    </Button>
                </div>
            </div>

            {!selectedProject ? (
                <div className="text-center py-16">
                    <Building className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">No Company Selected</h2>
                    <p className="text-gray-500">Please select a company to manage inventory.</p>
                </div>
            ) : (
                <>
                    <InventoryStats products={products} />
                
                    <Card className="glass-card border-white/20">
                        <CardContent className="p-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <Input 
                                    placeholder="Search by product name or SKU..."
                                    className="pl-10"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </CardContent>
                    </Card>
                    
                    {showForm && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                            <div className="bg-white rounded-2xl max-w-2xl w-full">
                                <ProductForm
                                    product={editingProduct}
                                    onSave={handleSave}
                                    onCancel={() => { setShowForm(false); setEditingProduct(null); }}
                                />
                            </div>
                        </div>
                    )}
                    <ProductsTable products={filteredProducts} onEdit={handleEdit} />
                </>
            )}
        </div>
    );
}