import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, MessageCircle, Phone, Headphones } from 'lucide-react';

/** Support Channels – email, chat, phone. */
export default function SupportChannels() {
  const channels = [
    { icon: Mail, name: 'Email', value: 'support@constructflow.com', desc: 'Reply within 24 hours' },
    { icon: MessageCircle, name: 'Live Chat', value: 'In-app chat', desc: 'Mon–Fri 9am–6pm' },
    { icon: Phone, name: 'Phone', value: '1-800-CONSTRUCT', desc: 'Enterprise and implementation' },
    { icon: Headphones, name: 'Help Center', value: 'Help & Support in Settings', desc: 'Articles and FAQs' }
  ];
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Support Channels</h1>
        <p className="text-slate-600 mt-1">Get help via email, chat, or phone.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {channels.map((ch) => (
          <Card key={ch.name}>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ch.icon className="h-5 w-5" /> {ch.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium">{ch.value}</p>
              <p className="text-sm text-slate-600 mt-1">{ch.desc}</p>
              <Button className="mt-3" size="sm">Contact</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
