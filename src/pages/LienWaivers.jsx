import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Send, Inbox, FileText, Plus, Upload } from 'lucide-react';

/** Lien Waivers – Send, Collect, Sub-tier, Custom Templates. */
export default function LienWaivers() {
  const [activeTab, setActiveTab] = useState('send');
  const sendList = [
    { id: '1', project: 'Downtown Plaza', recipient: 'ABC Subcontracting', type: 'Conditional', status: 'sent', date: '2025-02-15' },
    { id: '2', project: 'Highway 101', recipient: 'XYZ Electric', type: 'Unconditional', status: 'pending', date: '2025-02-18' }
  ];
  const collectList = [
    { id: 'c1', project: 'Downtown Plaza', from: 'ABC Subcontracting', type: 'Conditional', status: 'received', date: '2025-02-14' },
    { id: 'c2', project: 'Highway 101', from: 'XYZ Electric', type: 'Unconditional', status: 'pending', date: null }
  ];
  const templates = [
    { id: 't1', name: 'Conditional Waiver – Progress Payment', category: 'Conditional' },
    { id: 't2', name: 'Unconditional Waiver – Final Payment', category: 'Unconditional' },
    { id: 't3', name: 'Sub-tier Waiver', category: 'Sub-tier' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Lien Waivers</h1>
        <p className="text-slate-600 mt-1">Send and collect lien waivers; manage sub-tier waivers and custom templates.</p>
      </div>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-2xl grid-cols-3">
          <TabsTrigger value="send" className="gap-2"><Send className="h-4 w-4" /> Send</TabsTrigger>
          <TabsTrigger value="collect" className="gap-2"><Inbox className="h-4 w-4" /> Collect</TabsTrigger>
          <TabsTrigger value="templates" className="gap-2"><FileText className="h-4 w-4" /> Templates</TabsTrigger>
        </TabsList>
        <TabsContent value="send" className="space-y-4 mt-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Send Lien Waivers</h2>
            <Button><Plus className="h-4 w-4 mr-2" /> Send Waiver</Button>
          </div>
          <Card>
            <CardContent className="pt-6">
              <ul className="space-y-3">
                {sendList.map((row) => (
                  <li key={row.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="font-medium">{row.project} → {row.recipient}</p>
                      <p className="text-sm text-slate-600">{row.type} • {row.date}</p>
                    </div>
                    <Badge variant={row.status === 'sent' ? 'default' : 'secondary'}>{row.status}</Badge>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="collect" className="space-y-4 mt-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Collect Lien Waivers</h2>
            <Button variant="outline"><Upload className="h-4 w-4 mr-2" /> Request Waiver</Button>
          </div>
          <Card>
            <CardContent className="pt-6">
              <ul className="space-y-3">
                {collectList.map((row) => (
                  <li key={row.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="font-medium">{row.project} ← {row.from}</p>
                      <p className="text-sm text-slate-600">{row.type} • {row.date || 'Awaiting'}</p>
                    </div>
                    <Badge variant={row.status === 'received' ? 'default' : 'secondary'}>{row.status}</Badge>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Sub-tier Lien Waivers</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">Track and collect waivers from sub-tier contractors.</p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="templates" className="space-y-4 mt-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Custom Lien Waiver Templates</h2>
            <Button><Plus className="h-4 w-4 mr-2" /> New Template</Button>
          </div>
          <Card>
            <CardContent className="pt-6">
              <ul className="space-y-3">
                {templates.map((t) => (
                  <li key={t.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="font-medium">{t.name}</p>
                      <p className="text-sm text-slate-600">{t.category}</p>
                    </div>
                    <Button size="sm" variant="outline">Edit</Button>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
