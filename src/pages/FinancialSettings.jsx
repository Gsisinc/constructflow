
import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { CompanyUser } from "@/entities/CompanyUser";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
    User as UserIcon, 
    Shield,
    Bell,
    Users as UsersIcon
} from "lucide-react";

import UserProfile from "../components/financial-settings/UserProfile";
import SecuritySettings from "../components/financial-settings/SecuritySettings";
import NotificationSettings from "../components/financial-settings/NotificationSettings";
import UserManagement from "../components/financial-settings/UserManagement";

export default function Settings() {
    const [user, setUser] = useState(null);
    const [userRole, setUserRole] = useState('Viewer'); // Default role
    const [selectedCompanyId, setSelectedCompanyId] = useState(null);
    const [activeTab, setActiveTab] = useState("profile");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const userData = await User.me();
            setUser(userData);
            
            const companyId = localStorage.getItem('selectedCompanyId');
            if (companyId) {
                setSelectedCompanyId(companyId);
                const companyUsers = await CompanyUser.filter({ company_id: companyId, user_email: userData.email });
                if (companyUsers.length > 0) {
                    setUserRole(companyUsers[0].role); // Assuming role is directly on the CompanyUser object
                }
            }
        } catch (error) {
            console.error("Error loading user settings:", error);
        }
        setLoading(false);
    };

    const settingsTabs = [
        { id: "profile", title: "Profile", description: "Manage your account information", icon: UserIcon, color: "emerald" },
        { id: "security", title: "Security", description: "Password and authentication", icon: Shield, color: "blue" },
        { id: "notifications", title: "Notifications", description: "Email and app notifications", icon: Bell, color: "purple" },
    ];
    
    if (userRole === 'Admin') {
        settingsTabs.push({
            id: 'user-management',
            title: 'User Management',
            description: 'Invite and manage team members',
            icon: UsersIcon,
            color: 'orange'
        });
    }

    const renderTabContent = () => {
        switch (activeTab) {
            case "profile":
                return <UserProfile user={user} onUpdate={setUser} />;
            case "security":
                return <SecuritySettings />;
            case "notifications":
                return <NotificationSettings />;
            case "user-management":
                return userRole === 'Admin' ? <UserManagement companyId={selectedCompanyId} /> : null;
            default:
                return <UserProfile user={user} onUpdate={setUser} />;
        }
    };

    if (loading) {
        return (
            <div className="p-8">
                <div className="animate-pulse space-y-6">
                    <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 lg:p-8 space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gradient">Settings</h1>
                <p className="text-gray-600 mt-1">Manage your account and application preferences</p>
            </div>

            {/* Settings Navigation */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {settingsTabs.map((tab) => {
                    const IconComponent = tab.icon;
                    return (
                        <Card
                            key={tab.id}
                            className={`cursor-pointer transition-all duration-200 ${
                                activeTab === tab.id
                                    ? `ring-2 ring-${tab.color}-500 bg-${tab.color}-50`
                                    : 'glass-card border-white/20 hover:bg-white/40'
                            }`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <IconComponent 
                                        className={`w-6 h-6 ${
                                            activeTab === tab.id 
                                                ? `text-${tab.color}-600` 
                                                : 'text-gray-400'
                                        }`} 
                                    />
                                    {activeTab === tab.id && (
                                        <Badge className={`bg-${tab.color}-500`}>Active</Badge>
                                    )}
                                </div>
                                <CardTitle className="text-lg">{tab.title}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-gray-600">{tab.description}</p>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Settings Content */}
            <div className="glass-card border-white/20 rounded-2xl overflow-hidden">
                {renderTabContent()}
            </div>
        </div>
    );
}
