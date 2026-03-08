import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CardHeader, CardContent, CardFooter, CardTitle } from "@/components/ui/card";
import { Save, X } from "lucide-react";

const ACCOUNT_TYPES = {
    "Assets": ["Current Assets", "Fixed Assets", "Other Assets"],
    "Liabilities": ["Current Liabilities", "Long-term Liabilities", "Other Liabilities"],
    "Equity": ["Owner's Equity", "Retained Earnings"],
    "Revenue": ["Operating Revenue", "Other Revenue"],
    "Expenses": ["Cost of Goods Sold", "Operating Expenses", "Other Expenses"]
};

export default function AccountForm({ account, onSave, onCancel }) {
    const [formData, setFormData] = useState({
        account_code: '',
        name: '',
        type: 'Assets',
        subtype: '',
        description: ''
    });

    useEffect(() => {
        if (account) {
            setFormData(account);
        }
    }, [account]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (name, value) => {
        const newFormData = { ...formData, [name]: value };
        if (name === 'type') {
            newFormData.subtype = ACCOUNT_TYPES[value][0];
        }
        setFormData(newFormData);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <form onSubmit={handleSubmit}>
            <CardHeader className="bg-slate-50">
                <CardTitle>{account ? 'Edit Account' : 'Create New Account'}</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
                <div>
                    <Label htmlFor="account_code">Account Code</Label>
                    <Input id="account_code" name="account_code" value={formData.account_code} onChange={handleInputChange} required />
                </div>
                <div>
                    <Label htmlFor="name">Account Name</Label>
                    <Input id="name" name="name" value={formData.name} onChange={handleInputChange} required />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label>Type</Label>
                        <Select value={formData.type} onValueChange={(value) => handleSelectChange('type', value)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {Object.keys(ACCOUNT_TYPES).map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label>Subtype</Label>
                        <Select value={formData.subtype} onValueChange={(value) => handleSelectChange('subtype', value)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {(ACCOUNT_TYPES[formData.type] || []).map(subtype => <SelectItem key={subtype} value={subtype}>{subtype}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" name="description" value={formData.description} onChange={handleInputChange} />
                </div>
            </CardContent>
            <CardFooter className="bg-slate-50 flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={onCancel}><X className="w-4 h-4 mr-2" /> Cancel</Button>
                <Button type="submit" className="bg-gradient-to-r from-emerald-500 to-emerald-600"><Save className="w-4 h-4 mr-2" /> Save Account</Button>
            </CardFooter>
        </form>
    );
}