import React from 'react';
import { CardHeader, CardContent, CardFooter, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck } from "lucide-react";

export default function SecuritySettings() {
    return (
        <div>
            <CardHeader><CardTitle>Security</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-start p-4 border rounded-lg">
                    <ShieldCheck className="w-8 h-8 mr-4 text-emerald-500" />
                    <div>
                        <h4 className="font-semibold">Authentication</h4>
                        <p className="text-sm text-gray-500">
                            Your account is securely managed via Google Single Sign-On. There are no passwords to manage.
                        </p>
                    </div>
                </div>
            </CardContent>
            <CardFooter className="bg-slate-50 flex justify-end">
                <Button variant="outline" disabled>More Options Coming Soon</Button>
            </CardFooter>
        </div>
    );
}