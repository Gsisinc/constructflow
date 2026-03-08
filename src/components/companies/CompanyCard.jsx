import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, Edit, Globe, MapPin, Mail } from "lucide-react";

export default function CompanyCard({ company, onEdit }) {
    return (
        <Card className="glass-card border-white/20 flex flex-col">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-lg flex items-center justify-center">
                            <Building2 className="w-6 h-6 text-emerald-700" />
                        </div>
                        <div>
                            <CardTitle className="text-lg">{company.name}</CardTitle>
                            <p className="text-sm text-gray-500">{company.legal_name}</p>
                        </div>
                    </div>
                    <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">{company.currency}</Badge>
                </div>
            </CardHeader>
            <CardContent className="flex-grow space-y-3 text-sm">
                {company.address?.city && (
                    <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span>{company.address.city}, {company.address.country}</span>
                    </div>
                )}
                {company.contact?.email && (
                    <div className="flex items-center gap-2 text-gray-600">
                        <Mail className="w-4 h-4" />
                        <span>{company.contact.email}</span>
                    </div>
                )}
                {company.contact?.website && (
                    <div className="flex items-center gap-2 text-gray-600">
                        <Globe className="w-4 h-4" />
                        <span>{company.contact.website}</span>
                    </div>
                )}
            </CardContent>
            <CardFooter className="bg-white/20 p-4">
                <Button variant="outline" className="w-full" onClick={() => onEdit(company)}>
                    <Edit className="w-4 h-4 mr-2" /> Manage Company
                </Button>
            </CardFooter>
        </Card>
    );
}