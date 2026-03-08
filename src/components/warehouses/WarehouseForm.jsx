import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { CardHeader, CardContent, CardFooter, CardTitle } from "@/components/ui/card";
import { Save, X } from "lucide-react";

export default function WarehouseForm({ warehouse, onSave, onCancel }) {
    const [formData, setFormData] = useState({
        name: '',
        location: '',
        is_active: true
    });

    useEffect(() => {
        if (warehouse) {
            setFormData(warehouse);
        }
    }, [warehouse]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <form onSubmit={handleSubmit}>
            <CardHeader className="bg-slate-50">
                <CardTitle>{warehouse ? 'Edit Warehouse' : 'Create New Warehouse'}</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
                <div>
                    <Label htmlFor="name">Warehouse Name</Label>
                    <Input id="name" name="name" value={formData.name} onChange={handleInputChange} required />
                </div>
                <div>
                    <Label htmlFor="location">Location</Label>
                    <Input id="location" name="location" value={formData.location} onChange={handleInputChange} />
                </div>
                <div className="flex items-center space-x-2 pt-2">
                    <Switch id="is_active" checked={formData.is_active} onCheckedChange={(checked) => setFormData(prev => ({...prev, is_active: checked}))} />
                    <Label htmlFor="is_active">Active</Label>
                </div>
            </CardContent>
            <CardFooter className="bg-slate-50 flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={onCancel}><X className="w-4 h-4 mr-2" /> Cancel</Button>
                <Button type="submit" className="bg-gradient-to-r from-emerald-500 to-emerald-600"><Save className="w-4 h-4 mr-2" /> Save</Button>
            </CardFooter>
        </form>
    );
}