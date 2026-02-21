import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PenLine } from 'lucide-react';

/** E-signature Collection – DocuSign / contract e-sign status. */
export default function ESignatures() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">E-signature Collection</h1>
        <p className="text-slate-600 mt-1">Send contracts for e-signature and track status.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <PenLine className="h-5 w-5" /> E-signatures
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-600">E-signatures on contracts are available via Integrations. Configure DocuSign (or similar) in Settings to send and track signatures.</p>
          <Button className="mt-4">Open Integrations</Button>
        </CardContent>
      </Card>
    </div>
  );
}
