import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  MessageSquare,
  Mail,
  Phone,
  Video,
  Plus,
  Send,
  Calendar,
  Users,
  FileText,
  TrendingUp,
  Globe,
  Clock
} from 'lucide-react';

export default function StakeholderCommunication() {
  const [communications] = useState([
    {
      id: 'COMM-001',
      type: 'email',
      recipient: 'Client - John Doe',
      date: new Date('2024-04-22'),
      subject: 'Weekly Project Update - Week 16',
      sentiment: 'positive',
      status: 'sent',
      opens: 1,
      clicks: 3
    },
    {
      id: 'COMM-002',
      type: 'meeting',
      recipient: 'Project Stakeholders',
      date: new Date('2024-04-20'),
      subject: 'Monthly Steering Committee',
      sentiment: 'positive',
      status: 'completed',
      attendees: 12,
      duration: 60
    },
    {
      id: 'COMM-003',
      type: 'phone',
      recipient: 'Client - Sarah Smith',
      date: new Date('2024-04-18'),
      subject: 'Status Discussion - Schedule Update',
      sentiment: 'neutral',
      status: 'completed',
      duration: 25
    },
    {
      id: 'COMM-004',
      type: 'email',
      recipient: 'Subcontractors',
      date: new Date('2024-04-15'),
      subject: 'Change Order #5 - Electrical Scope',
      sentiment: 'neutral',
      status: 'sent',
      opens: 8,
      clicks: 12
    }
  ]);

  const [scheduledUpdates] = useState([
    {
      id: 'SCHED-001',
      name: 'Weekly Client Update',
      frequency: 'Every Monday',
      template: 'Weekly Status Report',
      recipients: 5,
      nextDate: new Date('2024-04-29')
    },
    {
      id: 'SCHED-002',
      name: 'Monthly Stakeholder Report',
      frequency: 'First Friday of Month',
      template: 'Executive Summary',
      recipients: 12,
      nextDate: new Date('2024-05-03')
    },
    {
      id: 'SCHED-003',
      name: 'Bi-weekly Team Sync',
      frequency: 'Every Other Wednesday',
      template: 'Team Meeting Agenda',
      recipients: 8,
      nextDate: new Date('2024-04-24')
    }
  ]);

  const [templates] = useState([
    { id: 'TEMP-001', name: 'Weekly Status Report', type: 'email', usage: 24 },
    { id: 'TEMP-002', name: 'Executive Summary', type: 'email', usage: 12 },
    { id: 'TEMP-003', name: 'Change Order Notification', type: 'email', usage: 8 },
    { id: 'TEMP-004', name: 'Incident Report', type: 'email', usage: 3 },
    { id: 'TEMP-005', name: 'Meeting Agenda', type: 'meeting', usage: 15 }
  ]);

  const [sentimentAnalysis] = useState({
    positive: 65,
    neutral: 25,
    negative: 10,
    totalMessages: 142
  });

  const [languages] = useState([
    { code: 'en', name: 'English', active: true },
    { code: 'es', name: 'Spanish', active: true },
    { code: 'zh', name: 'Mandarin', active: false },
    { code: 'fr', name: 'French', active: false }
  ]);

  const getTypeIcon = (type) => {
    switch (type) {
      case 'email':
        return Mail;
      case 'phone':
        return Phone;
      case 'meeting':
        return Users;
      case 'video':
        return Video;
      default:
        return MessageSquare;
    }
  };

  const getSentimentColor = (sentiment) => {
    switch (sentiment) {
      case 'positive':
        return 'bg-green-100 text-green-800';
      case 'neutral':
        return 'bg-slate-100 text-slate-800';
      case 'negative':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <MessageSquare className="w-8 h-8 text-blue-600" />
            Stakeholder Communication
          </h1>
          <p className="text-slate-600 mt-1">Automated updates, templates, and communication tracking</p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          New Communication
        </Button>
      </div>

      {/* Sentiment Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Communication Sentiment Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm text-slate-600 mb-2">Positive</p>
              <p className="text-2xl font-bold text-green-600">{sentimentAnalysis.positive}%</p>
              <p className="text-xs text-slate-600 mt-1">
                {Math.round((sentimentAnalysis.positive / 100) * sentimentAnalysis.totalMessages)} messages
              </p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-sm text-slate-600 mb-2">Neutral</p>
              <p className="text-2xl font-bold text-slate-600">{sentimentAnalysis.neutral}%</p>
              <p className="text-xs text-slate-600 mt-1">
                {Math.round((sentimentAnalysis.neutral / 100) * sentimentAnalysis.totalMessages)} messages
              </p>
            </div>
            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <p className="text-sm text-slate-600 mb-2">Negative</p>
              <p className="text-2xl font-bold text-red-600">{sentimentAnalysis.negative}%</p>
              <p className="text-xs text-slate-600 mt-1">
                {Math.round((sentimentAnalysis.negative / 100) * sentimentAnalysis.totalMessages)} messages
              </p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-slate-600 mb-2">Total Messages</p>
              <p className="text-2xl font-bold text-blue-600">{sentimentAnalysis.totalMessages}</p>
              <p className="text-xs text-slate-600 mt-1">All communications</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Communication History */}
      <Card>
        <CardHeader>
          <CardTitle>Communication Log</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {communications.map((comm) => {
            const TypeIcon = getTypeIcon(comm.type);
            return (
              <div key={comm.id} className="p-4 border rounded-lg hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-start gap-3 flex-1">
                    <TypeIcon className="w-5 h-5 text-slate-600 mt-1" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm">{comm.subject}</h3>
                      <p className="text-xs text-slate-600 mt-1">{comm.recipient}</p>
                    </div>
                  </div>
                  <Badge className={getSentimentColor(comm.sentiment)}>
                    {comm.sentiment.toUpperCase()}
                  </Badge>
                </div>

                <div className="grid grid-cols-4 gap-4 text-xs border-t pt-3">
                  <div>
                    <p className="text-slate-600">Date</p>
                    <p className="font-medium">{comm.date.toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-slate-600">Status</p>
                    <p className="font-medium capitalize">{comm.status}</p>
                  </div>
                  <div>
                    <p className="text-slate-600">
                      {comm.type === 'email' ? 'Opens/Clicks' : comm.type === 'meeting' ? 'Attendees' : 'Duration'}
                    </p>
                    <p className="font-medium">
                      {comm.type === 'email' && `${comm.opens}/${comm.clicks}`}
                      {comm.type === 'meeting' && `${comm.attendees} / ${comm.duration}m`}
                      {comm.type === 'phone' && `${comm.duration} min`}
                    </p>
                  </div>
                  <div>
                    <Button size="sm" variant="outline" className="gap-1">
                      <FileText className="w-3 h-3" />
                      View
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Scheduled Updates */}
      <Card>
        <CardHeader>
          <CardTitle>Scheduled Automated Updates</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {scheduledUpdates.map((update) => (
            <div key={update.id} className="p-4 border rounded-lg">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="font-semibold text-sm">{update.name}</h3>
                  <p className="text-xs text-slate-600 mt-1">Template: {update.template}</p>
                </div>
                <Badge variant="outline">{update.frequency}</Badge>
              </div>

              <div className="grid grid-cols-3 gap-4 text-sm border-t pt-3">
                <div>
                  <p className="text-xs text-slate-600">Recipients</p>
                  <p className="font-medium">{update.recipients} people</p>
                </div>
                <div>
                  <p className="text-xs text-slate-600">Next Send</p>
                  <p className="font-medium flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {update.nextDate.toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <Button size="sm" variant="outline" className="gap-1">
                    <Send className="w-3 h-3" />
                    Send Now
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Communication Templates */}
      <Card>
        <CardHeader>
          <CardTitle>Communication Templates Library</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {templates.map((template) => (
            <div key={template.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex-1">
                <p className="font-medium text-sm">{template.name}</p>
                <p className="text-xs text-slate-600">Used {template.usage} times</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{template.type}</Badge>
                <Button size="sm" variant="outline">Use</Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Multi-language Support */}
      <Card>
        <CardHeader>
          <CardTitle>Multi-language Support</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {languages.map((lang) => (
              <div key={lang.code} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-slate-600" />
                  <p className="font-medium text-sm">{lang.name}</p>
                </div>
                <Badge
                  variant={lang.active ? 'default' : 'outline'}
                  className={lang.active ? 'bg-green-600' : ''}
                >
                  {lang.active ? 'ACTIVE' : 'INACTIVE'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
