import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, UserPlus, Users, Building2, Mail, Phone, MapPin, Star } from 'lucide-react';

export default function Directory() {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: workers = [] } = useQuery({
    queryKey: ['workers'],
    queryFn: () => base44.entities.Worker.list('-created_date')
  });

  const filteredWorkers = workers.filter(w =>
    w.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.role?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.company?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const contactCounts = {
    users: workers.filter(w => w.role === 'engineer' || w.role === 'supervisor').length,
    contractors: workers.filter(w => w.company).length,
    customers: 5,
    employees: workers.filter(w => !w.company).length,
    leads: 4,
    misc: 2,
    vendors: 4
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Directory</h1>
          <p className="text-slate-500 mt-1">Manage contacts and team members</p>
        </div>
        <Button>
          <UserPlus className="h-4 w-4 mr-2" />
          Contact
        </Button>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search for Contacts"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline">Filter</Button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-blue-600" />
          <span className="text-sm text-blue-900">
            Purchased Licenses: <strong>69999</strong> | Used Licenses: <strong>#1</strong> | Available Licenses: <strong>#9998</strong>
          </span>
        </div>
        <Button size="sm" variant="outline">Upgrade</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Contacts by Type</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm">Users</span>
              <Badge variant="outline">{contactCounts.users}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Contractors</span>
              <Badge variant="outline">{contactCounts.contractors}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Customers</span>
              <Badge variant="outline">{contactCounts.customers}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Employees</span>
              <Badge variant="outline">{contactCounts.employees}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Leads</span>
              <Badge variant="outline">{contactCounts.leads}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Misc. Contacts</span>
              <Badge variant="outline">{contactCounts.misc}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Vendors</span>
              <Badge variant="outline">{contactCounts.vendors}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Certificates Expiring (Within 60 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-8 text-slate-400">
              <p>No Records Available</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Upcoming Days Off</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-8 text-slate-400">
              <p>No Records Available</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Company</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Name</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Phone</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Cell</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Address</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Type</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-slate-600"></th>
                </tr>
              </thead>
              <tbody>
                {filteredWorkers.map((worker) => (
                  <tr key={worker.id} className="border-b hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {worker.company && <Building2 className="h-4 w-4 text-slate-400" />}
                        <span className="font-medium">{worker.company || '-'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-sm font-medium">
                          {worker.name?.[0]}
                        </div>
                        <span>{worker.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{worker.phone || '-'}</td>
                    <td className="py-3 px-4 text-slate-600">{worker.phone || '-'}</td>
                    <td className="py-3 px-4 text-slate-600">-</td>
                    <td className="py-3 px-4">
                      <Badge variant="outline">{worker.company ? 'Contractor' : 'Employee'}</Badge>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {worker.productivity_score >= 90 && <Star className="h-4 w-4 text-yellow-500 inline" />}
                      <button className="text-slate-400 hover:text-slate-600 ml-2">⋮</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}