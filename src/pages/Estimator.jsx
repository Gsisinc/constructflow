import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, Edit2, Trash2, Download, Send, Settings, Users, BarChart3, 
  FileText, Lock, Bell, DollarSign, TrendingUp, Calendar, CheckCircle,
  AlertCircle, Eye, EyeOff, Filter, Search, Copy, Archive, Share2
} from 'lucide-react';

export default function Estimator() {
  // Project State
  const [projects, setProjects] = useState([
    {
      id: 1,
      name: 'Main St Remodel',
      client: 'Wendy Smith',
      address: '123 Main St, San Francisco, CA',
      status: 'SENT',
      estimateNumber: '#EST-2024-001',
      total: 112275,
      createdDate: '2024-02-19',
      approvalDate: null,
      signatureDate: null,
      lineItems: []
    }
  ]);

  const [selectedProject, setSelectedProject] = useState(projects[0]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [darkMode, setDarkMode] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  // Financial Settings
  const [financialSettings, setFinancialSettings] = useState({
    taxRate: 8.5,
    laborRate: 65,
    markupPercentage: 25,
    contingencyPercentage: 5,
    depositPercentage: 50,
    profitMarginTarget: 20
  });

  // User Management
  const [users, setUsers] = useState([
    { id: 1, name: 'John Manager', email: 'john@company.com', role: 'Admin', status: 'Active' },
    { id: 2, name: 'Sarah Estimator', email: 'sarah@company.com', role: 'Estimator', status: 'Active' },
    { id: 3, name: 'Mike Viewer', email: 'mike@company.com', role: 'Viewer', status: 'Active' }
  ]);

  // Client Management
  const [clients, setClients] = useState([
    {
      id: 1,
      name: 'Wendy Smith',
      email: 'wendy@email.com',
      phone: '(415) 555-0123',
      address: '123 Main St, San Francisco, CA',
      pastProjects: 3,
      totalSpent: 45000,
      notes: 'Prefers morning meetings',
      communicationHistory: ['Estimate sent', 'Called 2/18', 'Approved 2/19']
    }
  ]);

  // Notifications
  const [notifications, setNotifications] = useState([
    { id: 1, type: 'email', title: 'Estimate approved', message: 'Wendy Smith approved estimate #EST-2024-001', read: false },
    { id: 2, type: 'sms', title: 'Task reminder', message: 'Follow up with client for signature', read: false },
    { id: 3, type: 'inApp', title: 'New user invited', message: 'Sarah joined the team', read: true }
  ]);

  // Analytics
  const [analytics, setAnalytics] = useState({
    totalEstimates: 47,
    acceptanceRate: 68,
    avgProjectValue: 85000,
    estimatedVsActualProfit: { estimated: 156000, actual: 142000 },
    winRateByType: { residential: 72, commercial: 65, remodel: 70 },
    conversionFunnel: { sent: 47, approved: 32, signed: 28 },
    forecastedRevenue: 425000
  });

  const bgClass = darkMode ? 'bg-slate-950 text-white' : 'bg-white text-slate-900';
  const cardClass = darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200';

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-slate-950' : 'bg-slate-50'} p-4 sm:p-6`}>
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Construction Estimator Pro</h1>
            <p className={darkMode ? 'text-slate-400' : 'text-slate-600'}>Complete estimation and contract management platform</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setDarkMode(!darkMode)}>
              {darkMode ? '☀️ Light' : '🌙 Dark'}
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>

        {/* Main Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mb-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 md:grid-cols-8">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="estimates">Estimates</TabsTrigger>
            <TabsTrigger value="line-items">Line Items</TabsTrigger>
            <TabsTrigger value="clients">Clients</TabsTrigger>
            <TabsTrigger value="contracts">Contracts</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* DASHBOARD TAB */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Financial Cards */}
              <Card className={cardClass}>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <DollarSign className="w-8 h-8 mx-auto mb-2 text-green-500" />
                    <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Total Revenue</p>
                    <p className="text-2xl font-bold">${analytics.forecastedRevenue.toLocaleString()}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className={cardClass}>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <TrendingUp className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                    <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Profit Margin</p>
                    <p className="text-2xl font-bold">{financialSettings.profitMarginTarget}%</p>
                  </div>
                </CardContent>
              </Card>

              <Card className={cardClass}>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <CheckCircle className="w-8 h-8 mx-auto mb-2 text-purple-500" />
                    <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Win Rate</p>
                    <p className="text-2xl font-bold">{analytics.acceptanceRate}%</p>
                  </div>
                </CardContent>
              </Card>

              <Card className={cardClass}>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Calendar className="w-8 h-8 mx-auto mb-2 text-orange-500" />
                    <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Active Projects</p>
                    <p className="text-2xl font-bold">{analytics.totalEstimates}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card className={cardClass}>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  New Estimate
                </Button>
                <Button variant="outline">
                  <FileText className="w-4 h-4 mr-2" />
                  Templates
                </Button>
                <Button variant="outline">
                  <Users className="w-4 h-4 mr-2" />
                  Invite User
                </Button>
                <Button variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Export Report
                </Button>
              </CardContent>
            </Card>

            {/* Recent Estimates */}
            <Card className={cardClass}>
              <CardHeader>
                <CardTitle>Recent Estimates</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {projects.map(project => (
                    <div key={project.id} className={`p-4 rounded-lg flex justify-between items-center border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                      <div>
                        <p className="font-semibold">{project.estimateNumber}</p>
                        <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>{project.client} - {project.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">${project.total.toLocaleString()}</p>
                        <p className={`text-sm px-2 py-1 rounded ${project.status === 'SENT' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                          {project.status}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ESTIMATES TAB */}
          <TabsContent value="estimates" className="space-y-6">
            <Card className={cardClass}>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>All Estimates</CardTitle>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" />
                    New Estimate
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {projects.map(project => (
                    <div key={project.id} className={`p-4 rounded-lg border ${darkMode ? 'bg-slate-800 border-slate-700 hover:bg-slate-700' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'} cursor-pointer transition`} onClick={() => setSelectedProject(project)}>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-bold text-lg">{project.estimateNumber}</p>
                          <p className={darkMode ? 'text-slate-400' : 'text-slate-600'}>{project.client}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold">${project.total.toLocaleString()}</p>
                          <p className={`text-sm px-3 py-1 rounded font-semibold ${
                            project.status === 'SENT' ? 'bg-yellow-100 text-yellow-800' : 
                            project.status === 'APPROVED' ? 'bg-blue-100 text-blue-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {project.status}
                          </p>
                        </div>
                      </div>
                      <p className={`text-sm ${darkMode ? 'text-slate-500' : 'text-slate-600'}`}>{project.address}</p>
                      <div className="flex gap-2 mt-3">
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit2 className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        <Button variant="outline" size="sm">
                          <Send className="w-4 h-4 mr-1" />
                          Send
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="w-4 h-4 mr-1" />
                          Download
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* LINE ITEMS TAB */}
          <TabsContent value="line-items" className="space-y-6">
            <Card className={cardClass}>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Line Item Management</CardTitle>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Item
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className={`border-b ${darkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                      <tr>
                        <th className="text-left py-3">Category</th>
                        <th className="text-left py-3">Description</th>
                        <th className="text-right py-3">Unit Cost</th>
                        <th className="text-right py-3">Qty</th>
                        <th className="text-right py-3">Unit</th>
                        <th className="text-right py-3">Markup</th>
                        <th className="text-right py-3">Total</th>
                        <th className="text-center py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className={`border-b ${darkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                        <td className="py-3">Demolition</td>
                        <td className="py-3">Remove wall</td>
                        <td className="text-right py-3">$1,200</td>
                        <td className="text-right py-3">1</td>
                        <td className="text-right py-3">ea</td>
                        <td className="text-right py-3">25%</td>
                        <td className="text-right py-3 font-bold">$1,500</td>
                        <td className="text-center py-3">
                          <Button variant="outline" size="sm" className="mr-1">
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                      <tr className={`border-b ${darkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                        <td className="py-3">Countertops</td>
                        <td className="py-3">Marble countertops</td>
                        <td className="text-right py-3">$125</td>
                        <td className="text-right py-3">22</td>
                        <td className="text-right py-3">lf</td>
                        <td className="text-right py-3">25%</td>
                        <td className="text-right py-3 font-bold">$3,437.50</td>
                        <td className="text-center py-3">
                          <Button variant="outline" size="sm" className="mr-1">
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="mt-6 pt-6 border-t space-y-2">
                  <div className="flex justify-between text-lg">
                    <span>Subtotal:</span>
                    <span className="font-bold">$89,819.98</span>
                  </div>
                  <div className="flex justify-between text-lg">
                    <span>Tax (8.5%):</span>
                    <span className="font-bold">$7,634.70</span>
                  </div>
                  <div className="flex justify-between text-xl font-bold text-green-600">
                    <span>Total:</span>
                    <span>$112,275.00</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* CLIENTS TAB */}
          <TabsContent value="clients" className="space-y-6">
            <Card className={cardClass}>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Client Management</CardTitle>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Client
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {clients.map(client => (
                  <div key={client.id} className={`p-4 rounded-lg border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="font-bold text-lg">{client.name}</p>
                        <p className={darkMode ? 'text-slate-400' : 'text-slate-600'}>{client.email}</p>
                        <p className={darkMode ? 'text-slate-400' : 'text-slate-600'}>{client.phone}</p>
                      </div>
                      <div>
                        <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Past Projects</p>
                        <p className="text-2xl font-bold">{client.pastProjects}</p>
                        <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Total Spent: ${client.totalSpent.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Notes</p>
                        <p className="text-sm mb-2">{client.notes}</p>
                        <p className={`text-xs ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>Communication: {client.communicationHistory.join(' • ')}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button variant="outline" size="sm">
                        <Edit2 className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm">
                        <FileText className="w-4 h-4 mr-1" />
                        Projects
                      </Button>
                      <Button variant="outline" size="sm">
                        <Send className="w-4 h-4 mr-1" />
                        Contact
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* CONTRACTS TAB */}
          <TabsContent value="contracts" className="space-y-6">
            <Card className={cardClass}>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Contract Management</CardTitle>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Upload Contract
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className={`p-6 rounded-lg border-2 border-dashed ${darkMode ? 'border-slate-700 bg-slate-800' : 'border-slate-300 bg-slate-50'} text-center`}>
                  <FileText className="w-12 h-12 mx-auto mb-3 text-blue-500" />
                  <p className="font-semibold mb-2">Drag and drop contract PDF</p>
                  <p className={`text-sm mb-4 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>or click to browse (max 32 MB)</p>
                  <Button variant="outline">Select File</Button>
                </div>

                <div className={`p-4 rounded-lg border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-bold">Home Improvement Contract</p>
                      <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Uploaded: 2024-02-19</p>
                    </div>
                    <p className="text-sm px-3 py-1 bg-green-100 text-green-800 rounded font-semibold">Active</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4 mr-1" />
                      Preview
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-1" />
                      Download
                    </Button>
                    <Button variant="outline" size="sm">
                      <Edit2 className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm">
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* USERS TAB */}
          <TabsContent value="users" className="space-y-6">
            <Card className={cardClass}>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>User Management</CardTitle>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Invite User
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className={`border-b ${darkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                      <tr>
                        <th className="text-left py-3">Name</th>
                        <th className="text-left py-3">Email</th>
                        <th className="text-left py-3">Role</th>
                        <th className="text-left py-3">Status</th>
                        <th className="text-center py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(user => (
                        <tr key={user.id} className={`border-b ${darkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                          <td className="py-3">{user.name}</td>
                          <td className="py-3">{user.email}</td>
                          <td className="py-3">
                            <span className={`px-3 py-1 rounded text-xs font-semibold ${
                              user.role === 'Admin' ? 'bg-red-100 text-red-800' :
                              user.role === 'Estimator' ? 'bg-blue-100 text-blue-800' :
                              'bg-slate-100 text-slate-800'
                            }`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="py-3">
                            <span className="px-3 py-1 rounded text-xs font-semibold bg-green-100 text-green-800">
                              {user.status}
                            </span>
                          </td>
                          <td className="text-center py-3">
                            <Button variant="outline" size="sm" className="mr-1">
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ANALYTICS TAB */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className={cardClass}>
                <CardContent className="pt-6">
                  <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Estimates Sent</p>
                  <p className="text-3xl font-bold">{analytics.totalEstimates}</p>
                  <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>This month</p>
                </CardContent>
              </Card>

              <Card className={cardClass}>
                <CardContent className="pt-6">
                  <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Acceptance Rate</p>
                  <p className="text-3xl font-bold">{analytics.acceptanceRate}%</p>
                  <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Win rate</p>
                </CardContent>
              </Card>

              <Card className={cardClass}>
                <CardContent className="pt-6">
                  <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Avg Project Value</p>
                  <p className="text-3xl font-bold">${(analytics.avgProjectValue / 1000).toFixed(0)}K</p>
                  <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Average</p>
                </CardContent>
              </Card>
            </div>

            <Card className={cardClass}>
              <CardHeader>
                <CardTitle>Profit Analysis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center pb-4 border-b">
                  <span>Estimated Profit:</span>
                  <span className="text-2xl font-bold text-green-600">${analytics.estimatedVsActualProfit.estimated.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Actual Profit:</span>
                  <span className="text-2xl font-bold text-blue-600">${analytics.estimatedVsActualProfit.actual.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center pt-4 border-t text-red-600">
                  <span>Variance:</span>
                  <span className="text-xl font-bold">-${(analytics.estimatedVsActualProfit.estimated - analytics.estimatedVsActualProfit.actual).toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>

            <Card className={cardClass}>
              <CardHeader>
                <CardTitle>Win Rate by Project Type</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(analytics.winRateByType).map(([type, rate]) => (
                  <div key={type}>
                    <div className="flex justify-between mb-1">
                      <span className="capitalize">{type}</span>
                      <span className="font-bold">{rate}%</span>
                    </div>
                    <div className={`w-full h-2 rounded-full ${darkMode ? 'bg-slate-700' : 'bg-slate-200'}`}>
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${rate}%` }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className={cardClass}>
              <CardHeader>
                <CardTitle>Conversion Funnel</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="font-semibold mb-2">Sent: {analytics.conversionFunnel.sent} estimates</p>
                  <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>↓ {Math.round((analytics.conversionFunnel.approved / analytics.conversionFunnel.sent) * 100)}% conversion</p>
                </div>
                <div>
                  <p className="font-semibold mb-2">Approved: {analytics.conversionFunnel.approved} estimates</p>
                  <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>↓ {Math.round((analytics.conversionFunnel.signed / analytics.conversionFunnel.approved) * 100)}% conversion</p>
                </div>
                <div>
                  <p className="font-semibold">{analytics.conversionFunnel.signed} signed contracts</p>
                </div>
              </CardContent>
            </Card>

            <Card className={cardClass}>
              <CardHeader>
                <CardTitle>Revenue Forecast</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-green-600 mb-2">${analytics.forecastedRevenue.toLocaleString()}</p>
                <p className={darkMode ? 'text-slate-400' : 'text-slate-600'}>Projected revenue for next quarter</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* SETTINGS TAB */}
          <TabsContent value="settings" className="space-y-6">
            <Card className={cardClass}>
              <CardHeader>
                <CardTitle>Financial Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Tax Rate (%)</label>
                    <Input
                      type="number"
                      value={financialSettings.taxRate}
                      onChange={(e) => setFinancialSettings({...financialSettings, taxRate: parseFloat(e.target.value)})}
                      className={darkMode ? 'bg-slate-700 border-slate-600' : ''}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Labor Rate ($/hr)</label>
                    <Input
                      type="number"
                      value={financialSettings.laborRate}
                      onChange={(e) => setFinancialSettings({...financialSettings, laborRate: parseFloat(e.target.value)})}
                      className={darkMode ? 'bg-slate-700 border-slate-600' : ''}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Markup Percentage (%)</label>
                    <Input
                      type="number"
                      value={financialSettings.markupPercentage}
                      onChange={(e) => setFinancialSettings({...financialSettings, markupPercentage: parseFloat(e.target.value)})}
                      className={darkMode ? 'bg-slate-700 border-slate-600' : ''}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Contingency (%)</label>
                    <Input
                      type="number"
                      value={financialSettings.contingencyPercentage}
                      onChange={(e) => setFinancialSettings({...financialSettings, contingencyPercentage: parseFloat(e.target.value)})}
                      className={darkMode ? 'bg-slate-700 border-slate-600' : ''}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Deposit Requirement (%)</label>
                    <Input
                      type="number"
                      value={financialSettings.depositPercentage}
                      onChange={(e) => setFinancialSettings({...financialSettings, depositPercentage: parseFloat(e.target.value)})}
                      className={darkMode ? 'bg-slate-700 border-slate-600' : ''}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Profit Margin Target (%)</label>
                    <Input
                      type="number"
                      value={financialSettings.profitMarginTarget}
                      onChange={(e) => setFinancialSettings({...financialSettings, profitMarginTarget: parseFloat(e.target.value)})}
                      className={darkMode ? 'bg-slate-700 border-slate-600' : ''}
                    />
                  </div>
                </div>
                <Button className="bg-blue-600 hover:bg-blue-700">Save Settings</Button>
              </CardContent>
            </Card>

            <Card className={cardClass}>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold flex items-center gap-2">
                      <Bell className="w-4 h-4" />
                      Email Notifications
                    </p>
                    <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Receive email alerts</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-5 h-5" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold flex items-center gap-2">
                      <Bell className="w-4 h-4" />
                      SMS Notifications
                    </p>
                    <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Receive text alerts</p>
                  </div>
                  <input type="checkbox" className="w-5 h-5" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold flex items-center gap-2">
                      <Bell className="w-4 h-4" />
                      In-App Notifications
                    </p>
                    <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>In-app alerts</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>

            <Card className={cardClass}>
              <CardHeader>
                <CardTitle>Security</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="outline" className="w-full">
                  <Lock className="w-4 h-4 mr-2" />
                  Change Password
                </Button>
                <Button variant="outline" className="w-full">
                  <Lock className="w-4 h-4 mr-2" />
                  Enable Two-Factor Authentication
                </Button>
                <Button variant="outline" className="w-full">
                  Data Encryption: Enabled ✓
                </Button>
              </CardContent>
            </Card>

            <Card className={cardClass}>
              <CardHeader>
                <CardTitle>Data & Privacy</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className={darkMode ? 'text-slate-400' : 'text-slate-600'}>
                  ✓ GDPR Compliant<br/>
                  ✓ Data Backed Up Daily<br/>
                  ✓ 30-Day Document Retention<br/>
                  ✓ Automatic Data Encryption
                </p>
                <Button variant="outline">Download Your Data</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
