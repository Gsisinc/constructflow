import React, { useState } from 'react';
import { CompanyUser } from '@/entities/CompanyUser';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from 'lucide-react';

const ROLES = ["Admin", "Accountant", "Auditor", "Viewer"];

export default function InviteUserForm({ companyId, onInviteSuccess, onCancel }) {
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('Viewer');
    const [isInviting, setIsInviting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsInviting(true);
        setError('');
        try {
            await CompanyUser.create({
                company_id: companyId,
                user_email: email,
                role: role,
            });
            onInviteSuccess();
        } catch(err) {
            setError("Failed to invite user. They may already be part of this company.");
            console.error(err);
        }
        setIsInviting(false);
    };
    
    return (
        <form onSubmit={handleSubmit} className="p-4 border rounded-lg bg-slate-50 space-y-4 mb-6">
            <h3 className="font-semibold">Invite New User</h3>
            <div className="grid md:grid-cols-2 gap-4">
                 <div>
                    <Label htmlFor="email">User Email</Label>
                    <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div>
                    <Label htmlFor="role">Role</Label>
                     <Select value={role} onValueChange={setRole}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex justify-end gap-3">
                <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
                <Button type="submit" disabled={isInviting}>
                    {isInviting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Send Invite
                </Button>
            </div>
        </form>
    );
}