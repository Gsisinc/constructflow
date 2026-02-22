import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Send, Plus, Phone, Users, Clock, CheckCheck } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const QUICK_TEMPLATES = [
  'Your project update is ready. Please log in to review.',
  'Reminder: Site inspection scheduled for tomorrow at 9AM.',
  'Your change order has been approved. Work can proceed.',
  'Invoice #{{num}} is due in 3 days. Please submit payment.',
  'Safety briefing required. Please arrive 15 min early tomorrow.',
];

export default function TextMessages() {
  const queryClient = useQueryClient();
  const [selectedContact, setSelectedContact] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [showNewThread, setShowNewThread] = useState(false);
  const [newContact, setNewContact] = useState({ name: '', phone: '', message: '' });
  const messagesEndRef = useRef(null);

  // Use ClientUpdate entity to simulate SMS threads
  const { data: threads = [] } = useQuery({
    queryKey: ['smsThreads'],
    queryFn: () => base44.entities.ClientUpdate.filter({ update_type: 'announcement' }, '-created_date'),
  });

  // Group by posted_by as "contact"
  const contacts = Array.from(
    threads.reduce((map, t) => {
      const key = t.posted_by || 'Unknown';
      if (!map.has(key)) map.set(key, { name: key, messages: [], latest: t });
      map.get(key).messages.push(t);
      return map;
    }, new Map()).values()
  );

  const selectedMessages = selectedContact
    ? threads.filter(t => t.posted_by === selectedContact).sort((a, b) => new Date(a.created_date) - new Date(b.created_date))
    : [];

  const sendMutation = useMutation({
    mutationFn: (data) => base44.entities.ClientUpdate.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['smsThreads'] });
      setMessageText('');
      toast.success('Message sent');
    },
  });

  const handleSend = () => {
    if (!messageText.trim() || !selectedContact) return;
    sendMutation.mutate({
      project_id: selectedMessages[0]?.project_id || '',
      update_type: 'announcement',
      title: 'SMS',
      content: messageText,
      posted_by: selectedContact,
      visibility: 'client',
    });
  };

  const handleNewThread = () => {
    if (!newContact.name || !newContact.phone || !newContact.message) return;
    sendMutation.mutate({
      project_id: '',
      update_type: 'announcement',
      title: 'SMS',
      content: newContact.message,
      posted_by: `${newContact.name} (${newContact.phone})`,
      visibility: 'client',
    }, {
      onSuccess: () => {
        setSelectedContact(`${newContact.name} (${newContact.phone})`);
        setNewContact({ name: '', phone: '', message: '' });
        setShowNewThread(false);
      }
    });
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedMessages.length]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Text Messages</h1>
          <p className="text-slate-500 mt-1">Send SMS to project contacts and subcontractors</p>
        </div>
        <Button onClick={() => setShowNewThread(true)} className="gap-2">
          <Plus className="h-4 w-4" /> New Message
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3 flex items-center gap-3">
            <MessageSquare className="h-7 w-7 text-blue-600" />
            <div><p className="text-xl font-bold">{threads.length}</p><p className="text-xs text-slate-500">Total Messages</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 flex items-center gap-3">
            <Users className="h-7 w-7 text-purple-600" />
            <div><p className="text-xl font-bold">{contacts.length}</p><p className="text-xs text-slate-500">Contacts</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 flex items-center gap-3">
            <CheckCheck className="h-7 w-7 text-green-600" />
            <div><p className="text-xl font-bold">{threads.length}</p><p className="text-xs text-slate-500">Delivered</p></div>
          </CardContent>
        </Card>
      </div>

      {/* Messaging UI */}
      <div className="flex gap-4 h-[60vh] bg-white rounded-xl border border-slate-200 overflow-hidden">
        {/* Contact list */}
        <div className="w-64 border-r border-slate-200 flex flex-col overflow-y-auto">
          <div className="p-3 border-b border-slate-200">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Conversations</p>
          </div>
          {contacts.length === 0 ? (
            <div className="p-4 text-center text-sm text-slate-400">No conversations yet</div>
          ) : (
            contacts.map(c => (
              <button
                key={c.name}
                onClick={() => setSelectedContact(c.name)}
                className={`w-full text-left p-3 border-b border-slate-100 hover:bg-slate-50 transition-colors ${selectedContact === c.name ? 'bg-blue-50' : ''}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {c.name[0]?.toUpperCase()}
                  </div>
                  <p className="text-sm font-medium text-slate-900 truncate">{c.name}</p>
                </div>
                <p className="text-xs text-slate-500 truncate ml-10">{c.latest.content}</p>
              </button>
            ))
          )}
        </div>

        {/* Message pane */}
        <div className="flex-1 flex flex-col">
          {selectedContact ? (
            <>
              <div className="p-3 border-b border-slate-200 flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold">
                  {selectedContact[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-slate-900 text-sm">{selectedContact}</p>
                  <p className="text-xs text-green-600 flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-green-500 inline-block" /> Active</p>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {selectedMessages.map((msg, i) => (
                  <div key={msg.id} className="flex justify-end">
                    <div className="max-w-xs bg-blue-600 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 shadow-sm">
                      <p className="text-sm">{msg.content}</p>
                      <p className="text-xs opacity-70 mt-1 text-right">{format(new Date(msg.created_date), 'h:mm a')}</p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              {/* Quick templates */}
              <div className="px-3 py-2 border-t border-slate-100">
                <div className="flex gap-1 overflow-x-auto pb-1">
                  {QUICK_TEMPLATES.map((t, i) => (
                    <button key={i} onClick={() => setMessageText(t)}
                      className="text-xs whitespace-nowrap px-2 py-1 rounded-full border border-slate-200 hover:bg-slate-100 text-slate-600 flex-shrink-0">
                      {t.substring(0, 30)}...
                    </button>
                  ))}
                </div>
              </div>
              <div className="p-3 border-t border-slate-200 flex gap-2">
                <Input
                  value={messageText}
                  onChange={e => setMessageText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  placeholder="Type a message..."
                  className="flex-1"
                />
                <Button onClick={handleSend} disabled={!messageText.trim()} size="icon">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center">
              <div>
                <MessageSquare className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">Select a conversation</p>
                <p className="text-sm text-slate-400">or start a new one</p>
                <Button className="mt-4" onClick={() => setShowNewThread(true)}>
                  <Plus className="h-4 w-4 mr-2" /> New Message
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Thread Dialog */}
      <Dialog open={showNewThread} onOpenChange={setShowNewThread}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>New Text Message</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Contact Name *</Label>
                <Input placeholder="John Smith" value={newContact.name}
                  onChange={e => setNewContact({ ...newContact, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Phone Number *</Label>
                <Input placeholder="+1 (555) 000-0000" value={newContact.phone}
                  onChange={e => setNewContact({ ...newContact, phone: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Message *</Label>
              <Textarea placeholder="Type your message..." value={newContact.message}
                onChange={e => setNewContact({ ...newContact, message: e.target.value })} rows={4} />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 mb-2">Quick Templates</p>
              <div className="space-y-1">
                {QUICK_TEMPLATES.slice(0, 3).map((t, i) => (
                  <button key={i} onClick={() => setNewContact({ ...newContact, message: t })}
                    className="w-full text-left text-xs p-2 rounded border border-slate-200 hover:bg-slate-50 text-slate-600">
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2 border-t">
              <Button variant="outline" onClick={() => setShowNewThread(false)}>Cancel</Button>
              <Button onClick={handleNewThread}
                disabled={!newContact.name || !newContact.phone || !newContact.message || sendMutation.isPending}
                className="gap-2">
                <Send className="h-4 w-4" /> Send Message
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}