import React, { useState, useEffect } from "react";
import { Warehouse } from "@/entities/Warehouse";
import { Company } from "@/entities/Company";
import { User } from "@/entities/User";
import { Button } from "@/components/ui/button";
import { Plus, Building } from "lucide-react";

import WarehouseForm from "../components/warehouses/WarehouseForm";
import WarehouseList from "../components/warehouses/WarehouseList";

export default function Warehouses() {
    const [warehouses, setWarehouses] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [selectedCompany, setSelectedCompany] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [editingWarehouse, setEditingWarehouse] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (selectedCompany) {
            loadWarehouses();
        }
    }, [selectedCompany]);

    const loadData = async () => {
        setLoading(true);
        try {
            const user = await User.me();
            const companiesData = await Company.filter({ created_by: user.email });
            setCompanies(companiesData);
            if (companiesData.length > 0) {
                const companyId = localStorage.getItem('selectedCompanyId') || companiesData[0].id;
                setSelectedCompany(companiesData.find(c => c.id === companyId) || companiesData[0]);
            }
        } catch (error) {
            console.error("Error loading data:", error);
        }
        setLoading(false);
    };

    const loadWarehouses = async () => {
        if (!selectedCompany) return;
        try {
            const data = await Warehouse.filter({ company_id: selectedCompany.id });
            setWarehouses(data);
        } catch (error) {
            console.error("Error loading warehouses:", error);
        }
    };

    const handleSave = async (warehouseData) => {
        try {
            const dataWithCompany = { ...warehouseData, company_id: selectedCompany.id };
            if (editingWarehouse) {
                await Warehouse.update(editingWarehouse.id, dataWithCompany);
            } else {
                await Warehouse.create(dataWithCompany);
            }
            setShowForm(false);
            setEditingWarehouse(null);
            loadWarehouses();
        } catch (error) {
            console.error("Error saving warehouse:", error);
        }
    };

    const handleEdit = (warehouse) => {
        setEditingWarehouse(warehouse);
        setShowForm(true);
    };

    if (loading) {
        return <div className="p-8">Loading...</div>;
    }

    return (
        <div className="p-4 lg:p-8 space-y-8">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gradient">Warehouses</h1>
                    <p className="text-gray-600 mt-1">{selectedCompany?.name} • {warehouses.length} warehouses</p>
                </div>
                <Button onClick={() => { setEditingWarehouse(null); setShowForm(true); }} className="bg-gradient-to-r from-emerald-500 to-emerald-600" disabled={!selectedCompany}>
                    <Plus className="w-4 h-4 mr-2" />
                    New Warehouse
                </Button>
            </div>
            
            {showForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl max-w-lg w-full">
                        <WarehouseForm
                            warehouse={editingWarehouse}
                            onSave={handleSave}
                            onCancel={() => { setShowForm(false); setEditingWarehouse(null); }}
                        />
                    </div>
                </div>
            )}

            {!selectedCompany ? (
                <div className="text-center py-16">
                    <Building className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">No Company Selected</h2>
                    <p className="text-gray-500">Please select a company to manage warehouses.</p>
                </div>
            ) : (
                <WarehouseList warehouses={warehouses} onEdit={handleEdit} />
            )}
        </div>
    );
}