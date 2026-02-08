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
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">Directory</h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5 sm:mt-1">Manage your team and contacts</p>
        </div>
        <Button className="bg-amber-600 hover:bg-amber-700 min-h-[44px] text-sm select-none">
          <UserPlus className="h-4 w-4 mr-1.5 sm:mr-2" />
          <span className="hidden sm:inline">Contact</span>
          <span className="sm:hidden">Add</span>
        </Button>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 text-sm min-h-[44px]"
          />
        </div>
        <Button variant="outline" className="hidden sm:flex">Filter</Button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-2.5 sm:p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-2">
          <Users className="h-4 sm:h-5 w-4 sm:w-5 text-blue-600 flex-shrink-0" />
          <span className="text-xs sm:text-sm text-blue-900">
            <strong>69,999</strong> Licenses | <strong>1</strong> Used | <strong>9,998</strong> Available
          </span>
        </div>
        <Button size="sm" variant="outline" className="text-xs">Upgrade</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 sm:gap-4">
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

      <Card className="border-amber-100">
        <CardContent className="p-0">
          {/* Mobile View */}
          <div className="sm:hidden space-y-2 p-3">
            {filteredWorkers.map((worker) => (
              <div key={worker.id} className="border-b border-amber-100 pb-2.5 last:border-0">
                <div className="flex items-start gap-2 mb-1.5">
                  <div className="h-7 w-7 rounded-full bg-amber-200 flex items-center justify-center text-xs font-medium flex-shrink-0">
                    {worker.name?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-xs text-slate-900 truncate">{worker.name}</p>
                    <p className="text-xs text-slate-600 truncate">{worker.company || 'Direct'}</p>
                  </div>
                  {worker.productivity_score >= 90 && <Star className="h-3.5 w-3.5 text-yellow-500 flex-shrink-0" />}
                </div>
                <div className="text-xs text-slate-600 flex gap-2">
                  <span className="flex-1 truncate">{worker.phone || '-'}</span>
                  <Badge variant="outline" className="text-xs flex-shrink-0">{worker.company ? 'Contractor' : 'Employee'}</Badge>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop View */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-amber-50 border-b border-amber-100">
                <tr>
                  <th className="text-left py-2.5 px-3 text-xs font-medium text-slate-600">Company</th>
                  <th className="text-left py-2.5 px-3 text-xs font-medium text-slate-600">Name</th>
                  <th className="text-left py-2.5 px-3 text-xs font-medium text-slate-600">Phone</th>
                  <th className="text-left py-2.5 px-3 text-xs font-medium text-slate-600">Type</th>
                  <th className="text-center py-2.5 px-3 text-xs font-medium text-slate-600"></th>
                </tr>
              </thead>
              <tbody>
                {filteredWorkers.map((worker) => (
                  <tr key={worker.id} className="border-b border-amber-100 hover:bg-amber-50">
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1.5">
                        {worker.company && <Building2 className="h-3 w-3 text-slate-400" />}
                        <span className="font-medium text-xs">{worker.company || '-'}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-amber-200 flex items-center justify-center text-xs font-medium">
                          {worker.name?.[0]}
                        </div>
                        <span className="text-xs">{worker.name}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-xs text-slate-600">{worker.phone || '-'}</td>
                    <td className="py-2.5 px-3">
                      <Badge variant="outline" className="text-xs">{worker.company ? 'Contractor' : 'Employee'}</Badge>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {worker.productivity_score >= 90 && <Star className="h-3.5 w-3.5 text-yellow-500 inline" />}
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