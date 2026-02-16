import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, MessageSquare, FileText, AlertCircle, CheckCircle2, Clock, Users } from 'lucide-react';

export default function SubcontractorCoordination() {
  const [subcontractors, setSubcontractors] = useState([
    {
      id: 1,
      name: 'ABC Electrical Inc',
      category: 'Electrical',
      contactPerson: 'Mike Wilson',
      phone: '(555) 123-4567',
      email: 'mike@abcelectrical.com',
      status: 'active',
      projects: ['Project A', 'Project C'],
      rating: 4.8,
      completedProjects: 12,
    },
    {
      id: 2,
      name: 'XYZ Plumbing Services',
      category: 'Plumbing',
      contactPerson: 'Lisa Garcia',
      phone: '(555) 234-5678',
      email: 'lisa@xyzplumbing.com',
      status: 'active',
      projects: ['Project B', 'Project D'],
      rating: 4.5,
      completedProjects: 8,
    },
    {
      id: 3,
      name: 'General Framing LLC',
      category: 'Framing',
      contactPerson: 'David Brown',
      phone: '(555) 345-6789',
      email: 'david@generalframing.com',
      status: 'active',
      projects: ['Project A'],
      rating: 4.9,
      completedProjects: 25,
    },
  ]);

  const [selectedSubcontractor, setSelectedSubcontractor] = useState(null);
  const [schedules, setSchedules] = useState([
    {
      id: 1,
      subcontractor: 'ABC Electrical Inc',
      project: 'Project A',
      task: 'Rough-in electrical work',
      startDate: '2026-02-20',
      endDate: '2026-03-05',
      status: 'scheduled',
      workers: 3,
    },
    {
      id: 2,
      subcontractor: 'XYZ Plumbing Services',
      project: 'Project B',
      task: 'Main water line installation',
      startDate: '2026-02-25',
      endDate: '2026-03-10',
      status: 'scheduled',
      workers: 2,
    },
    {
      id: 3,
      subcontractor: 'General Framing LLC',
      project: 'Project A',
      task: 'Roof framing and installation',
      startDate: '2026-02-18',
      endDate: '2026-02-28',
      status: 'in-progress',
      workers: 5,
    },
  ]);

  const [messages, setMessages] = useState([
    { id: 1, from: 'Mike Wilson (ABC Electrical)', date: '2026-02-15', message: 'Confirming schedule for next week', read: false },
    { id: 2, from: 'Lisa Garcia (XYZ Plumbing)', date: '2026-02-14', message: 'Materials will arrive on Feb 23', read: true },
    { id: 3, from: 'David Brown (General Framing)', date: '2026-02-13', message: 'Team is on track for completion', read: true },
  ]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'scheduled':
        return <Badge className="bg-blue-100 text-blue-800">Scheduled</Badge>;
      case 'in-progress':
        return <Badge className="bg-yellow-100 text-yellow-800">In Progress</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Subcontractor Coordination</h1>
          <p className="text-gray-600 mt-2">
            Manage schedules, documents, and communication with subcontractors.
          </p>
        </div>
        <Button size="lg">
          <Users size={18} className="mr-2" />
          Add Subcontractor
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Subs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{subcontractors.length}</div>
            <p className="text-xs text-gray-600 mt-2">Active partners</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Scheduled Work</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {schedules.filter(s => s.status === 'scheduled').length}
            </div>
            <p className="text-xs text-gray-600 mt-2">Pending assignments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {schedules.filter(s => s.status === 'in-progress').length}
            </div>
            <p className="text-xs text-gray-600 mt-2">Active work</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Unread Messages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {messages.filter(m => !m.read).length}
            </div>
            <p className="text-xs text-gray-600 mt-2">Awaiting response</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="subs" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="subs">Subcontractors</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
        </TabsList>

        <TabsContent value="subs" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {subcontractors.map(sub => (
              <Card
                key={sub.id}
                className={`cursor-pointer transition ${
                  selectedSubcontractor?.id === sub.id ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => setSelectedSubcontractor(sub)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{sub.name}</CardTitle>
                      <CardDescription>{sub.category}</CardDescription>
                    </div>
                    {getStatusBadge(sub.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-600">Contact:</span>
                      <p className="font-medium">{sub.contactPerson}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Email:</span>
                      <p className="font-medium text-blue-600">{sub.email}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Phone:</span>
                      <p className="font-medium">{sub.phone}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-3 border-t">
                    <div>
                      <p className="text-xs text-gray-600">Rating</p>
                      <p className="font-bold">{sub.rating}★</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Projects</p>
                      <p className="font-bold">{sub.completedProjects} completed</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1 pt-2">
                    {sub.projects.map(project => (
                      <Badge key={project} variant="outline" className="text-xs">
                        {project}
                      </Badge>
                    ))}
                  </div>

                  <Button className="w-full mt-2" size="sm" variant="outline">
                    <MessageSquare size={14} className="mr-2" />
                    Send Message
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar size={20} />
                Subcontractor Work Schedule
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {schedules.map(schedule => (
                  <div key={schedule.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold">{schedule.subcontractor}</h3>
                        <p className="text-sm text-gray-600">{schedule.task}</p>
                      </div>
                      {getStatusBadge(schedule.status)}
                    </div>

                    <div className="grid grid-cols-4 gap-4 text-sm mb-3">
                      <div>
                        <span className="text-gray-600">Project</span>
                        <p className="font-medium">{schedule.project}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Start</span>
                        <p className="font-medium">{schedule.startDate}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">End</span>
                        <p className="font-medium">{schedule.endDate}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Workers</span>
                        <p className="font-medium">{schedule.workers} people</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">Edit</Button>
                      <Button size="sm" variant="outline">Confirm</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText size={20} />
                Subcontractor Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  {
                    name: 'ABC Electrical - Insurance Certificate',
                    expiry: '2026-08-15',
                    sub: 'ABC Electrical Inc',
                    status: 'valid',
                  },
                  {
                    name: 'XYZ Plumbing - License',
                    expiry: '2026-12-31',
                    sub: 'XYZ Plumbing Services',
                    status: 'valid',
                  },
                  {
                    name: 'General Framing - Safety Certification',
                    expiry: '2026-05-30',
                    sub: 'General Framing LLC',
                    status: 'valid',
                  },
                ].map((doc, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-semibold text-sm">{doc.name}</p>
                      <p className="text-xs text-gray-600 mt-1">{doc.sub}</p>
                    </div>
                    <div className="text-right">
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle2 size={12} className="mr-1" />
                        Valid
                      </Badge>
                      <p className="text-xs text-gray-600 mt-1">Expires {doc.expiry}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="messages" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare size={20} />
                Communication Log
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {messages.map(msg => (
                  <div
                    key={msg.id}
                    className={`p-3 border rounded-lg transition ${
                      !msg.read ? 'bg-blue-50 border-blue-300' : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <p className="font-semibold text-sm">{msg.from}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-600">{msg.date}</span>
                        {!msg.read && (
                          <Badge className="bg-blue-600 text-white text-xs">New</Badge>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-700">{msg.message}</p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-2"
                    >
                      Reply
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Send New Message</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Recipient</label>
                <select className="mt-1 w-full px-3 py-2 border rounded-lg">
                  <option>Select subcontractor...</option>
                  {subcontractors.map(sub => (
                    <option key={sub.id}>{sub.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Message</label>
                <textarea
                  placeholder="Type your message..."
                  className="mt-1 w-full px-3 py-2 border rounded-lg h-24"
                />
              </div>
              <Button className="w-full">
                <MessageSquare size={16} className="mr-2" />
                Send Message
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {selectedSubcontractor && (
        <Card className="border-2 border-blue-500">
          <CardHeader>
            <CardTitle>{selectedSubcontractor.name}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-3">Contact Information</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-600">Contact Person:</span>
                  <p className="font-medium">{selectedSubcontractor.contactPerson}</p>
                </div>
                <div>
                  <span className="text-gray-600">Email:</span>
                  <p className="font-medium text-blue-600">{selectedSubcontractor.email}</p>
                </div>
                <div>
                  <span className="text-gray-600">Phone:</span>
                  <p className="font-medium">{selectedSubcontractor.phone}</p>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Performance</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Rating</p>
                  <p className="text-xl font-bold">{selectedSubcontractor.rating}★</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Completed Projects</p>
                  <p className="text-xl font-bold">{selectedSubcontractor.completedProjects}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
