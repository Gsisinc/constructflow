import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, X } from "lucide-react";

const CURRENCIES = ["USD", "EUR", "GBP", "JPY", "AUD", "CAD", "CHF", "CNY"];

export default function CompanyForm({ company, onSave, onCancel }) {
    const [formData, setFormData] = useState({
        name: '',
        legal_name: '',
        tax_id: '',
        currency: 'USD',
        fiscal_year_end: '',
        address: { street: '', city: '', state: '', postal_code: '', country: '' },
        contact: { phone: '', email: '', website: '' },
        settings: { tax_rate: 0, decimal_places: 2 }
    });

    useEffect(() => {
        if (company) {
            setFormData({
                ...company,
                address: company.address || {},
                contact: company.contact || {},
                settings: company.settings || { tax_rate: 0, decimal_places: 2 }
            });
        }
    }, [company]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleNestedChange = (group, name, value) => {
        setFormData(prev => ({
            ...prev,
            [group]: {
                ...prev[group],
                [name]: value
            }
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <form onSubmit={handleSubmit}>
            <CardHeader className="bg-slate-50 rounded-t-2xl">
                <CardTitle>{company ? 'Edit Company' : 'Create New Company'}</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
                {/* General Info */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-slate-800">General Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="name">Company Name</Label>
                            <Input id="name" name="name" value={formData.name} onChange={handleInputChange} required />
                        </div>
                        <div>
                            <Label htmlFor="legal_name">Legal Name</Label>
                            <Input id="legal_name" name="legal_name" value={formData.legal_name} onChange={handleInputChange} />
                        </div>
                        <div>
                            <Label htmlFor="tax_id">Tax ID</Label>
                            <Input id="tax_id" name="tax_id" value={formData.tax_id} onChange={handleInputChange} />
                        </div>
                        <div>
                            <Label htmlFor="currency">Base Currency</Label>
                            <Select name="currency" value={formData.currency} onValueChange={(value) => setFormData(prev => ({...prev, currency: value}))}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                {/* Address */}
                <div className="space-y-4">
                     <h3 className="text-lg font-semibold text-slate-800">Address</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label>Street</Label>
                            <Input value={formData.address.street} onChange={(e) => handleNestedChange('address', 'street', e.target.value)} />
                        </div>
                        <div>
                            <Label>City</Label>
                            <Input value={formData.address.city} onChange={(e) => handleNestedChange('address', 'city', e.target.value)} />
                        </div>
                        <div>
                            <Label>State / Province</Label>
                            <Input value={formData.address.state} onChange={(e) => handleNestedChange('address', 'state', e.target.value)} />
                        </div>
                        <div>
                            <Label>Postal Code</Label>
                            <Input value={formData.address.postal_code} onChange={(e) => handleNestedChange('address', 'postal_code', e.target.value)} />
                        </div>
                         <div>
                            <Label>Country</Label>
                            <Input value={formData.address.country} onChange={(e) => handleNestedChange('address', 'country', e.target.value)} />
                        </div>
                     </div>
                </div>
            </CardContent>
            <CardFooter className="bg-slate-50 flex justify-end gap-3 rounded-b-2xl">
                <Button type="button" variant="outline" onClick={onCancel}>
                    <X className="w-4 h-4 mr-2" /> Cancel
                </Button>
                <Button type="submit" className="bg-gradient-to-r from-emerald-500 to-emerald-600">
                    <Save className="w-4 h-4 mr-2" /> Save Company
                </Button>
            </CardFooter>
        </form>
    );
}