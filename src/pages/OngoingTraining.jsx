import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Video, Book, HelpCircle } from 'lucide-react';

/** Ongoing Training – learning hub and resources. */
export default function OngoingTraining() {
  const resources = [
    { icon: Video, title: 'Video tutorials', desc: 'Short how-to videos for core features.' },
    { icon: Book, title: 'Knowledge base', desc: 'Articles and best practices.' },
    { icon: HelpCircle, title: 'PM Setup Guide', desc: 'Training & Support from the app.' }
  ];
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Ongoing Training</h1>
        <p className="text-slate-600 mt-1">Videos, guides, and support for your team.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {resources.map((r) => (
          <Card key={r.title}>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <r.icon className="h-5 w-5" /> {r.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">{r.desc}</p>
              <Button className="mt-3" size="sm" variant="outline">Open</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
