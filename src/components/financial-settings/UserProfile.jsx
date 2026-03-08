import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CardHeader, CardContent, CardFooter, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User } from "@/entities/User";

export default function UserProfile({ user, onUpdate }) {
    const [formData, setFormData] = useState({ full_name: '' });

    useEffect(() => {
        if (user) {
            setFormData({ full_name: user.full_name });
        }
    }, [user]);

    const handleSave = async () => {
        try {
            const updatedUser = await User.updateMyUserData(formData);
            onUpdate(updatedUser);
            // Add a success toast/message here in a real app
        } catch (error) {
            console.error("Failed to update user profile", error);
        }
    };
    
    return (
        <div>
            <CardHeader><CardTitle>User Profile</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                    <Avatar className="w-16 h-16">
                        <AvatarFallback className="text-2xl">{user?.full_name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="font-semibold">{user?.full_name}</p>
                        <p className="text-sm text-gray-500">{user?.email}</p>
                        <p className="text-xs text-gray-400 capitalize">{user?.role} Role</p>
                    </div>
                </div>
                <div>
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input id="full_name" value={formData.full_name} onChange={(e) => setFormData({full_name: e.target.value})} />
                </div>
            </CardContent>
            <CardFooter className="bg-slate-50 flex justify-end">
                <Button onClick={handleSave}>Save Changes</Button>
            </CardFooter>
        </div>
    );
}