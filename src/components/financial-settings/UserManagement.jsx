import React, { useState, useEffect } from 'react';
import { CompanyUser } from '@/entities/CompanyUser';
import { User } from '@/entities/User';
import { Button } from "@/components/ui/button";
import { CardHeader, CardContent, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, UserPlus } from "lucide-react";
import InviteUserForm from './InviteUserForm';

const ROLES = ["Admin", "Accountant", "Auditor", "Viewer"];

export default function UserManagement({ companyId }) {
    const [companyUsers, setCompanyUsers] = useState([]);
    const [allUsers, setAllUsers] = useState(new Map());
    const [loading, setLoading] = useState(true);
    const [showInviteForm, setShowInviteForm] = useState(false);

    useEffect(() => {
        loadData();
    }, [companyId]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [cUsers, aUsers] = await Promise.all([
                CompanyUser.filter({ company_id: companyId }),
                User.list()
            ]);
            
            const userMap = new Map(aUsers.map(u => [u.email, u]));
            setAllUsers(userMap);
            
            const enrichedUsers = cUsers.map(cu => ({
                ...cu,
                full_name: userMap.get(cu.user_email)?.full_name || 'N/A',
            }));
            setCompanyUsers(enrichedUsers);
        } catch (error) {
            console.error("Error loading user management data:", error);
        }
        setLoading(false);
    };

    const handleRoleChange = async (companyUserId, newRole) => {
        try {
            await CompanyUser.update(companyUserId, { role: newRole });
            loadData(); // Refresh list
        } catch (error) {
            console.error("Error updating role:", error);
        }
    };
    
    const handleInviteSuccess = () => {
        setShowInviteForm(false);
        loadData();
    };

    if (loading) {
        return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin" /></div>;
    }

    return (
        <div>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>User Management</CardTitle>
                <Button onClick={() => setShowInviteForm(true)}><UserPlus className="w-4 h-4 mr-2" /> Invite User</Button>
            </CardHeader>
            <CardContent>
                {showInviteForm && (
                    <InviteUserForm 
                        companyId={companyId}
                        onInviteSuccess={handleInviteSuccess}
                        onCancel={() => setShowInviteForm(false)}
                    />
                )}
                <div className="mt-4">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {companyUsers.map(user => (
                                <TableRow key={user.id}>
                                    <TableCell className="flex items-center gap-3">
                                        <Avatar className="w-8 h-8">
                                            <AvatarFallback>{user.full_name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-medium">{user.full_name}</p>
                                            <p className="text-sm text-gray-500">{user.user_email}</p>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Select value={user.role} onValueChange={(newRole) => handleRoleChange(user.id, newRole)}>
                                            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {ROLES.map(role => <SelectItem key={role} value={role}>{role}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={user.is_active ? "default" : "destructive"}>
                                            {user.is_active ? "Active" : "Inactive"}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
            <CardFooter className="bg-slate-50">
                <p className="text-sm text-gray-500">Manage user access and permissions for {companyId}.</p>
            </CardFooter>
        </div>
    );
}