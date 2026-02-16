import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Users, TrendingUp, Calendar, BarChart3 } from 'lucide-react';

export default function ResourceAllocationLeveling() {
  const [resources, setResources] = useState([
    { id: 1, name: 'John Smith', role: 'Project Manager', availability: 85, currentWorkload: 4, maxCapacity: 5, projects: ['Project A', 'Project B'] },
    { id: 2, name: 'Sarah Johnson', role: 'Foreman', availability: 60, currentWorkload: 3, maxCapacity: 4, projects: ['Project C', 'Project D', 'Project E'] },
    { id: 3, name: 'Mike Davis', role: 'Equipment Operator', availability: 100, currentWorkload: 2, maxCapacity: 3, projects: ['Project A'] },
    { id: 4, name: 'Emily Wilson', role: 'Safety Officer', availability: 45, currentWorkload: 5, maxCapacity: 5, projects: ['Project B', 'Project C', 'Project D', 'Project E', 'Project F'] },
    { id: 5, name: 'David Brown', role: 'Electrician', availability: 75, currentWorkload: 3, maxCapacity: 4, projects: ['Project A', 'Project D'] },
  ]);

  const [selectedResource, setSelectedResource] = useState(null);
  const [optimizationResults, setOptimizationResults] = useState(null);

  const runLevelingOptimization = () => {
    // Simulate resource leveling algorithm
    const results = {
      overallocated: resources.filter(r => r.currentWorkload > r.maxCapacity),
      underutilized: resources.filter(r => r.currentWorkload < r.maxCapacity * 0.6),
      suggestions: [
        'Reassign Sarah Johnson from Project E to available capacity next month',
        'Emily Wilson is overallocated - consider adding team member to Project B',
        'Mike Davis has capacity - can support additional projects',
      ],
      projectedImprovement: '23% better resource utilization',
    };
    setOptimizationResults(results);
  };

  const getCapacityStatus = (current, max) => {
    const percentage = (current / max) * 100;
    if (percentage > 100) return { label: 'Overallocated', color: 'bg-red-100 text-red-800' };
    if (percentage > 80) return { label: 'At Capacity', color: 'bg-yellow-100 text-yellow-800' };
    if (percentage > 60) return { label: 'Good Fit', color: 'bg-blue-100 text-blue-800' };
    return { label: 'Available Capacity', color: 'bg-green-100 text-green-800' };
  };

  const getTrendIcon = (percentage) => {
    if (percentage > 100) return <TrendingUp className="text-red-600" size={16} />;
    if (percentage > 80) return <TrendingUp className="text-yellow-600" size={16} />;
    return <TrendingUp className="text-green-600" size={16} />;
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-3xl font-bold">Resource Allocation & Leveling</h1>
        <p className="text-gray-600 mt-2">
          Manage team workload, optimize resource allocation, and identify capacity constraints.
        </p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="allocation">Allocation Matrix</TabsTrigger>
          <TabsTrigger value="optimization">Optimization</TabsTrigger>
          <TabsTrigger value="timeline">Timeline View</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total Resources</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{resources.length}</div>
                <p className="text-xs text-gray-600 mt-2">Active team members</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Avg Utilization</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.round(
                    (resources.reduce((sum, r) => sum + r.currentWorkload / r.maxCapacity, 0) / resources.length) * 100
                  )}%
                </div>
                <p className="text-xs text-gray-600 mt-2">Team capacity usage</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Overallocated</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {resources.filter(r => r.currentWorkload > r.maxCapacity).length}
                </div>
                <p className="text-xs text-gray-600 mt-2">Resources over capacity</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Avg Availability</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.round(resources.reduce((sum, r) => sum + r.availability, 0) / resources.length)}%
                </div>
                <p className="text-xs text-gray-600 mt-2">Scheduled time available</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users size={20} />
                Resource Status Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {resources.map(resource => {
                  const percentage = (resource.currentWorkload / resource.maxCapacity) * 100;
                  const status = getCapacityStatus(resource.currentWorkload, resource.maxCapacity);

                  return (
                    <div
                      key={resource.id}
                      className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition"
                      onClick={() => setSelectedResource(resource)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h3 className="font-semibold">{resource.name}</h3>
                          <p className="text-sm text-gray-600">{resource.role}</p>
                        </div>
                        <Badge className={status.color}>{status.label}</Badge>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Workload: {resource.currentWorkload}/{resource.maxCapacity} projects</span>
                          <span className="font-medium">{Math.round(percentage)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              percentage > 100
                                ? 'bg-red-500'
                                : percentage > 80
                                ? 'bg-yellow-500'
                                : 'bg-green-500'
                            }`}
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-600">
                          <span>Availability: {resource.availability}%</span>
                          {getTrendIcon(percentage)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="allocation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Resource Allocation Matrix</CardTitle>
              <CardDescription>
                View detailed allocation of resources across projects
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold">Resource</th>
                      <th className="text-center py-3 px-4 font-semibold">Role</th>
                      <th className="text-center py-3 px-4 font-semibold">Assigned Projects</th>
                      <th className="text-center py-3 px-4 font-semibold">Workload</th>
                      <th className="text-center py-3 px-4 font-semibold">Capacity</th>
                      <th className="text-center py-3 px-4 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resources.map(resource => {
                      const status = getCapacityStatus(resource.currentWorkload, resource.maxCapacity);
                      return (
                        <tr key={resource.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium">{resource.name}</td>
                          <td className="py-3 px-4 text-center text-sm">{resource.role}</td>
                          <td className="py-3 px-4 text-center text-sm">{resource.projects.length}</td>
                          <td className="py-3 px-4 text-center">{resource.currentWorkload}</td>
                          <td className="py-3 px-4 text-center">{resource.maxCapacity}</td>
                          <td className="py-3 px-4 text-center">
                            <Badge className={status.color}>{status.label}</Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {selectedResource && (
            <Card>
              <CardHeader>
                <CardTitle>{selectedResource.name} - Detailed View</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Role</label>
                    <p className="mt-1 font-semibold">{selectedResource.role}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Availability</label>
                    <p className="mt-1 font-semibold">{selectedResource.availability}%</p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Current Projects</label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedResource.projects.map((project, idx) => (
                      <Badge key={idx} variant="outline">{project}</Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="optimization" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Resource Leveling Optimization</CardTitle>
                  <CardDescription>
                    Run optimization algorithm to balance workload across team
                  </CardDescription>
                </div>
                <Button onClick={runLevelingOptimization} size="lg">
                  <BarChart3 size={18} className="mr-2" />
                  Run Optimization
                </Button>
              </div>
            </CardHeader>
          </Card>

          {optimizationResults && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Optimization Results</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="font-semibold text-green-900">
                      {optimizationResults.projectedImprovement}
                    </p>
                  </div>

                  {optimizationResults.overallocated.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <AlertCircle className="text-red-600" size={20} />
                        Overallocated Resources
                      </h3>
                      <div className="space-y-2">
                        {optimizationResults.overallocated.map(resource => (
                          <div key={resource.id} className="p-3 bg-red-50 border border-red-200 rounded">
                            <p className="font-medium">{resource.name}</p>
                            <p className="text-sm text-red-700">
                              Workload: {resource.currentWorkload}/{resource.maxCapacity} projects
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {optimizationResults.underutilized.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <TrendingUp className="text-green-600" size={20} />
                        Underutilized Resources
                      </h3>
                      <div className="space-y-2">
                        {optimizationResults.underutilized.map(resource => (
                          <div key={resource.id} className="p-3 bg-green-50 border border-green-200 rounded">
                            <p className="font-medium">{resource.name}</p>
                            <p className="text-sm text-green-700">
                              Available capacity: {resource.maxCapacity - resource.currentWorkload} projects
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <h3 className="font-semibold mb-3">Optimization Suggestions</h3>
                    <div className="space-y-2">
                      {optimizationResults.suggestions.map((suggestion, idx) => (
                        <div key={idx} className="p-3 bg-blue-50 border border-blue-200 rounded">
                          <p className="text-sm text-blue-900">{suggestion}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="timeline" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Resource Timeline View</CardTitle>
              <CardDescription>
                Visual representation of resource allocation over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {resources.map(resource => (
                  <div key={resource.id} className="pb-4 border-b last:border-b-0">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-semibold">{resource.name}</p>
                        <p className="text-xs text-gray-600">{resource.role}</p>
                      </div>
                      <span className="text-sm font-medium">
                        {resource.currentWorkload}/{resource.maxCapacity} projects
                      </span>
                    </div>
                    <div className="flex gap-1">
                      {Array.from({ length: 12 }).map((_, month) => (
                        <div
                          key={month}
                          className={`flex-1 h-8 rounded border ${
                            month < resource.currentWorkload
                              ? 'bg-blue-500'
                              : month < resource.maxCapacity
                              ? 'bg-blue-200'
                              : 'bg-gray-100'
                          }`}
                          title={`Month ${month + 1}`}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
