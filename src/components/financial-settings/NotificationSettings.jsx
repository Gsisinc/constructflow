import React, { useState } from 'react';
import { CardHeader, CardContent, CardFooter, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function NotificationSettings() {
    const [settings, setSettings] = useState({
        monthlyReports: true,
        transactionAlerts: false,
        securityAlerts: true,
    });
    
    const handleToggle = (key) => {
        setSettings(prev => ({...prev, [key]: !prev[key]}));
    };
    
    return (
        <div>
            <CardHeader><CardTitle>Notifications</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                    <Label htmlFor="monthlyReports">Monthly Summary Reports</Label>
                    <Switch id="monthlyReports" checked={settings.monthlyReports} onCheckedChange={() => handleToggle('monthlyReports')} />
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                    <Label htmlFor="transactionAlerts">Large Transaction Alerts</Label>
                    <Switch id="transactionAlerts" checked={settings.transactionAlerts} onCheckedChange={() => handleToggle('transactionAlerts')} />
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                    <Label htmlFor="securityAlerts">Security Alerts</Label>
                    <Switch id="securityAlerts" checked={settings.securityAlerts} onCheckedChange={() => handleToggle('securityAlerts')} />
                </div>
            </CardContent>
            <CardFooter className="bg-slate-50 flex justify-end">
                <Button>Save Preferences</Button>
            </CardFooter>
        </div>
    );
}