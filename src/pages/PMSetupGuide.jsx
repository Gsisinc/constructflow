import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, CheckCircle2 } from 'lucide-react';

export default function PMSetupGuide() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">PM System Setup Guide</h1>
        <p className="text-slate-600">Complete documentation for your project management system</p>
      </div>

      {/* Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            System Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-600">Your PM system integrates three main components:</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border rounded p-4">
              <h3 className="font-semibold text-sm mb-2">Template Library</h3>
              <p className="text-xs text-slate-600 mb-3">100+ construction templates organized by category</p>
              <Badge>Contracts, Safety, Forms, Checklists</Badge>
            </div>
            <div className="border rounded p-4">
              <h3 className="font-semibold text-sm mb-2">Task Tracker</h3>
              <p className="text-xs text-slate-600 mb-3">Daily/weekly operational tasks auto-generated from bids</p>
              <Badge>Auto-generation, Project-tied, Status tracking</Badge>
            </div>
            <div className="border rounded p-4">
              <h3 className="font-semibold text-sm mb-2">PM Core System</h3>
              <p className="text-xs text-slate-600 mb-3">Full project management framework</p>
              <Badge>Budget, Schedule, Teams, Safety</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Component 1: Template Library */}
      <Card>
        <CardHeader>
          <CardTitle>1. Template Library (100 Documents)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold text-sm mb-2">What It Does</h4>
            <ul className="text-sm text-slate-600 space-y-1 ml-4 list-disc">
              <li>Pre-built templates for all construction phases</li>
              <li>Organized by 12+ categories</li>
              <li>Eliminates starting documents from scratch</li>
              <li>Track usage and create custom templates</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-2">Template Categories</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-50 p-3 rounded">
                <p className="font-medium mb-1">Contracts (10)</p>
                <p className="text-slate-600">Subcontractor, change orders, equipment, insurance</p>
              </div>
              <div className="bg-slate-50 p-3 rounded">
                <p className="font-medium mb-1">Bid Forms (10)</p>
                <p className="text-slate-600">Proposals, RFQs, estimates, scoring matrices</p>
              </div>
              <div className="bg-slate-50 p-3 rounded">
                <p className="font-medium mb-1">Safety (10)</p>
                <p className="text-slate-600">Daily briefings, audits, incident reports, training</p>
              </div>
              <div className="bg-slate-50 p-3 rounded">
                <p className="font-medium mb-1">Checklists (5)</p>
                <p className="text-slate-600">Punch lists, inspections, closeout, deficiencies</p>
              </div>
              <div className="bg-slate-50 p-3 rounded">
                <p className="font-medium mb-1">Project Docs (4)</p>
                <p className="text-slate-600">Daily logs, RFIs, submittals, inspections</p>
              </div>
              <div className="bg-slate-50 p-3 rounded">
                <p className="font-medium mb-1">Operations (51)</p>
                <p className="text-slate-600">Schedules, equipment logs, warranties, compliance</p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-2">How to Use</h4>
            <ol className="text-sm text-slate-600 space-y-2 ml-4 list-decimal">
              <li>Navigate to <strong>Template Library</strong> page</li>
              <li>Browse by category or search by name</li>
              <li>Click "View" to read full template</li>
              <li>Click "Copy" to duplicate and customize</li>
              <li>Replace [Placeholders] with project-specific info</li>
              <li>Use on your projects</li>
            </ol>
          </div>

          <div className="bg-blue-50 border border-blue-200 p-3 rounded text-sm">
            <p><strong>Pro Tip:</strong> Create company-specific templates by duplicating and modifying existing ones. Tag them with your company name for easy filtering.</p>
          </div>
        </CardContent>
      </Card>

      {/* Component 2: Task System */}
      <Card>
        <CardHeader>
          <CardTitle>2. Daily/Weekly Task System</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold text-sm mb-2">What It Does</h4>
            <p className="text-sm text-slate-600 mb-3">Tracks operational tasks separate from phase requirements:</p>
            <ul className="text-sm text-slate-600 space-y-1 ml-4 list-disc">
              <li><strong>Bid tasks</strong>: Auto-created when bids are added/analyzed</li>
              <li><strong>Project tasks</strong>: Tied to specific projects</li>
              <li><strong>Current work</strong>: What needs doing right now</li>
              <li><strong>Dashboard</strong>: See all pending/in-progress/completed work</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-2">Task vs Requirements</h4>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="border-l-4 border-blue-500 pl-3">
                <p className="font-semibold mb-1">Tasks (Operational)</p>
                <p className="text-slate-600">Bid analysis, cost estimate, procurement, compliance</p>
              </div>
              <div className="border-l-4 border-amber-500 pl-3">
                <p className="font-semibold mb-1">Requirements (Deliverables)</p>
                <p className="text-slate-600">Foundation, rough-in, finishes, inspection</p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-2">Auto-Generated Tasks from Bids</h4>
            <div className="space-y-2 text-sm">
              <div className="bg-slate-50 p-2 rounded">
                <p className="font-medium">NEW BID</p>
                <p className="text-slate-600">→ Analyze Bid, Research Requirements</p>
              </div>
              <div className="bg-slate-50 p-2 rounded">
                <p className="font-medium">ANALYZING</p>
                <p className="text-slate-600">→ Cost Estimate, Compliance Review, Schedule Meeting</p>
              </div>
              <div className="bg-slate-50 p-2 rounded">
                <p className="font-medium">ESTIMATING</p>
                <p className="text-slate-600">→ Finalize Package, Get Quotes, Final Review</p>
              </div>
              <div className="bg-slate-50 p-2 rounded">
                <p className="font-medium">SUBMITTED</p>
                <p className="text-slate-600">→ Follow Up on Bid</p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-2">How to Use</h4>
            <ol className="text-sm text-slate-600 space-y-2 ml-4 list-decimal">
              <li>Go to <strong>Task Tracker</strong> page</li>
              <li>View dashboard stats (Pending/In Progress/Completed/Blocked)</li>
              <li>Click task status to move it forward in workflow</li>
              <li>Filter by project to see project-specific tasks</li>
              <li>Create manual tasks with "New Task" button</li>
              <li>Assign to team members by email</li>
            </ol>
          </div>

          <div className="bg-blue-50 border border-blue-200 p-3 rounded text-sm">
            <p><strong>Pro Tip:</strong> Tasks auto-generate when you add/analyze bids. Mark them as complete as work finishes. When bid becomes a project, carry over any open tasks.</p>
          </div>
        </CardContent>
      </Card>

      {/* Component 3: PM Core System */}
      <Card>
        <CardHeader>
          <CardTitle>3. Project Management Core System</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold text-sm mb-2">Key Components</h4>
            <div className="space-y-3 text-sm">
              <div className="border-l-4 border-green-500 pl-3">
                <p className="font-semibold">Projects</p>
                <p className="text-slate-600">Define project scope, budget, timeline, health status</p>
              </div>
              <div className="border-l-4 border-blue-500 pl-3">
                <p className="font-semibold">Phases</p>
                <p className="text-slate-600">Create custom phases (you define the workflow)</p>
              </div>
              <div className="border-l-4 border-purple-500 pl-3">
                <p className="font-semibold">Budget Tracking</p>
                <p className="text-slate-600">Budgeted vs. committed vs. spent vs. projected</p>
              </div>
              <div className="border-l-4 border-orange-500 pl-3">
                <p className="font-semibold">Team & Roles</p>
                <p className="text-slate-600">Assign team members with specific permissions</p>
              </div>
              <div className="border-l-4 border-red-500 pl-3">
                <p className="font-semibold">Safety Management</p>
                <p className="text-slate-600">Incident reports, audits, corrective actions</p>
              </div>
              <div className="border-l-4 border-slate-500 pl-3">
                <p className="font-semibold">Permits & Inspections</p>
                <p className="text-slate-600">Track permits, inspections, compliance</p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-2">Workflow: Bid → Project → Completion</h4>
            <div className="bg-slate-50 p-4 rounded text-xs space-y-2 font-mono">
              <p>1. BID DISCOVERED → Auto-create tasks</p>
              <p>2. BID ANALYZED → Tasks update status</p>
              <p>3. BID WON → Create Project</p>
              <p>4. PROJECT CREATED → Define phases</p>
              <p>5. PROJECT EXECUTION → Manage tasks + phases</p>
              <p>6. PROJECT COMPLETION → Lock phases, closeout</p>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-2">Getting Started</h4>
            <ol className="text-sm text-slate-600 space-y-1 ml-4 list-decimal">
              <li>Create a Project</li>
              <li>Define custom Phases for your workflow</li>
              <li>Add team members and assign roles</li>
              <li>Set project budget and timeline</li>
              <li>Create phase requirements and tasks</li>
              <li>Upload files organized by phases</li>
              <li>Track progress and budget in real-time</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      {/* Quick Checklist */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            First-Time Setup Checklist
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <input type="checkbox" className="mt-1" id="check1" />
              <label htmlFor="check1" className="text-slate-700">Access Template Library and review templates</label>
            </div>
            <div className="flex items-start gap-2">
              <input type="checkbox" className="mt-1" id="check2" />
              <label htmlFor="check2" className="text-slate-700">Customize templates for your company standards</label>
            </div>
            <div className="flex items-start gap-2">
              <input type="checkbox" className="mt-1" id="check3" />
              <label htmlFor="check3" className="text-slate-700">Create first test Project</label>
            </div>
            <div className="flex items-start gap-2">
              <input type="checkbox" className="mt-1" id="check4" />
              <label htmlFor="check4" className="text-slate-700">Define custom Phases for your workflow</label>
            </div>
            <div className="flex items-start gap-2">
              <input type="checkbox" className="mt-1" id="check5" />
              <label htmlFor="check5" className="text-slate-700">Add team members to project</label>
            </div>
            <div className="flex items-start gap-2">
              <input type="checkbox" className="mt-1" id="check6" />
              <label htmlFor="check6" className="text-slate-700">Create operational tasks in Task Tracker</label>
            </div>
            <div className="flex items-start gap-2">
              <input type="checkbox" className="mt-1" id="check7" />
              <label htmlFor="check7" className="text-slate-700">Add test Bid and verify auto-task generation</label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Getting Help */}
      <Card>
        <CardHeader>
          <CardTitle>Need Help?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm">
            <p className="font-semibold mb-2">System Pages:</p>
            <ul className="space-y-1 text-slate-600 ml-4 list-disc">
              <li><strong>Template Library</strong> - Browse, create, and manage templates</li>
              <li><strong>Task Tracker</strong> - View and manage operational tasks</li>
              <li><strong>Projects</strong> - Create and manage projects</li>
              <li><strong>Dashboard</strong> - Overview of all activities</li>
            </ul>
          </div>
          <div className="bg-blue-50 border border-blue-200 p-3 rounded text-sm">
            <p><strong>Remember:</strong> Your PM system is fully configured and ready to use. Start by creating your first project, then leverage templates and auto-generated tasks to streamline operations.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}