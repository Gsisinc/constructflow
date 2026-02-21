import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, FileText, Award, Plus } from 'lucide-react';

const sampleInsurance = [
  { id: '1', vendor: 'ABC Subcontracting', type: 'General Liability', expiry: '2025-06-30', status: 'current' },
  { id: '2', vendor: 'XYZ Electric', type: 'Workers Comp', expiry: '2025-03-15', status: 'expiring_soon' }
];
const sampleW9 = [
  { id: 'w1', vendor: 'ABC Subcontracting', received: '2024-01-10', status: 'on_file' },
  { id: 'w2', vendor: 'XYZ Electric', received: null, status: 'pending' }
];
const sampleLicenses = [
  { id: 'l1', vendor: 'ABC Subcontracting', licenseType: 'Contractor License', number: 'CL-12345', expiry: '2025-12-31', status: 'current' }
];

export default function DocumentTracking() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Document Tracking</h1>
        <p className="text-slate-600 mt-1">Insurance, W9s, and licenses.</p>
      </div>
      <Tabs defaultValue="insurance">
        <TabsList className="grid w-full max-w-2xl grid-cols-3">
          <TabsTrigger value="insurance" className="gap-2"><Shield className="h-4 w-4" /> Insurance</TabsTrigger>
          <TabsTrigger value="w9" className="gap-2"><FileText className="h-4 w-4" /> W9s</TabsTrigger>
          <TabsTrigger value="licenses" className="gap-2"><Award className="h-4 w-4" /> Licenses</TabsTrigger>
        </TabsList>
        <TabsContent value="insurance" className="mt-4 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Insurance Certificates</h2>
            <Button><Plus className="h-4 w-4 mr-2" /> Add</Button>
          </div>
          <Card>
            <CardContent className="pt-6">
              {sampleInsurance.map((row) => (
                <div key={row.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium">{row.vendor}</p>
                    <p className="text-sm text-slate-600">{row.type} – Expires {row.expiry}</p>
                  </div>
                  <Badge variant={row.status === 'expiring_soon' ? 'destructive' : 'default'}>{row.status === 'expiring_soon' ? 'Expiring soon' : 'Current'}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="w9" className="mt-4 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">W9s</h2>
            <Button><Plus className="h-4 w-4 mr-2" /> Request W9</Button>
          </div>
          <Card>
            <CardContent className="pt-6">
              {sampleW9.map((row) => (
                <div key={row.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium">{row.vendor}</p>
                    <p className="text-sm text-slate-600">{row.received ? 'Received ' + row.received : 'Pending'}</p>
                  </div>
                  <Badge variant={row.status === 'on_file' ? 'default' : 'secondary'}>{row.status === 'on_file' ? 'On file' : 'Pending'}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="licenses" className="mt-4 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Licenses</h2>
            <Button><Plus className="h-4 w-4 mr-2" /> Add License</Button>
          </div>
          <Card>
            <CardContent className="pt-6">
              {sampleLicenses.map((row) => (
                <div key={row.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium">{row.vendor}</p>
                    <p className="text-sm text-slate-600">{row.licenseType} {row.number} – Expires {row.expiry}</p>
                  </div>
                  <Badge>{row.status}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
