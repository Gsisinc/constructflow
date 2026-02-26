import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Mail,
  Send,
  Inbox,
  Archive,
  Star,
  PenSquare,
  ExternalLink,
  ChevronLeft,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

const DEMO_EMAILS = [
  {
    id: '1',
    from: 'project@client-acme.com',
    fromName: 'Acme Corp',
    to: 'you@constructflow.com',
    subject: 'Re: Change order #CO-2024-012 approval',
    body: 'Hi,\n\nWe have approved the change order #CO-2024-012 for the electrical scope addition. Please proceed with the work and send the updated schedule by end of week.\n\nBest,\nAcme Project Team',
    date: new Date(Date.now() - 2 * 60 * 60 * 1000),
    read: false,
    starred: true,
    folder: 'inbox',
  },
  {
    id: '2',
    from: 'bids@sam.gov',
    fromName: 'SAM.gov',
    to: 'you@constructflow.com',
    subject: 'New opportunity: Low voltage – Building A',
    body: 'A new contract opportunity matching your saved search has been posted.\n\nAgency: GSA\nNAICS: 541512\nSet-aside: 8(a)\nDue: 14 days\n\nView and respond at the link in this email.',
    date: new Date(Date.now() - 5 * 60 * 60 * 1000),
    read: true,
    starred: false,
    folder: 'inbox',
  },
  {
    id: '3',
    from: 'invoices@subcontractor.com',
    fromName: 'ABC Electrical',
    to: 'you@constructflow.com',
    subject: 'Invoice #INV-789 – Project Riverside',
    body: 'Please find attached invoice #INV-789 for work completed in January. Payment terms: Net 30.\n\nThank you,\nABC Electrical',
    date: new Date(Date.now() - 24 * 60 * 60 * 1000),
    read: false,
    starred: false,
    folder: 'inbox',
  },
];

export default function Webmail() {
  const [emails, setEmails] = useState(DEMO_EMAILS);
  const [selectedId, setSelectedId] = useState(null);
  const [folder, setFolder] = useState('inbox');
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeTo, setComposeTo] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');

  const selected = emails.find((e) => e.id === selectedId);
  const folderEmails = emails.filter((e) => e.folder === folder);

  const handleComposeSend = () => {
    if (!composeTo.trim()) {
      toast.error('Enter a recipient');
      return;
    }
    toast.success('Message sent (demo). Connect your email in Settings for real sending.');
    setComposeOpen(false);
    setComposeTo('');
    setComposeSubject('');
    setComposeBody('');
  };

  const markRead = (id) => {
    setEmails((prev) => prev.map((e) => (e.id === id ? { ...e, read: true } : e)));
  };

  const toggleStar = (id) => {
    setEmails((prev) => prev.map((e) => (e.id === id ? { ...e, starred: !e.starred } : e)));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Mail className="h-7 w-7 text-indigo-600" />
            Webmail
          </h1>
          <p className="text-slate-600 mt-1">
            In-app email. Connect Gmail or Outlook in Settings for live sync.
          </p>
        </div>
        <Button onClick={() => setComposeOpen(true)} className="gap-2 shrink-0">
          <PenSquare className="h-4 w-4" />
          Compose
        </Button>
      </div>

      <Card className="overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 min-h-[500px]">
          {/* Folders + Inbox list */}
          <div className="md:col-span-1 border-b md:border-b-0 md:border-r bg-slate-50/50 flex flex-col">
            <div className="p-2 border-b space-y-0.5">
              <button
                onClick={() => setFolder('inbox')}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${folder === 'inbox' ? 'bg-primary text-primary-foreground' : 'hover:bg-slate-200 text-slate-700'}`}
              >
                <Inbox className="h-4 w-4" />
                Inbox
                <Badge variant="secondary" className="ml-auto text-xs">
                  {folderEmails.length}
                </Badge>
              </button>
              <button
                onClick={() => setFolder('archive')}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${folder === 'archive' ? 'bg-primary text-primary-foreground' : 'hover:bg-slate-200 text-slate-700'}`}
              >
                <Archive className="h-4 w-4" />
                Archive
              </button>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-0.5">
                {folderEmails.map((email) => (
                  <button
                    key={email.id}
                    onClick={() => {
                      setSelectedId(email.id);
                      markRead(email.id);
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-lg border transition-colors ${
                      selectedId === email.id
                        ? 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-200'
                        : 'border-transparent hover:bg-white hover:border-slate-200'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleStar(email.id);
                        }}
                        className="shrink-0 mt-0.5 text-amber-500 hover:text-amber-600"
                      >
                        <Star className={`h-4 w-4 ${email.starred ? 'fill-current' : ''}`} />
                      </button>
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm truncate ${!email.read ? 'font-semibold text-slate-900' : 'text-slate-600'}`}>
                          {email.fromName || email.from}
                        </p>
                        <p className="text-xs text-slate-500 truncate">{email.subject}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {format(email.date, 'MMM d, h:mm a')}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
                {folderEmails.length === 0 && (
                  <p className="text-sm text-slate-500 px-3 py-6 text-center">No messages</p>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Read pane */}
          <div className="md:col-span-2 flex flex-col bg-white">
            {selected ? (
              <>
                <div className="p-4 border-b flex items-start justify-between gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden shrink-0"
                    onClick={() => setSelectedId(null)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg font-semibold text-slate-900 break-words">{selected.subject}</h2>
                    <div className="flex flex-wrap items-center gap-2 mt-2 text-sm text-slate-600">
                      <span>From: {selected.fromName || selected.from}</span>
                      <span>•</span>
                      <span>{format(selected.date, 'MMM d, yyyy h:mm a')}</span>
                    </div>
                  </div>
                </div>
                <ScrollArea className="flex-1 p-4">
                  <div className="prose prose-slate max-w-none text-sm whitespace-pre-wrap">
                    {selected.body}
                  </div>
                </ScrollArea>
                <div className="p-4 border-t flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => setComposeOpen(true)} className="gap-1.5">
                    <Send className="h-4 w-4" />
                    Reply
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(`mailto:${selected.from}?subject=Re: ${selected.subject}`, '_blank')}
                    className="gap-1.5"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Open in mail app
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-500 p-8">
                <div className="text-center">
                  <Mail className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                  <p className="text-sm">Select a message or compose a new email.</p>
                  <Button variant="outline" className="mt-3 gap-2" onClick={() => setComposeOpen(true)}>
                    <PenSquare className="h-4 w-4" />
                    Compose
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Connect email card */}
      <Card className="border-dashed border-2 border-slate-200 bg-slate-50/50">
        <CardHeader>
          <CardTitle className="text-base">Connect your email</CardTitle>
          <CardDescription>
            For live inbox sync and sending, connect Gmail or Outlook in Settings → Integrations. This view shows demo messages until then.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" asChild>
            <a href="https://mail.google.com" target="_blank" rel="noopener noreferrer" className="gap-2">
              <ExternalLink className="h-4 w-4" />
              Open Gmail
            </a>
          </Button>
          <Button variant="outline" className="ml-2 gap-2" asChild>
            <a href="https://outlook.live.com" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" />
              Open Outlook
            </a>
          </Button>
        </CardContent>
      </Card>

      {/* Compose dialog */}
      {composeOpen && (
        <Card className="fixed bottom-4 right-4 left-4 md:left-auto md:right-4 md:w-[420px] z-50 shadow-xl border-2">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-base">New message</CardTitle>
            <Button variant="ghost" size="icon" onClick={() => setComposeOpen(false)}>×</Button>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-xs font-medium text-slate-600">To</label>
              <Input
                placeholder="email@example.com"
                value={composeTo}
                onChange={(e) => setComposeTo(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">Subject</label>
              <Input
                placeholder="Subject"
                value={composeSubject}
                onChange={(e) => setComposeSubject(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">Message</label>
              <Textarea
                placeholder="Write your message..."
                value={composeBody}
                onChange={(e) => setComposeBody(e.target.value)}
                rows={4}
                className="mt-1"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setComposeOpen(false)}>Cancel</Button>
              <Button onClick={handleComposeSend} className="gap-2">
                <Send className="h-4 w-4" />
                Send
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
