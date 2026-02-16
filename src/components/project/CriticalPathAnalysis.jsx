import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, TrendingDown, Clock, AlertTriangle } from 'lucide-react';

export default function CriticalPathAnalysis() {
  const [tasks, setTasks] = useState([
    {
      id: 1,
      name: 'Site Preparation',
      duration: 5,
      dependencies: [],
      status: 'completed',
      slack: 0,
      isCritical: true,
    },
    {
      id: 2,
      name: 'Foundation Work',
      duration: 10,
      dependencies: [1],
      status: 'in-progress',
      slack: 0,
      isCritical: true,
    },
    {
      id: 3,
      name: 'Framing',
      duration: 15,
      dependencies: [2],
      status: 'pending',
      slack: 0,
      isCritical: true,
    },
    {
      id: 4,
      name: 'Electrical Work',
      duration: 8,
      dependencies: [3],
      status: 'pending',
      slack: 2,
      isCritical: false,
    },
    {
      id: 5,
      name: 'Plumbing Work',
      duration: 8,
      dependencies: [3],
      status: 'pending',
      slack: 0,
      isCritical: true,
    },
    {
      id: 6,
      name: 'HVAC Installation',
      duration: 6,
      dependencies: [3],
      status: 'pending',
      slack: 4,
      isCritical: false,
    },
    {
      id: 7,
      name: 'Drywall Installation',
      duration: 10,
      dependencies: [4, 5, 6],
      status: 'pending',
      slack: 2,
      isCritical: false,
    },
    {
      id: 8,
      name: 'Flooring',
      duration: 5,
      dependencies: [7],
      status: 'pending',
      slack: 0,
      isCritical: true,
    },
    {
      id: 9,
      name: 'Painting',
      duration: 7,
      dependencies: [7],
      status: 'pending',
      slack: 3,
      isCritical: false,
    },
    {
      id: 10,
      name: 'Final Inspection',
      duration: 2,
      dependencies: [8, 9],
      status: 'pending',
      slack: 0,
      isCritical: true,
    },
  ]);

  const [selectedTask, setSelectedTask] = useState(null);

  const criticalPathMetrics = useMemo(() => {
    const criticalTasks = tasks.filter(t => t.isCritical);
    const totalDuration = tasks.reduce((max, t) => {
      const deps = t.dependencies.map(d => tasks.find(task => task.id === d));
      const depDuration = deps.reduce((sum, d) => sum + (d ? d.duration : 0), 0);
      return Math.max(max, depDuration + t.duration);
    }, 0);

    const atRiskTasks = tasks.filter(
      t => t.slack <= 3 && t.status === 'pending'
    );

    return {
      criticalTasks: criticalTasks.length,
      totalTasks: tasks.length,
      projectDuration: totalDuration,
      atRiskTasks: atRiskTasks.length,
      completionRate: Math.round(
        (tasks.filter(t => t.status === 'completed').length / tasks.length) * 100
      ),
    };
  }, [tasks]);

  const getDependencyNames = (depIds) => {
    return depIds.map(id => tasks.find(t => t.id === id)?.name).filter(Boolean);
  };

  const getTaskColor = (task) => {
    if (task.isCritical) {
      return 'bg-red-50 border-red-200';
    }
    if (task.slack <= 3) {
      return 'bg-yellow-50 border-yellow-200';
    }
    return 'bg-green-50 border-green-200';
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'in-progress':
        return <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-3xl font-bold">Critical Path Analysis</h1>
        <p className="text-gray-600 mt-2">
          Identify tasks that impact project completion date and manage schedule risk.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Critical Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {criticalPathMetrics.criticalTasks}
            </div>
            <p className="text-xs text-gray-600 mt-2">
              of {criticalPathMetrics.totalTasks} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Project Duration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{criticalPathMetrics.projectDuration}</div>
            <p className="text-xs text-gray-600 mt-2">Days (minimum)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">At Risk Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {criticalPathMetrics.atRiskTasks}
            </div>
            <p className="text-xs text-gray-600 mt-2">
              Low slack (&lt;3 days)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{criticalPathMetrics.completionRate}%</div>
            <p className="text-xs text-gray-600 mt-2">Overall progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Schedule Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mt-2">
              <Badge className="bg-green-100 text-green-800">On Track</Badge>
            </div>
            <p className="text-xs text-gray-600 mt-2">No delays detected</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="critical-path" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="critical-path">Critical Path</TabsTrigger>
          <TabsTrigger value="all-tasks">All Tasks</TabsTrigger>
          <TabsTrigger value="analysis">Risk Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="critical-path" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="text-red-600" size={20} />
                Critical Path Tasks
              </CardTitle>
              <CardDescription>
                Tasks that directly impact the project finish date. Any delay will delay the entire project.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {tasks
                .filter(t => t.isCritical)
                .map(task => (
                  <div
                    key={task.id}
                    className={`p-4 border rounded-lg cursor-pointer transition ${getTaskColor(task)}`}
                    onClick={() => setSelectedTask(task)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">{task.name}</h3>
                      {getStatusBadge(task.status)}
                    </div>
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Duration:</span>
                        <p className="font-medium">{task.duration} days</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Slack:</span>
                        <p className="font-medium">{task.slack} days</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Dependencies:</span>
                        <p className="font-medium">
                          {task.dependencies.length > 0 ? task.dependencies.length : 'None'}
                        </p>
                      </div>
                      <div>
                        <Badge className="bg-red-100 text-red-800">Critical</Badge>
                      </div>
                    </div>
                  </div>
                ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all-tasks" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Project Task Network</CardTitle>
              <CardDescription>
                Complete breakdown of all tasks with dependencies and slack time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {tasks.map(task => (
                  <div
                    key={task.id}
                    className={`p-4 border rounded-lg cursor-pointer transition ${getTaskColor(task)}`}
                    onClick={() => setSelectedTask(task)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm font-semibold">
                          {task.id}
                        </div>
                        <h3 className="font-semibold">{task.name}</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        {task.isCritical && (
                          <Badge className="bg-red-100 text-red-800">Critical</Badge>
                        )}
                        {getStatusBadge(task.status)}
                      </div>
                    </div>
                    <div className="grid grid-cols-5 gap-4 text-sm ml-11">
                      <div>
                        <span className="text-gray-600">Duration:</span>
                        <p className="font-medium">{task.duration} days</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Slack:</span>
                        <p className="font-medium">{task.slack} days</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Dependencies:</span>
                        <p className="font-medium">
                          {task.dependencies.length > 0 ? task.dependencies.join(', ') : 'Start'}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600">Risk Level:</span>
                        <p className={`font-medium ${task.isCritical ? 'text-red-600' : task.slack <= 3 ? 'text-yellow-600' : 'text-green-600'}`}>
                          {task.isCritical ? 'Critical' : task.slack <= 3 ? 'High' : 'Low'}
                        </p>
                      </div>
                      {task.dependencies.length > 0 && (
                        <div>
                          <span className="text-gray-600">Blocks:</span>
                          <p className="font-medium">
                            {tasks.filter(t => t.dependencies.includes(task.id)).length} tasks
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="text-yellow-600" size={20} />
                Schedule Risk Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold mb-3">Critical Tasks Requiring Attention</h3>
                <div className="space-y-2">
                  {tasks
                    .filter(t => t.isCritical && t.status !== 'completed')
                    .map(task => (
                      <div key={task.id} className="p-3 bg-red-50 border border-red-200 rounded">
                        <p className="font-medium text-red-900">{task.name}</p>
                        <p className="text-sm text-red-700 mt-1">
                          No slack time - any delay delays the entire project
                        </p>
                      </div>
                    ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">At-Risk Tasks (Low Slack)</h3>
                <div className="space-y-2">
                  {tasks
                    .filter(t => t.slack <= 3 && !t.isCritical)
                    .map(task => (
                      <div key={task.id} className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                        <p className="font-medium text-yellow-900">{task.name}</p>
                        <p className="text-sm text-yellow-700 mt-1">
                          Only {task.slack} days slack - monitor closely
                        </p>
                      </div>
                    ))}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">Recommendations</h3>
                <ul className="space-y-2 text-sm text-blue-800">
                  <li>✓ Prioritize completion of all critical path tasks</li>
                  <li>✓ Allocate senior resources to critical tasks</li>
                  <li>✓ Monitor Foundation Work closely - currently in progress</li>
                  <li>✓ Prepare contingency plans for high-risk tasks</li>
                  <li>✓ Daily status updates on critical path progress</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {selectedTask && (
        <Card>
          <CardHeader>
            <CardTitle>{selectedTask.name} - Detailed Analysis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Duration</label>
                <p className="mt-1 text-2xl font-bold">{selectedTask.duration}</p>
                <p className="text-xs text-gray-600">days</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Slack Time</label>
                <p className="mt-1 text-2xl font-bold">{selectedTask.slack}</p>
                <p className="text-xs text-gray-600">days</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Status</label>
                <p className="mt-1">{getStatusBadge(selectedTask.status)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Type</label>
                <p className="mt-1">
                  {selectedTask.isCritical ? (
                    <Badge className="bg-red-100 text-red-800">Critical Path</Badge>
                  ) : (
                    <Badge variant="outline">Non-Critical</Badge>
                  )}
                </p>
              </div>
            </div>

            {selectedTask.dependencies.length > 0 && (
              <div>
                <label className="text-sm font-medium text-gray-600">Dependencies</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {getDependencyNames(selectedTask.dependencies).map((name, idx) => (
                    <Badge key={idx} variant="outline">{name}</Badge>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-gray-600">Risk Assessment</label>
              <p className="mt-2 text-sm">
                {selectedTask.isCritical
                  ? 'This task is on the critical path. Any delays will impact project completion.'
                  : selectedTask.slack <= 3
                  ? 'This task has limited slack time. Monitor progress closely.'
                  : 'This task has sufficient slack time. Less immediate risk.'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
