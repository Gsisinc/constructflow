import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Plus, Download } from 'lucide-react';

/** AIA Billing – G702/G703 Pay Applications. */
const payApps = [
  { id: '1', period: 'January 2025', contractSum: 500000, previousCert: 0, currentCert: 45000, retainage: 2250, status: 'approved' },
  { id: '2', period: 'February 2025', contractSum: 500000, previousCert: 45000, currentCert: 52000, retainage: 2600, status: 'pending' }
];

export default function AIABilling() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">AIA Billing</h1>
        <p className="text-slate-600 mt-1">Generate G702/G703 pay applications.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5" /> Pay Applications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button><Plus className="h-4 w-4 mr-2" /> New Pay App (G702/G703)</Button>
            <Button variant="outline"><Download className="h-4 w-4 mr-2" /> Export</Button>
          </div>
          <div className="rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left p-3 font-medium">Period</th>
                  <th className="text-right p-3 font-medium">Contract Sum</th>
                  <th className="text-right p-3 font-medium">Previous Cert.</th>
                  <th className="text-right p-3 font-medium">Current Cert.</th>
                  <th className="text-right p-3 font-medium">Retainage</th>
                  <th className="text-center p-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {payApps.map((row) => (
                  <tr key={row.id} className="border-t">
                    <td className="p-3">{row.period}</td>
                    <td className="p-3 text-right">${row.contractSum.toLocaleString()}</td>
                    <td className="p-3 text-right">${row.previousCert.toLocaleString()}</td>
                    <td className="p-3 text-right">${row.currentCert.toLocaleString()}</td>
                    <td className="p-3 text-right">${row.retainage.toLocaleString()}</td>
                    <td className="p-3 text-center"><Badge variant={row.status === 'approved' ? 'default' : 'secondary'}>{row.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-slate-500">G702 Application and Certificate for Payment • G703 Continuation Sheet.</p>
        </CardContent>
      </Card>
    </div>
  );
}
