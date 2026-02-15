import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Download, Eye, Send, CheckCircle, AlertCircle, Calendar, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

export function ClientPortal() {
  const [clients, setClients] = useState([
    {
      id: 1,
      name: 'Downtown Office Tower',
      clientName: 'ABC Corporation',
      status: 'In Progress',
      progress: 65,
      completionDate: '2024-06-30',
      budget: 2500000,
      spent: 1625000
    },
    {
      id: 2,
      name: 'Retail Store Build-out',
      clientName: 'XYZ Retail',
      status: 'Completed',
      progress: 100,
      completionDate: '2024-02-10',
      budget: 450000,
      spent: 445000
    }
  ]);

  const [selectedProject, setSelectedProject] = useState(clients[0]);
  const [clientDocuments, setClientDocuments] = useState([
    {
      id: 1,
      name: 'Progress Photos - Week 1',
      date: '2024-02-15',
      type: 'Images',
      downloads: 5
    },
    {
      id: 2,
      name: 'Construction Schedule',
      date: '2024-02-10',
      type: 'PDF',
      downloads: 12
    },
    {
      id: 3,
      name: 'Budget Summary Q1',
      date: '2024-02-05',
      type: 'Excel',
      downloads: 8
    }
  ]);

  const [clientMessages, setClientMessages] = useState([
    {
      id: 1,
      from: 'John Smith (You)',
      message: 'We\'ve completed the foundation work ahead of schedule!',
      date: '2024-02-14',
      isFromContractor: true
    },
    {
      id: 2,
      from: 'Client Contacts',
      message: 'That\'s great news! When can we schedule a site visit?',
      date: '2024-02-14',
      isFromContractor: false
    }
  ]);

  const [newMessage, setNewMessage] = useState('');
  const [changeOrders, setChangeOrders] = useState([
    {
      id: 1,
      number: 'CO-001',
      description: 'Additional landscaping work',
      amount: 25000,
      status: 'Pending Approval'
    },
    {
      id: 2,
      number: 'CO-002',
      description: 'Extra parking spaces',
      amount: 40000,
      status: 'Approved'
    }
  ]);

  const sendMessage = () => {
    if (!newMessage.trim()) {
      toast.error('Message cannot be empty');
      return;
    }

    setClientMessages([...clientMessages, {
      id: clientMessages.length + 1,
      from: 'John Smith (You)',
      message: newMessage,
      date: new Date().toLocaleDateString(),
      isFromContractor: true
    }]);

    setNewMessage('');
    toast.success('Message sent to client');
  };

  const downloadDocument = (docId) => {
    const doc = clientDocuments.find(d => d.id === docId);
    toast.success(`Downloading ${doc.name}`);
  };

  const approveChangeOrder = (coId) => {
    setChangeOrders(changeOrders.map(co =>
      co.id === coId ? { ...co, status: 'Approved' } : co
    ));
    toast.success('Change order approved');
  };

  const budgetUsed = (selectedProject.spent / selectedProject.budget * 100).toFixed(1);

  return (
    <div className="space-y-4">
      {/* Project Selection */}
      <div className="flex gap-2 overflow-x-auto">
        {clients.map(client => (
          <Button
            key={client.id}
            variant={selectedProject?.id === client.id ? 'default' : 'outline'}
            onClick={() => setSelectedProject(client)}
            className="whitespace-nowrap"
          >
            {client.name}
          </Button>
        ))}
      </div>

      {selectedProject && (
        <>
          {/* Project Overview */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>{selectedProject.name}</CardTitle>
                  <p className="text-sm text-slate-600 mt-1">Client: {selectedProject.clientName}</p>
                </div>
                <span className={`px-3 py-1 rounded text-sm font-medium ${
                  selectedProject.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  {selectedProject.status}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Progress */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium">Project Progress</p>
                  <p className="text-sm font-bold">{selectedProject.progress}%</p>
                </div>
                <div className="w-full bg-slate-200 h-3 rounded overflow-hidden">
                  <div
                    className="bg-blue-500 h-full transition-all"
                    style={{ width: `${selectedProject.progress}%` }}
                  />
                </div>
              </div>

              {/* Key Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-slate-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-600">Expected Completion</p>
                    <p className="text-sm font-bold">{selectedProject.completionDate}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <DollarSign className="h-5 w-5 text-slate-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-600">Budget Status</p>
                    <p className="text-sm font-bold">{budgetUsed}% Used</p>
                  </div>
                </div>
              </div>

              {/* Budget Breakdown */}
              <div className="p-3 bg-slate-50 rounded">
                <p className="text-sm font-medium mb-2">Budget Summary</p>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Total Budget:</span>
                    <span>${selectedProject.budget.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Amount Spent:</span>
                    <span>${selectedProject.spent.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between font-bold">
                    <span>Remaining:</span>
                    <span>${(selectedProject.budget - selectedProject.spent).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Project Photos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Project Gallery</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                  <div key={i} className="aspect-square bg-slate-200 rounded flex items-center justify-center text-slate-400">
                    <Eye className="h-8 w-8" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Documents */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Project Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {clientDocuments.map(doc => (
                  <div key={doc.id} className="flex items-center justify-between p-3 border rounded hover:bg-slate-50">
                    <div>
                      <p className="font-medium text-sm">{doc.name}</p>
                      <p className="text-xs text-slate-600">{doc.type} • {doc.date}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-600">{doc.downloads} downloads</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => downloadDocument(doc.id)}
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Change Orders */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Change Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {changeOrders.map(co => (
                  <div key={co.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-bold">{co.number}: {co.description}</p>
                        <p className="text-sm text-slate-600 mt-1">${co.amount.toLocaleString()}</p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        co.status === 'Approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {co.status}
                      </span>
                    </div>

                    {co.status === 'Pending Approval' && (
                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={() => approveChangeOrder(co.id)}
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Approve
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1">
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Communication */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Messages</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {clientMessages.map(msg => (
                  <div key={msg.id} className={`p-3 rounded ${
                    msg.isFromContractor ? 'bg-blue-50' : 'bg-slate-50'
                  }`}>
                    <div className="flex items-start justify-between mb-1">
                      <p className="font-medium text-sm">{msg.from}</p>
                      <p className="text-xs text-slate-600">{msg.date}</p>
                    </div>
                    <p className="text-sm text-slate-700">{msg.message}</p>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="Send message to client..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                />
                <Button onClick={sendMessage} size="sm">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Milestones */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Project Milestones</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { name: 'Foundation Complete', date: '2024-01-15', status: 'completed' },
                  { name: 'Framing Complete', date: '2024-03-15', status: 'in-progress' },
                  { name: 'Final Inspection', date: '2024-06-01', status: 'pending' },
                  { name: 'Project Handover', date: '2024-06-30', status: 'pending' }
                ].map((milestone, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full flex-shrink-0 ${
                      milestone.status === 'completed' ? 'bg-green-500' :
                      milestone.status === 'in-progress' ? 'bg-blue-500' :
                      'bg-slate-300'
                    }`} />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{milestone.name}</p>
                      <p className="text-xs text-slate-600">{milestone.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
