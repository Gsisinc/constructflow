import React, { useState, useEffect } from "react";
import { Company } from "@/entities/Company";
import { User } from "@/entities/User";
import { Button } from "@/components/ui/button";
import { 
    Building2, 
    Plus
} from "lucide-react";

import CompanyForm from "../components/companies/CompanyForm";
import CompanyCard from "../components/companies/CompanyCard";

export default function Companies() {
    const [companies, setCompanies] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editingCompany, setEditingCompany] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadCompanies();
    }, []);

    const loadCompanies = async () => {
        setLoading(true);
        try {
            const user = await User.me();
            const data = await Company.filter({ created_by: user.email });
            setCompanies(data);
        } catch (error) {
            console.error("Error loading companies:", error);
        }
        setLoading(false);
    };

    const handleSave = async (companyData) => {
        try {
            if (editingCompany) {
                await Company.update(editingCompany.id, companyData);
            } else {
                await Company.create(companyData);
            }
            setShowForm(false);
            setEditingCompany(null);
            loadCompanies();
        } catch (error) {
            console.error("Error saving company:", error);
        }
    };

    const handleEdit = (company) => {
        setEditingCompany(company);
        setShowForm(true);
    };

    const handleCancel = () => {
        setShowForm(false);
        setEditingCompany(null);
    };

    if (loading) {
        return (
            <div className="p-8">
                <div className="animate-pulse space-y-6">
                    <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="h-64 bg-gray-200 rounded-xl"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 lg:p-8 space-y-8">
            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gradient">Company Management</h1>
                    <p className="text-gray-600 mt-1">Manage your business entities and accounting books</p>
                </div>
                <Button
                    onClick={() => setShowForm(true)}
                    className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    New Company
                </Button>
            </div>

            {/* Company Form */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <CompanyForm
                            company={editingCompany}
                            onSave={handleSave}
                            onCancel={handleCancel}
                        />
                    </div>
                </div>
            )}

            {/* Companies Grid */}
            {companies.length === 0 && !loading ? (
                <div className="text-center py-16">
                    <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">No Companies Yet</h2>
                    <p className="text-gray-500 mb-6">Create your first company to start managing your books</p>
                    <Button
                        onClick={() => setShowForm(true)}
                        className="bg-gradient-to-r from-emerald-500 to-emerald-600"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Create Company
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {companies.map((company) => (
                        <CompanyCard
                            key={company.id}
                            company={company}
                            onEdit={handleEdit}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}