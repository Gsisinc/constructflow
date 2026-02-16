import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, TrendingDown, DollarSign, AlertCircle } from 'lucide-react';

export default function ProjectProfitabilityAnalysis() {
  const [projects, setProjects] = useState([
    {
      id: 1,
      name: 'Project A - Commercial Building',
      contractValue: 1200000,
      revenue: 1200000,
      totalCosts: 1080000,
      budgetedCosts: 1050000,
      laborCosts: 450000,
      materialCosts: 380000,
      equipmentCosts: 150000,
      otherCosts: 100000,
      status: 'in-progress',
      completion: 75,
      margin: 90000,
      marginPercent: 7.5,
      budgetVariance: 30000,
      budgetVariancePercent: 2.9,
    },
    {
      id: 2,
      name: 'Project B - Residential Complex',
      contractValue: 850000,
      revenue: 850000,
      totalCosts: 880000,
      budgetedCosts: 810000,
      laborCosts: 320000,
      materialCosts: 380000,
      equipmentCosts: 100000,
      otherCosts: 80000,
      status: 'in-progress',
      completion: 60,
      margin: -30000,
      marginPercent: -3.5,
      budgetVariance: -70000,
      budgetVariancePercent: -8.6,
    },
    {
      id: 3,
      name: 'Project C - Office Renovation',
      contractValue: 450000,
      revenue: 450000,
      totalCosts: 410000,
      budgetedCosts: 400000,
      laborCosts: 180000,
      materialCosts: 150000,
      equipmentCosts: 50000,
      otherCosts: 30000,
      status: 'in-progress',
      completion: 90,
      margin: 40000,
      marginPercent: 8.9,
      budgetVariance: 10000,
      budgetVariancePercent: 2.5,
    },
    {
      id: 4,
      name: 'Project D - Retail Build-Out',
      contractValue: 600000,
      revenue: 600000,
      totalCosts: 570000,
      budgetedCosts: 560000,
      laborCosts: 240000,
      materialCosts: 200000,
      equipmentCosts: 80000,
      otherCosts: 50000,
      status: 'completed',
      completion: 100,
      margin: 30000,
      marginPercent: 5.0,
      budgetVariance: 10000,
      budgetVariancePercent: 1.8,
    },
  ]);

  const [selectedProject, setSelectedProject] = useState(null);

  const totalContractValue = projects.reduce((sum, p) => sum + p.contractValue, 0);
  const totalRevenue = projects.reduce((sum, p) => sum + p.revenue, 0);
  const totalCosts = projects.reduce((sum, p) => sum + p.totalCosts, 0);
  const totalMargin = totalRevenue - totalCosts;
  const totalMarginPercent = (totalMargin / totalRevenue) * 100;
  const avgBudgetVariance = projects.reduce((sum, p) => sum + p.budgetVariance, 0);

  const costBreakdown = [
    { category: 'Labor', total: projects.reduce((sum, p) => sum + p.laborCosts, 0), percentage: 0 },
    { category: 'Materials', total: projects.reduce((sum, p) => sum + p.materialCosts, 0), percentage: 0 },
    { category: 'Equipment', total: projects.reduce((sum, p) => sum + p.equipmentCosts, 0), percentage: 0 },
    { category: 'Other', total: projects.reduce((sum, p) => sum + p.otherCosts, 0), percentage: 0 },
  ];

  costBreakdown.forEach(item => {
    item.percentage = (item.total / totalCosts) * 100;
  });

  const profitableProjects = projects.filter(p => p.margin > 0);
  const unprofitableProjects = projects.filter(p => p.margin < 0);
  const onBudgetProjects = projects.filter(p => p.budgetVariance <= 0);
  const overBudgetProjects = projects.filter(p => p.budgetVariance > 0);

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-3xl font-bold">Project Profitability Analysis</h1>
        <p className="text-gray-600 mt-2">
          Real-time tracking of costs, revenue, and project profitability.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(totalRevenue / 1000000).toFixed(2)}M</div>
            <p className="text-xs text-gray-600 mt-2">All projects</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Costs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">${(totalCosts / 1000000).toFixed(2)}M</div>
            <p className="text-xs text-gray-600 mt-2">Actual costs incurred</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Margin</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalMargin > 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${(totalMargin / 1000000).toFixed(2)}M
            </div>
            <p className="text-xs text-gray-600 mt-2">{totalMarginPercent.toFixed(1)}% margin</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Profitable</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{profitableProjects.length}</div>
            <p className="text-xs text-gray-600 mt-2">of {projects.length} projects</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Budget Variance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${avgBudgetVariance > 0 ? 'text-red-600' : 'text-green-600'}`}>
              ${(avgBudgetVariance / 1000000).toFixed(2)}M
            </div>
            <p className="text-xs text-gray-600 mt-2">vs. budgeted costs</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="projects" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="costs">Cost Breakdown</TabsTrigger>
          <TabsTrigger value="variance">Budget Variance</TabsTrigger>
          <TabsTrigger value="trends">Profitability Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="space-y-6">
          <div className="space-y-4">
            {projects.map(project => (
              <Card
                key={project.id}
                className={`cursor-pointer transition ${
                  selectedProject?.id === project.id ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => setSelectedProject(project)}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{project.name}</h3>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className={project.status === 'completed' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}>
                          {project.status === 'completed' ? 'Completed' : `${project.completion}% Complete`}
                        </Badge>
                        {project.margin > 0 ? (
                          <TrendingUp className="text-green-600" size={16} />
                        ) : (
                          <TrendingDown className="text-red-600" size={16} />
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-5 gap-4 text-sm mb-4 pb-4 border-t">
                    <div>
                      <span className="text-gray-600">Revenue</span>
                      <p className="font-bold">${(project.revenue / 1000).toFixed(0)}K</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Costs</span>
                      <p className="font-bold">${(project.totalCosts / 1000).toFixed(0)}K</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Margin</span>
                      <p className={`font-bold ${project.margin > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${(project.margin / 1000).toFixed(0)}K ({project.marginPercent}%)
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600">Budget Variance</span>
                      <p className={`font-bold ${project.budgetVariance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {project.budgetVariance > 0 ? '+' : ''}{project.budgetVariancePercent}%
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600">Budgeted Profit</span>
                      <p className="font-bold">${((project.revenue - project.budgetedCosts) / 1000).toFixed(0)}K</p>
                    </div>
                  </div>

                  {project.margin < 0 && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800">
                      <AlertCircle className="inline mr-2" size={14} />
                      <span>This project is currently unprofitable</span>
                    </div>
                  )}

                  {project.budgetVariance > 0 && (
                    <div className="p-3 bg-orange-50 border border-orange-200 rounded text-sm text-orange-800 mt-2">
                      <AlertCircle className="inline mr-2" size={14} />
                      <span>Actual costs exceed budget by ${(project.budgetVariance / 1000).toFixed(0)}K</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="costs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Cost Category Breakdown</CardTitle>
              <CardDescription>Distribution of costs across all projects</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {costBreakdown.map((item, idx) => (
                <div key={idx}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold">{item.category}</span>
                    <span className="text-lg font-bold">${(item.total / 1000000).toFixed(2)}M ({item.percentage.toFixed(1)}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="h-3 bg-blue-500 rounded-full"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Labor Cost Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {projects.map(project => (
                <div key={project.id} className="flex items-center justify-between p-2 border-b last:border-b-0">
                  <div>
                    <p className="text-sm font-medium">{project.name}</p>
                    <p className="text-xs text-gray-600">${(project.laborCosts / 1000).toFixed(0)}K labor</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">{((project.laborCosts / project.totalCosts) * 100).toFixed(1)}% of costs</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="variance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Budget Performance</CardTitle>
              <CardDescription>Actual costs vs. budgeted costs</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {projects.map(project => {
                const budgetUsed = (project.totalCosts / project.budgetedCosts) * 100;
                return (
                  <div key={project.id}>
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-semibold text-sm">{project.name}</p>
                        <p className="text-xs text-gray-600">
                          ${(project.totalCosts / 1000).toFixed(0)}K / ${(project.budgetedCosts / 1000).toFixed(0)}K
                        </p>
                      </div>
                      <span className={`font-bold ${project.budgetVariance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {budgetUsed > 100 ? '+' : ''}{(budgetUsed - 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          budgetUsed > 100 ? 'bg-red-500' : budgetUsed > 95 ? 'bg-orange-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(budgetUsed, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">On Budget</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{onBudgetProjects.length}</div>
                <p className="text-xs text-gray-600 mt-2">projects</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Over Budget</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{overBudgetProjects.length}</div>
                <p className="text-xs text-gray-600 mt-2">projects</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profitability Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm text-gray-600 mb-2">Profitable Projects</p>
                  <div className="text-3xl font-bold text-green-600">{profitableProjects.length}</div>
                  <p className="text-xs text-gray-600 mt-2">
                    ${profitableProjects.reduce((sum, p) => sum + p.margin, 0) / 1000}K total profit
                  </p>
                </div>

                <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <p className="text-sm text-gray-600 mb-2">Unprofitable Projects</p>
                  <div className="text-3xl font-bold text-red-600">{unprofitableProjects.length}</div>
                  <p className="text-xs text-gray-600 mt-2">
                    ${Math.abs(unprofitableProjects.reduce((sum, p) => sum + p.margin, 0)) / 1000}K total loss
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Margin Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {projects
                .sort((a, b) => b.marginPercent - a.marginPercent)
                .map(project => (
                  <div key={project.id} className="flex items-center justify-between p-2 border-b last:border-b-0">
                    <p className="text-sm font-medium">{project.name}</p>
                    <div className="flex items-center gap-2">
                      <span className={`font-bold ${project.marginPercent > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {project.marginPercent > 0 ? '+' : ''}{project.marginPercent}%
                      </span>
                      <Badge className={project.marginPercent > 5 ? 'bg-green-100 text-green-800' : project.marginPercent > 0 ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'}>
                        ${(project.margin / 1000).toFixed(0)}K
                      </Badge>
                    </div>
                  </div>
                ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {selectedProject && (
        <Card className="border-2 border-blue-500">
          <CardHeader>
            <CardTitle>{selectedProject.name}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <label className="text-sm font-medium text-gray-600">Contract Value</label>
              <p className="mt-2 text-2xl font-bold">${(selectedProject.contractValue / 1000).toFixed(0)}K</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Total Revenue</label>
              <p className="mt-2 text-2xl font-bold">${(selectedProject.revenue / 1000).toFixed(0)}K</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Total Costs</label>
              <p className="mt-2 text-2xl font-bold text-orange-600">${(selectedProject.totalCosts / 1000).toFixed(0)}K</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Profit Margin</label>
              <p className={`mt-2 text-2xl font-bold ${selectedProject.margin > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {selectedProject.marginPercent}%
              </p>
            </div>

            <div className="md:col-span-4">
              <h3 className="font-semibold mb-3">Cost Breakdown</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 bg-gray-50 rounded">
                  <p className="text-xs text-gray-600">Labor</p>
                  <p className="text-lg font-bold">${(selectedProject.laborCosts / 1000).toFixed(0)}K</p>
                  <p className="text-xs text-gray-600 mt-1">
                    {((selectedProject.laborCosts / selectedProject.totalCosts) * 100).toFixed(1)}%
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded">
                  <p className="text-xs text-gray-600">Materials</p>
                  <p className="text-lg font-bold">${(selectedProject.materialCosts / 1000).toFixed(0)}K</p>
                  <p className="text-xs text-gray-600 mt-1">
                    {((selectedProject.materialCosts / selectedProject.totalCosts) * 100).toFixed(1)}%
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded">
                  <p className="text-xs text-gray-600">Equipment</p>
                  <p className="text-lg font-bold">${(selectedProject.equipmentCosts / 1000).toFixed(0)}K</p>
                  <p className="text-xs text-gray-600 mt-1">
                    {((selectedProject.equipmentCosts / selectedProject.totalCosts) * 100).toFixed(1)}%
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded">
                  <p className="text-xs text-gray-600">Other</p>
                  <p className="text-lg font-bold">${(selectedProject.otherCosts / 1000).toFixed(0)}K</p>
                  <p className="text-xs text-gray-600 mt-1">
                    {((selectedProject.otherCosts / selectedProject.totalCosts) * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
