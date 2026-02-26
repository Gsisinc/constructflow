import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, Users, FileCheck, Calendar } from 'lucide-react';

/** Implementation – setup and migration support. */
export default function Implementation() {
  const steps = [
    { icon: Settings, title: 'Account & org setup', desc: 'Configure organization and first projects.' },
    { icon: Users, title: 'Team & permissions', desc: 'Invite users and set role permissions.' },
    { icon: FileCheck, title: 'Data migration', desc: 'Import estimates, contacts, and documents.' },
    { icon: Calendar, title: 'Go live', desc: 'Cutover and ongoing training.' }
  ];
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Implementation</h1>
        <p className="text-slate-600 mt-1">Structured rollout and migration support.</p>
      </div>
      <Card>
        <CardContent className="pt-6 space-y-4">
          {steps.map((s) => (
            <div key={s.title} className="flex gap-4 items-start">
              <s.icon className="h-6 w-6 text-slate-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold">{s.title}</h3>
                <p className="text-sm text-slate-600">{s.desc}</p>
              </div>
            </div>
          ))}
          <Button className="mt-4">Request implementation support</Button>
        </CardContent>
      </Card>
    </div>
  );
}
