import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Trash2, Edit2, MessageSquare, CheckCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';

// RFI Component
export function RFIManager() {
  const [rfis, setRfis] = useState([]);
  const [showAddRFI, setShowAddRFI] = useState(false);
  const [editingRFI, setEditingRFI] = useState(null);
  const [selectedRFI, setSelectedRFI] = useState(null);
  const [replyText, setReplyText] = useState('');

  const [newRFI, setNewRFI] = useState({
    title: '',
    question: '',
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    submittalId: '',
    assignedTo: '',
    status: 'open',
    priority: 'medium'
  });

  const priorities = ['low', 'medium', 'high', 'critical'];
  const statuses = ['open', 'in-review', 'answered', 'closed'];

  const addRFI = () => {
    if (!newRFI.title || !newRFI.question) {
      toast.error('Please fill in title and question');
      return;
    }
    setRfis([...rfis, {
      ...newRFI,
      id: Date.now(),
      createdDate: new Date().toISOString().split('T')[0],
      replies: []
    }]);
    setNewRFI({
      title: '',
      question: '',
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      submittalId: '',
      assignedTo: '',
      status: 'open',
      priority: 'medium'
    });
    setShowAddRFI(false);
    toast.success('RFI created');
  };

  const addReply = (rfiId) => {
    if (!replyText.trim()) return;

    setRfis(rfis.map(r =>
      r.id === rfiId
        ? {
          ...r,
          replies: [...(r.replies || []), {
            id: Date.now(),
            text: replyText,
            date: new Date().toISOString(),
            from: 'You'
          }]
        }
        : r
    ));
    setReplyText('');
    toast.success('Reply added');
  };

  const updateRFI = (id, status) => {
    setRfis(rfis.map(r => r.id === id ? { ...r, status } : r));
    toast.success('RFI updated');
  };

  const deleteRFI = (id) => {
    setRfis(rfis.filter(r => r.id !== id));
    toast.success('RFI deleted');
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'bg-blue-100 text-blue-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800'
    };
    return colors[priority] || 'bg-slate-100';
  };

  const getStatusIcon = (status) => {
    if (status === 'answered') return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (status === 'open') return <Clock className="h-4 w-4 text-orange-600" />;
    return null;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>RFI (Requests for Information)</CardTitle>
        <Dialog open={showAddRFI} onOpenChange={setShowAddRFI}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New RFI
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create RFI</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="RFI Title"
                value={newRFI.title}
                onChange={(e) => setNewRFI({ ...newRFI, title: e.target.value })}
              />
              <Textarea
                placeholder="Detailed question"
                value={newRFI.question}
                onChange={(e) => setNewRFI({ ...newRFI, question: e.target.value })}
                className="min-h-[120px]"
              />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Priority</label>
                  <select
                    className="w-full border rounded px-3 py-2"
                    value={newRFI.priority}
                    onChange={(e) => setNewRFI({ ...newRFI, priority: e.target.value })}
                  >
                    {priorities.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Due Date</label>
                  <Input
                    type="date"
                    value={newRFI.dueDate}
                    onChange={(e) => setNewRFI({ ...newRFI, dueDate: e.target.value })}
                  />
                </div>
              </div>
              <Input
                placeholder="Assigned to"
                value={newRFI.assignedTo}
                onChange={(e) => setNewRFI({ ...newRFI, assignedTo: e.target.value })}
              />
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowAddRFI(false)}>Cancel</Button>
                <Button onClick={addRFI}>Create RFI</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>

      <CardContent>
        {rfis.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            No RFIs yet. Create one to get answers from the design team.
          </div>
        ) : (
          <div className="space-y-3">
            {rfis.map(rfi => (
              <div key={rfi.id} className="border rounded-lg p-4 hover:bg-slate-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-sm">{rfi.title}</h3>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor(rfi.priority)}`}>
                        {rfi.priority}
                      </span>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(rfi.status)}
                        <span className="text-xs text-slate-600">{rfi.status}</span>
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 mb-2">{rfi.question}</p>
                    <p className="text-xs text-slate-500">
                      Created: {rfi.createdDate} • Due: {rfi.dueDate}
                      {rfi.assignedTo && ` • Assigned to: ${rfi.assignedTo}`}
                    </p>
                    {rfi.replies && rfi.replies.length > 0 && (
                      <p className="text-xs text-blue-600 mt-1">
                        {rfi.replies.length} replies
                      </p>
                    )}
                  </div>

                  <div className="flex gap-1 flex-shrink-0">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedRFI(rfi)}
                        >
                          <MessageSquare className="h-3 w-3" />
                        </Button>
                      </DialogTrigger>
                      {selectedRFI?.id === rfi.id && (
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>{rfi.title}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 max-h-[500px] overflow-y-auto">
                            <div className="bg-slate-50 p-3 rounded">
                              <p className="text-sm">{rfi.question}</p>
                            </div>

                            {rfi.replies && rfi.replies.map(reply => (
                              <div key={reply.id} className="bg-blue-50 p-3 rounded">
                                <p className="text-xs font-medium text-slate-600 mb-1">
                                  {reply.from} • {new Date(reply.date).toLocaleDateString()}
                                </p>
                                <p className="text-sm">{reply.text}</p>
                              </div>
                            ))}

                            <div className="space-y-2">
                              <Textarea
                                placeholder="Add a reply..."
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                className="min-h-[80px]"
                              />
                              <Button
                                onClick={() => addReply(rfi.id)}
                                className="w-full"
                              >
                                Add Reply
                              </Button>
                            </div>

                            <div className="pt-4 border-t space-y-2">
                              <select
                                className="w-full border rounded px-3 py-2 text-sm"
                                value={rfi.status}
                                onChange={(e) => updateRFI(rfi.id, e.target.value)}
                              >
                                {statuses.map(s => (
                                  <option key={s} value={s}>{s}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </DialogContent>
                      )}
                    </Dialog>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteRFI(rfi.id)}
                      className="text-red-600"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Submittal Tracker Component
export function SubmittalTracker() {
  const [submittals, setSubmittals] = useState([]);
  const [showAddSubmittal, setShowAddSubmittal] = useState(false);

  const [newSubmittal, setNewSubmittal] = useState({
    title: '',
    type: 'Shop Drawing',
    dueDate: new Date().toISOString().split('T')[0],
    vendor: '',
    description: '',
    status: 'pending'
  });

  const types = ['Shop Drawing', 'Material', 'Product Data', 'Test Report', 'Certificate', 'Other'];
  const statuses = ['pending', 'submitted', 'approved', 'approved-with-changes', 'rejected'];

  const addSubmittal = () => {
    if (!newSubmittal.title) {
      toast.error('Please enter submittal title');
      return;
    }
    setSubmittals([...submittals, {
      ...newSubmittal,
      id: Date.now(),
      createdDate: new Date().toISOString().split('T')[0],
      submittedDate: null,
      approvedDate: null
    }]);
    setNewSubmittal({
      title: '',
      type: 'Shop Drawing',
      dueDate: new Date().toISOString().split('T')[0],
      vendor: '',
      description: '',
      status: 'pending'
    });
    setShowAddSubmittal(false);
    toast.success('Submittal created');
  };

  const updateSubmittal = (id, status, updates = {}) => {
    setSubmittals(submittals.map(s =>
      s.id === id
        ? {
          ...s,
          status,
          ...(status === 'submitted' && !s.submittedDate && { submittedDate: new Date().toISOString().split('T')[0] }),
          ...(status === 'approved' && !s.approvedDate && { approvedDate: new Date().toISOString().split('T')[0] }),
          ...updates
        }
        : s
    ));
    toast.success(`Submittal marked as ${status}`);
  };

  const deleteSubmittal = (id) => {
    setSubmittals(submittals.filter(s => s.id !== id));
    toast.success('Submittal deleted');
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-slate-100 text-slate-800',
      submitted: 'bg-blue-100 text-blue-800',
      approved: 'bg-green-100 text-green-800',
      'approved-with-changes': 'bg-yellow-100 text-yellow-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-slate-100';
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Submittal Tracking</CardTitle>
        <Dialog open={showAddSubmittal} onOpenChange={setShowAddSubmittal}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Submittal
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Submittal</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Submittal title"
                value={newSubmittal.title}
                onChange={(e) => setNewSubmittal({ ...newSubmittal, title: e.target.value })}
              />
              <select
                className="w-full border rounded px-3 py-2"
                value={newSubmittal.type}
                onChange={(e) => setNewSubmittal({ ...newSubmittal, type: e.target.value })}
              >
                {types.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <Input
                placeholder="Vendor/Manufacturer"
                value={newSubmittal.vendor}
                onChange={(e) => setNewSubmittal({ ...newSubmittal, vendor: e.target.value })}
              />
              <Input
                type="date"
                value={newSubmittal.dueDate}
                onChange={(e) => setNewSubmittal({ ...newSubmittal, dueDate: e.target.value })}
              />
              <Textarea
                placeholder="Description/Specifications"
                value={newSubmittal.description}
                onChange={(e) => setNewSubmittal({ ...newSubmittal, description: e.target.value })}
              />
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowAddSubmittal(false)}>Cancel</Button>
                <Button onClick={addSubmittal}>Create Submittal</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>

      <CardContent>
        {submittals.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            No submittals yet. Create one to track shop drawings and product data.
          </div>
        ) : (
          <div className="space-y-3">
            {submittals.map(submittal => (
              <div key={submittal.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-bold text-sm">{submittal.title}</h3>
                    <p className="text-xs text-slate-600 mt-1">
                      Type: {submittal.type} • Vendor: {submittal.vendor || 'N/A'}
                    </p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(submittal.status)}`}>
                    {submittal.status}
                  </span>
                </div>

                {submittal.description && (
                  <p className="text-sm text-slate-600 mb-2">{submittal.description}</p>
                )}

                <p className="text-xs text-slate-500 mb-3">
                  Due: {submittal.dueDate}
                  {submittal.submittedDate && ` • Submitted: ${submittal.submittedDate}`}
                  {submittal.approvedDate && ` • Approved: ${submittal.approvedDate}`}
                </p>

                <div className="flex gap-2 flex-wrap">
                  {submittal.status === 'pending' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateSubmittal(submittal.id, 'submitted')}
                    >
                      Mark Submitted
                    </Button>
                  )}
                  {submittal.status === 'submitted' && (
                    <>
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => updateSubmittal(submittal.id, 'approved')}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        className="bg-yellow-600 hover:bg-yellow-700"
                        onClick={() => updateSubmittal(submittal.id, 'approved-with-changes')}
                      >
                        Approve w/ Changes
                      </Button>
                      <Button
                        size="sm"
                        className="bg-red-600 hover:bg-red-700"
                        onClick={() => updateSubmittal(submittal.id, 'rejected')}
                      >
                        Reject
                      </Button>
                    </>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteSubmittal(submittal.id)}
                    className="text-red-600 ml-auto"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
