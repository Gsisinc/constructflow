import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  MessageSquare,
  Send,
  Phone,
  Mail,
  Video,
  FileText,
  User,
  Calendar,
  Search,
  Filter,
  Reply,
  Forward,
  Archive,
  Flag
} from 'lucide-react';

export default function ClientCommunicationLog() {
  const [communications] = useState([
    {
      id: 'COMM-001',
      type: 'email',
      subject: 'Project Status Update - April',
      from: 'John Smith',
      to: 'Client Team',
      date: new Date('2024-04-15'),
      time: '10:30 AM',
      content: 'Monthly project status update including progress photos and timeline review. All systems on track.',
      status: 'sent',
      attachments: 2,
      priority: 'normal'
    },
    {
      id: 'COMM-002',
      type: 'meeting',
      subject: 'Weekly Project Review Meeting',
      from: 'Sarah Johnson',
      to: 'Client Team',
      date: new Date('2024-04-12'),
      time: '2:00 PM',
      content: 'Weekly site meeting to review progress, discuss any issues, and plan next week activities.',
      status: 'completed',
      attendees: 5,
      duration: '1 hour',
      priority: 'normal'
    },
    {
      id: 'COMM-003',
      type: 'phone',
      subject: 'Change Order Discussion',
      from: 'Mike Davis',
      to: 'Client Manager',
      date: new Date('2024-04-10'),
      time: '3:15 PM',
      content: 'Discussion regarding Change Order #1 for structural reinforcement. Client approved proceeding.',
      status: 'completed',
      duration: '25 minutes',
      priority: 'high'
    },
    {
      id: 'COMM-004',
      type: 'email',
      subject: 'Budget Review and Forecast',
      from: 'John Smith',
      to: 'Client Finance',
      date: new Date('2024-04-08'),
      time: '9:00 AM',
      content: 'Detailed budget analysis showing current spending vs. forecast. On track for original budget.',
      status: 'sent',
      attachments: 3,
      priority: 'normal'
    },
    {
      id: 'COMM-005',
      type: 'video',
      subject: 'Site Tour - Progress Review',
      from: 'Sarah Johnson',
      to: 'Client Team',
      date: new Date('2024-04-05'),
      time: '11:00 AM',
      content: 'Virtual site tour showing MEP rough-in work and interior framing progress.',
      status: 'completed',
      duration: '45 minutes',
      priority: 'normal'
    },
    {
      id: 'COMM-006',
      type: 'email',
      subject: 'Safety Incident Report',
      from: 'Mike Davis',
      to: 'Client Manager',
      date: new Date('2024-04-01'),
      time: '4:30 PM',
      content: 'Minor safety incident report with corrective actions taken. No injuries.',
      status: 'sent',
      attachments: 1,
      priority: 'high'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedComm, setSelectedComm] = useState(null);

  const communicationTypes = [
    { value: 'email', label: 'Email', icon: Mail, color: 'bg-blue-100 text-blue-700' },
    { value: 'phone', label: 'Phone', icon: Phone, color: 'bg-green-100 text-green-700' },
    { value: 'meeting', label: 'Meeting', icon: MessageSquare, color: 'bg-purple-100 text-purple-700' },
    { value: 'video', label: 'Video', icon: Video, color: 'bg-orange-100 text-orange-700' }
  ];

  const filteredComms = communications.filter(comm => {
    const matchesSearch = comm.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         comm.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || comm.type === filterType;
    return matchesSearch && matchesType;
  });

  const getTypeInfo = (type) => {
    return communicationTypes.find(t => t.value === type) || communicationTypes[0];
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'normal':
        return 'bg-slate-100 text-slate-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <MessageSquare className="w-8 h-8 text-blue-600" />
          Communication Log
        </h1>
        <p className="text-slate-600 mt-1">All project communications in one centralized location</p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600">Total Communications</p>
            <p className="text-2xl font-bold mt-2">{communications.length}</p>
          </CardContent>
        </Card>
        {communicationTypes.map(type => {
          const count = communications.filter(c => c.type === type.value).length;
          return (
            <Card key={type.value}>
              <CardContent className="pt-6">
                <p className="text-sm text-slate-600">{type.label}</p>
                <p className="text-2xl font-bold mt-2">{count}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search communications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="gap-2"
                />
              </div>
              <Button variant="outline" className="gap-2">
                <Filter className="w-4 h-4" />
                More Filters
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterType === 'all' ? 'default' : 'outline'}
                onClick={() => setFilterType('all')}
              >
                All Types
              </Button>
              {communicationTypes.map(type => (
                <Button
                  key={type.value}
                  variant={filterType === type.value ? 'default' : 'outline'}
                  onClick={() => setFilterType(type.value)}
                  className="gap-2"
                >
                  <type.icon className="w-4 h-4" />
                  {type.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Communications Timeline */}
      <div className="space-y-3">
        {filteredComms.map((comm, idx) => {
          const typeInfo = getTypeInfo(comm.type);
          const TypeIcon = typeInfo.icon;

          return (
            <Card
              key={comm.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setSelectedComm(selectedComm?.id === comm.id ? null : comm)}
            >
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  {/* Timeline Connector */}
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${typeInfo.color}`}>
                      <TypeIcon className="w-5 h-5" />
                    </div>
                    {idx < filteredComms.length - 1 && (
                      <div className="w-1 h-12 bg-slate-200 mt-2" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-lg">{comm.subject}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {typeInfo.label}
                          </Badge>
                          <Badge className={`text-xs ${getPriorityBadge(comm.priority)}`}>
                            {comm.priority.toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{comm.date.toLocaleDateString()}</p>
                        <p className="text-xs text-slate-500">{comm.time}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-slate-600 mb-2">
                      <span className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {comm.from}
                      </span>
                      <span>→</span>
                      <span>{comm.to}</span>
                    </div>

                    <p className="text-sm text-slate-600 mb-3">{comm.content}</p>

                    <div className="flex items-center justify-between">
                      <div className="flex gap-4 text-xs text-slate-500">
                        {comm.attachments && (
                          <span className="flex items-center gap-1">
                            <FileText className="w-4 h-4" />
                            {comm.attachments} attachments
                          </span>
                        )}
                        {comm.attendees && (
                          <span className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            {comm.attendees} attendees
                          </span>
                        )}
                        {comm.duration && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {comm.duration}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" className="gap-1">
                          <Reply className="w-4 h-4" />
                          Reply
                        </Button>
                        <Button size="sm" variant="ghost" className="gap-1">
                          <Forward className="w-4 h-4" />
                          Forward
                        </Button>
                        <Button size="sm" variant="ghost" className="gap-1">
                          <Flag className="w-4 h-4" />
                          Flag
                        </Button>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {selectedComm?.id === comm.id && (
                      <div className="mt-4 pt-4 border-t space-y-3">
                        <div>
                          <p className="text-sm font-semibold mb-2">Full Message</p>
                          <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded">
                            {comm.content}
                          </p>
                        </div>
                        {comm.attachments && (
                          <div>
                            <p className="text-sm font-semibold mb-2">Attachments ({comm.attachments})</p>
                            <div className="space-y-1">
                              {Array.from({ length: comm.attachments }).map((_, i) => (
                                <div key={i} className="flex items-center justify-between p-2 bg-slate-50 rounded text-sm">
                                  <span className="flex items-center gap-2">
                                    <FileText className="w-4 h-4" />
                                    Document_{i + 1}.pdf
                                  </span>
                                  <Button size="sm" variant="ghost">
                                    Download
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredComms.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="pt-12 pb-12 text-center">
            <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600">No communications found</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
