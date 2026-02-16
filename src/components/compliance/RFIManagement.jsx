import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Clock, CheckCircle2, AlertCircle, MessageSquare } from 'lucide-react';

export default function RFIManagement() {
  const [rfis, setRfis] = useState([
    {
      id: 1,
      number: 'RFI-2026-001',
      title: 'Clarification on electrical outlet locations in Master Bedroom',
      category: 'Electrical',
      description: 'Architectural plans show conflicting outlet locations. Need clarification from design team.',
      submittedBy: 'John Smith',
      submittedDate: '2026-02-10',
      dueDate: '2026-02-17',
      status: 'pending',
      priority: 'high',
      discipline: 'Electrical',
      response: null,
      estimatedImpact: 'May delay framing if not resolved quickly',
    },
    {
      id: 2,
      number: 'RFI-2026-002',
      title: 'Material specification for kitchen backsplash tile',
      category: 'Finishes',
      description: 'Need to confirm tile material, color, and grout specifications.',
      submittedBy: 'Sarah Johnson',
      submittedDate: '2026-02-08',
      dueDate: '2026-02-15',
      status: 'answered',
      priority: 'medium',
      discipline: 'Finishes',
      response: 'Client approved: Porcelain tile, 4x4", Tile color code #2045, light grey grout.',
      responseDate: '2026-02-13',
      respondedBy: 'Architect',
      estimatedImpact: 'Requires material ordering',
    },
    {
      id: 3,
      number: 'RFI-2026-003',
      title: 'HVAC ductwork routing through structural beam',
      category: 'HVAC',
      description: 'HVAC ductwork routing conflicts with primary structural beam. Require alternate routing approval.',
      submittedBy: 'Mike Davis',
      submittedDate: '2026-02-05',
      dueDate: '2026-02-12',
      status: 'answered',
      priority: 'critical',
      discipline: 'HVAC',
      response: 'Approved: Route ductwork 2 feet north of beam per revised MEP drawing attached.',
      responseDate: '2026-02-11',
      respondedBy: 'MEP Engineer',
      estimatedImpact: 'Construction schedule impact: +3 days',
    },
    {
      id: 4,
      number: 'RFI-2026-004',
      title: 'Confirmation of concrete strength requirements',
      category: 'Structural',
      description: 'Need to confirm concrete strength (PSI) for foundation and floor slab.',
      submittedBy: 'Emily Wilson',
      submittedDate: '2026-02-12',
      dueDate: '2026-02-19',
      status: 'pending',
      priority: 'high',
      discipline: 'Structural',
      response: null,
      estimatedImpact: 'Critical for concrete pour scheduling',
    },
  ]);

  const [selectedRFI, setSelectedRFI] = useState(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newRFI, setNewRFI] = useState({
    title: '',
    description: '',
    category: 'General',
    priority: 'medium',
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 flex items-center gap-1">
          <Clock size={12} /> Pending
        </Badge>;
      case 'answered':
        return <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
          <CheckCircle2 size={12} /> Answered
        </Badge>;
      case 'closed':
        return <Badge variant="outline">Closed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status) => {
    return status === 'pending' ? 'border-yellow-300' : status === 'answered' ? 'border-green-300' : 'border-gray-300';
  };

  const overduePending = rfis.filter(
    r => r.status === 'pending' && new Date(r.dueDate) < new Date()
  );

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">RFI Management</h1>
          <p className="text-gray-600 mt-2">
            Track questions and answers with the design team and manage project clarifications.
          </p>
        </div>
        <Button
          onClick={() => setShowNewForm(!showNewForm)}
          size="lg"
          className={showNewForm ? 'bg-gray-600' : ''}
        >
          <Plus size={18} className="mr-2" />
          {showNewForm ? 'Cancel' : 'New RFI'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total RFIs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rfis.length}</div>
            <p className="text-xs text-gray-600 mt-2">All RFIs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {rfis.filter(r => r.status === 'pending').length}
            </div>
            <p className="text-xs text-gray-600 mt-2">Awaiting response</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Answered</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {rfis.filter(r => r.status === 'answered').length}
            </div>
            <p className="text-xs text-gray-600 mt-2">Responses received</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Critical</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {rfis.filter(r => r.priority === 'critical').length}
            </div>
            <p className="text-xs text-gray-600 mt-2">High priority</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{overduePending.length}</div>
            <p className="text-xs text-gray-600 mt-2">Past due date</p>
          </CardContent>
        </Card>
      </div>

      {overduePending.length > 0 && (
        <Card className="border-red-300 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="text-red-600 flex-shrink-0 mt-1" size={20} />
              <div>
                <p className="font-semibold text-red-900">
                  {overduePending.length} RFI{overduePending.length !== 1 ? 's' : ''} overdue
                </p>
                <p className="text-sm text-red-700 mt-1">
                  {overduePending.map(r => r.number).join(', ')} require immediate attention
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {showNewForm && (
        <Card className="border-2 border-blue-500">
          <CardHeader>
            <CardTitle>Create New RFI</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Title</label>
              <input
                type="text"
                placeholder="Brief description of the question..."
                value={newRFI.title}
                onChange={(e) => setNewRFI(prev => ({ ...prev, title: e.target.value }))}
                className="mt-1 w-full px-3 py-2 border rounded-lg"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Description</label>
              <textarea
                placeholder="Detailed explanation of the issue or question..."
                value={newRFI.description}
                onChange={(e) => setNewRFI(prev => ({ ...prev, description: e.target.value }))}
                className="mt-1 w-full px-3 py-2 border rounded-lg h-24"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Category</label>
                <select
                  value={newRFI.category}
                  onChange={(e) => setNewRFI(prev => ({ ...prev, category: e.target.value }))}
                  className="mt-1 w-full px-3 py-2 border rounded-lg"
                >
                  <option>General</option>
                  <option>Electrical</option>
                  <option>Plumbing</option>
                  <option>HVAC</option>
                  <option>Structural</option>
                  <option>Finishes</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">Priority</label>
                <select
                  value={newRFI.priority}
                  onChange={(e) => setNewRFI(prev => ({ ...prev, priority: e.target.value }))}
                  className="mt-1 w-full px-3 py-2 border rounded-lg"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={() => setShowNewForm(false)} className="flex-1">
                Submit RFI
              </Button>
              <Button
                onClick={() => setShowNewForm(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All RFIs</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="answered">Answered</TabsTrigger>
          <TabsTrigger value="critical">Critical</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6">
          <div className="space-y-4">
            {rfis.map(rfi => (
              <Card
                key={rfi.id}
                className={`cursor-pointer transition border-2 ${
                  selectedRFI?.id === rfi.id ? 'ring-2 ring-blue-500 border-blue-500' : getStatusColor(rfi.status)
                }`}
                onClick={() => setSelectedRFI(rfi)}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-blue-600">{rfi.number}</span>
                        {getStatusBadge(rfi.status)}
                        <Badge className={getPriorityColor(rfi.priority)}>
                          {rfi.priority.charAt(0).toUpperCase() + rfi.priority.slice(1)}
                        </Badge>
                      </div>
                      <h3 className="font-semibold text-lg">{rfi.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{rfi.description}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4 text-sm mb-3 pb-3 border-t">
                    <div>
                      <span className="text-gray-600">Category</span>
                      <p className="font-medium">{rfi.category}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Submitted</span>
                      <p className="font-medium">{rfi.submittedDate}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Due Date</span>
                      <p className={`font-medium ${new Date(rfi.dueDate) < new Date() && rfi.status === 'pending' ? 'text-red-600' : ''}`}>
                        {rfi.dueDate}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600">Submitted By</span>
                      <p className="font-medium">{rfi.submittedBy}</p>
                    </div>
                  </div>

                  {rfi.response && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded text-sm">
                      <p className="font-semibold text-green-900 mb-1">Response:</p>
                      <p className="text-green-800">{rfi.response}</p>
                      <p className="text-xs text-green-700 mt-2">
                        Responded by {rfi.respondedBy} on {rfi.responseDate}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="pending" className="space-y-6">
          <div className="space-y-4">
            {rfis
              .filter(r => r.status === 'pending')
              .map(rfi => (
                <Card key={rfi.id} className="border-yellow-300">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold">{rfi.number}</span>
                          <Badge className={getPriorityColor(rfi.priority)}>
                            {rfi.priority}
                          </Badge>
                        </div>
                        <h3 className="font-semibold">{rfi.title}</h3>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 mb-3">{rfi.description}</p>
                    <p className="text-xs text-orange-600 mb-3">
                      ⚠ Due: {rfi.dueDate} ({Math.ceil((new Date(rfi.dueDate) - new Date()) / (1000 * 60 * 60 * 24))} days remaining)
                    </p>
                    <Button size="sm" variant="outline" className="w-full">
                      <MessageSquare size={14} className="mr-2" />
                      Follow Up
                    </Button>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="answered" className="space-y-6">
          <div className="space-y-4">
            {rfis
              .filter(r => r.status === 'answered')
              .map(rfi => (
                <Card key={rfi.id} className="border-green-300">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold">{rfi.number}</span>
                          {getStatusBadge(rfi.status)}
                        </div>
                        <h3 className="font-semibold">{rfi.title}</h3>
                      </div>
                    </div>
                    <div className="p-3 bg-green-50 border border-green-200 rounded">
                      <p className="font-semibold text-green-900 text-sm mb-1">Response:</p>
                      <p className="text-sm text-green-800">{rfi.response}</p>
                      <p className="text-xs text-green-700 mt-2">
                        Responded {rfi.responseDate}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="critical" className="space-y-6">
          <div className="space-y-4">
            {rfis
              .filter(r => r.priority === 'critical')
              .map(rfi => (
                <Card key={rfi.id} className="border-red-300 bg-red-50">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <AlertCircle className="text-red-600" size={18} />
                          <span className="font-bold text-red-600">{rfi.number}</span>
                          {getStatusBadge(rfi.status)}
                        </div>
                        <h3 className="font-semibold text-red-900">{rfi.title}</h3>
                      </div>
                    </div>
                    <p className="text-sm text-red-800 mb-2">{rfi.description}</p>
                    <p className="text-sm text-red-700 font-medium mb-3">
                      Impact: {rfi.estimatedImpact}
                    </p>
                    <Button size="sm" className="w-full">
                      <MessageSquare size={14} className="mr-2" />
                      Urgent Follow Up
                    </Button>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>
      </Tabs>

      {selectedRFI && (
        <Card className="border-2 border-blue-500">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{selectedRFI.number}</CardTitle>
                <CardDescription>{selectedRFI.title}</CardDescription>
              </div>
              <div className="flex gap-2">
                {getStatusBadge(selectedRFI.status)}
                <Badge className={getPriorityColor(selectedRFI.priority)}>
                  {selectedRFI.priority}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Category</label>
                <p className="mt-1 font-semibold">{selectedRFI.category}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Submitted By</label>
                <p className="mt-1 font-semibold">{selectedRFI.submittedBy}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Submitted Date</label>
                <p className="mt-1 font-semibold">{selectedRFI.submittedDate}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Due Date</label>
                <p className="mt-1 font-semibold">{selectedRFI.dueDate}</p>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600">Description</label>
              <p className="mt-1">{selectedRFI.description}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600">Estimated Impact</label>
              <p className="mt-1 text-sm">{selectedRFI.estimatedImpact}</p>
            </div>

            {selectedRFI.response && (
              <div className="p-4 bg-green-50 border border-green-200 rounded">
                <label className="text-sm font-medium text-green-900">Response</label>
                <p className="mt-2 text-green-800">{selectedRFI.response}</p>
                <p className="text-xs text-green-700 mt-2">
                  Responded by {selectedRFI.respondedBy} on {selectedRFI.responseDate}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
