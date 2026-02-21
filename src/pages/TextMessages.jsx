import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';

/** Send Text Messages – SMS integration (e.g. Twilio). */
export default function TextMessages() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Send Text Messages</h1>
        <p className="text-slate-600 mt-1">Send SMS to contacts and project parties.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="h-5 w-5" /> SMS
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-600">Connect a provider (e.g. Twilio) in Settings to enable sending text messages from ConstructFlow.</p>
          <Button className="mt-4">Configure in Settings</Button>
        </CardContent>
      </Card>
    </div>
  );
}
