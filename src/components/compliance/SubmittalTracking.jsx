import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, FileText, CheckCircle2, AlertCircle, Clock, Upload } from 'lucide-react';

export default function SubmittalTracking() {
  const [submittals, setSubmittals] = useState([
    {
      id: 1,
      number: 'SUB-001',
      title: 'Electrical Panel Schedule and Specifications',
      submittedBy: 'ABC Electrical Inc',
      submittedDate: '2026-02-10',
      description: 'Main electrical panel specifications and circuit schedule',
      status: 'approved',
      approvalDate: '2026-02-12',
      approvedBy: 'John Smith',
      notes: 'Approved as submitted',
      attachments: ['electrical_panel_spec.pdf', 'circuit_schedule.xlsx'],
      dueDate: '2026-02-15',
      revisions: 0,
    },
    {
      id: 2,
      number: 'SUB-002',
      title: 'Plumbing Fixture Schedule',
      submittedBy: 'XYZ Plumbing Services',
      submittedDate: '2026-02-08',
      description: 'Schedule of all plumbing fixtures, finishes, and installation details',
      status: 'revision-required',
      revisionNotes: 'Please update fixture selections to match product codes from client approval',
      approvalDate: null,
      approvedBy: null,
      notes: 'Waiting for revision',
      attachments: ['fixture_schedule.pdf'],
      dueDate: '2026-02-18',
      revisions: 1,
    },
    {
      id: 3,
      number: 'SUB-003',
      title: 'HVAC Equipment Specifications',
      submittedBy: 'Climate Control Systems',
      submittedDate: '2026-02-12',
      description: 'HVAC unit specs, ductwork sizing, and installation procedures',
      status: 'pending-review',
      approvalDate: null,
      approvedBy: null,
      notes: 'Under review by MEP engineer',
      attachments: ['hvac_specs.pdf', 'ductwork_drawing.dwg'],
      dueDate: '2026-02-19',
      revisions: 0,
    },
    {
      id: 4,
      number: 'SUB-004',
      title: 'Structural Steel Detailing',
      submittedBy: 'Steel Solutions',
      submittedDate: '2026-02-14',
      description: 'Structural steel connection details and fabrication drawings',
      status: 'pending-review',
      approvalDate: null,
      approvedBy: null,
      notes: 'Awaiting structural engineer review',
      attachments: ['steel_details.dwg'],
      dueDate: '2026-02-21',
      revisions: 0,
    },
  ]);

  const [selectedSubmittal, setSelectedSubmittal] = useState(null);
  const [showNewForm, setShowNewForm] = useState(false);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
          <CheckCircle2 size={12} /> Approved
        </Badge>;
      case 'pending-review':
        return <Badge className="bg-blue-100 text-blue-800 flex items-center gap-1">
          <Clock size={12} /> Pending Review
        </Badge>;
      case 'revision-required':
        return <Badge className="bg-orange-100 text-orange-800 flex items-center gap-1">
          <AlertCircle size={12} /> Revision Required
        </Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'border-green-300';
      case 'pending-review':
        return 'border-blue-300';
      case 'revision-required':
        return 'border-orange-300';
      default:
        return 'border-gray-300';
    }
  };

  const daysOverdue = (dueDate) => {
    const due = new Date(dueDate);
    const today = new Date();
    const diff = Math.ceil((today - due) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : null;
  };

  const overduePending = submittals.filter(
    s => s.status === 'pending-review' && daysOverdue(s.dueDate)
  );

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Submittal Tracking</h1>
          <p className="text-gray-600 mt-2">
            Manage review and approval of shop drawings, specifications, and product data.
          </p>
        </div>
        <Button
          onClick={() => setShowNewForm(!showNewForm)}
          size="lg"
          className={showNewForm ? 'bg-gray-600' : ''}
        >
          <Plus size={18} className="mr-2" />
          {showNewForm ? 'Cancel' : 'New Submittal'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Submittals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{submittals.length}</div>
            <p className="text-xs text-gray-600 mt-2">All submittals</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {submittals.filter(s => s.status === 'approved').length}
            </div>
            <p className="text-xs text-gray-600 mt-2">Approved submittals</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {submittals.filter(s => s.status === 'pending-review').length}
            </div>
            <p className="text-xs text-gray-600 mt-2">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Revision Needed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {submittals.filter(s => s.status === 'revision-required').length}
            </div>
            <p className="text-xs text-gray-600 mt-2">Requiring changes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{overduePending.length}</div>
            <p className="text-xs text-gray-600 mt-2">Past review due date</p>
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
                  {overduePending.length} submittal{overduePending.length !== 1 ? 's' : ''} overdue for review
                </p>
                <p className="text-sm text-red-700 mt-1">
                  {overduePending.map(s => `${s.number} (${daysOverdue(s.dueDate)} days)`).join(', ')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {showNewForm && (
        <Card className="border-2 border-blue-500">
          <CardHeader>
            <CardTitle>Submit New Submittal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Submittal Title</label>
              <input
                type="text"
                placeholder="e.g., Electrical Panel Schedule"
                className="mt-1 w-full px-3 py-2 border rounded-lg"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Submitted By</label>
              <input
                type="text"
                placeholder="Subcontractor or supplier name"
                className="mt-1 w-full px-3 py-2 border rounded-lg"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Description</label>
              <textarea
                placeholder="Describe the contents of this submittal..."
                className="mt-1 w-full px-3 py-2 border rounded-lg h-20"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Attach Files</label>
              <div className="mt-2 border-2 border-dashed rounded-lg p-4 text-center">
                <Upload className="mx-auto text-gray-400 mb-2" size={32} />
                <p className="text-sm text-gray-600">Drag files here or click to select</p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={() => setShowNewForm(false)} className="flex-1">
                Submit Submittal
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
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="revision">Revision</TabsTrigger>
          <TabsTrigger value="workflow">Workflow</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6">
          <div className="space-y-4">
            {submittals.map(submittal => (
              <Card
                key={submittal.id}
                className={`cursor-pointer transition border-2 ${
                  selectedSubmittal?.id === submittal.id
                    ? 'ring-2 ring-blue-500 border-blue-500'
                    : getStatusColor(submittal.status)
                }`}
                onClick={() => setSelectedSubmittal(submittal)}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-blue-600">{submittal.number}</span>
                        {getStatusBadge(submittal.status)}
                      </div>
                      <h3 className="font-semibold text-lg">{submittal.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{submittal.description}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-5 gap-4 text-sm mb-3 pb-3 border-t">
                    <div>
                      <span className="text-gray-600">Submitted By</span>
                      <p className="font-medium">{submittal.submittedBy}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Submitted</span>
                      <p className="font-medium">{submittal.submittedDate}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Due Date</span>
                      <p className={`font-medium ${daysOverdue(submittal.dueDate) ? 'text-red-600' : ''}`}>
                        {submittal.dueDate}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600">Revisions</span>
                      <p className="font-medium">{submittal.revisions}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Attachments</span>
                      <p className="font-medium">{submittal.attachments.length}</p>
                    </div>
                  </div>

                  {submittal.status === 'revision-required' && (
                    <div className="p-3 bg-orange-50 border border-orange-200 rounded text-sm">
                      <p className="font-semibold text-orange-900 mb-1">Revision Required:</p>
                      <p className="text-orange-800">{submittal.revisionNotes}</p>
                    </div>
                  )}

                  {submittal.status === 'approved' && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded text-sm">
                      <p className="font-semibold text-green-900">
                        ✓ Approved by {submittal.approvedBy} on {submittal.approvalDate}
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
            {submittals
              .filter(s => s.status === 'pending-review')
              .map(submittal => (
                <Card key={submittal.id} className="border-blue-300">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold">{submittal.number} - {submittal.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{submittal.submittedBy}</p>
                      </div>
                      {getStatusBadge(submittal.status)}
                    </div>
                    <p className="text-sm text-gray-700 mb-3">{submittal.description}</p>
                    <p className="text-xs text-gray-600 mb-3">
                      Submitted: {submittal.submittedDate} | Due: {submittal.dueDate}
                    </p>
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1">
                        <CheckCircle2 size={14} className="mr-2" />
                        Approve
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1">
                        Request Revision
                      </Button>
                      <Button size="sm" variant="outline">
                        <FileText size={14} />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="approved" className="space-y-6">
          <div className="space-y-4">
            {submittals
              .filter(s => s.status === 'approved')
              .map(submittal => (
                <Card key={submittal.id} className="border-green-300">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">{submittal.number} - {submittal.title}</h3>
                        <p className="text-sm text-gray-600 mt-2">
                          Approved by {submittal.approvedBy} on {submittal.approvalDate}
                        </p>
                      </div>
                      {getStatusBadge(submittal.status)}
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="revision" className="space-y-6">
          <div className="space-y-4">
            {submittals
              .filter(s => s.status === 'revision-required')
              .map(submittal => (
                <Card key={submittal.id} className="border-orange-300 bg-orange-50">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold">{submittal.number} - {submittal.title}</h3>
                      {getStatusBadge(submittal.status)}
                    </div>
                    <div className="p-3 bg-white border border-orange-200 rounded mb-3">
                      <p className="font-semibold text-sm text-orange-900 mb-1">Required Changes:</p>
                      <p className="text-sm text-orange-800">{submittal.revisionNotes}</p>
                    </div>
                    <Button size="sm" className="w-full" variant="outline">
                      <Upload size={14} className="mr-2" />
                      Submit Revision
                    </Button>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="workflow" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Submittal Workflow Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold">Submitted → Pending Review</span>
                  <span className="text-sm text-gray-600">
                    {submittals.filter(s => s.status === 'pending-review' || s.status === 'revision-required' || s.status === 'approved').length}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 bg-blue-500 rounded-full"
                    style={{
                      width: `${
                        (submittals.filter(s => s.status === 'pending-review' || s.status === 'revision-required' || s.status === 'approved').length / submittals.length) * 100
                      }%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold">Approved</span>
                  <span className="text-sm text-gray-600">
                    {submittals.filter(s => s.status === 'approved').length}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 bg-green-500 rounded-full"
                    style={{
                      width: `${
                        (submittals.filter(s => s.status === 'approved').length / submittals.length) * 100
                      }%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold">Revision Required</span>
                  <span className="text-sm text-gray-600">
                    {submittals.filter(s => s.status === 'revision-required').length}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 bg-orange-500 rounded-full"
                    style={{
                      width: `${
                        (submittals.filter(s => s.status === 'revision-required').length / submittals.length) * 100
                      }%`,
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {selectedSubmittal && (
        <Card className="border-2 border-blue-500">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{selectedSubmittal.number}</CardTitle>
                <CardDescription>{selectedSubmittal.title}</CardDescription>
              </div>
              {getStatusBadge(selectedSubmittal.status)}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Submitted By</label>
                <p className="mt-1 font-semibold">{selectedSubmittal.submittedBy}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Submitted Date</label>
                <p className="mt-1 font-semibold">{selectedSubmittal.submittedDate}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Due Date</label>
                <p className="mt-1 font-semibold">{selectedSubmittal.dueDate}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Revisions</label>
                <p className="mt-1 font-semibold">{selectedSubmittal.revisions}</p>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600">Description</label>
              <p className="mt-1">{selectedSubmittal.description}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600 mb-2 block">Attachments</label>
              <div className="space-y-2">
                {selectedSubmittal.attachments.map((file, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                    <FileText size={16} className="text-blue-600" />
                    <span className="text-sm">{file}</span>
                    <Button size="sm" variant="ghost" className="ml-auto">Download</Button>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
