import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TableSkeleton } from '@/components/skeleton/SkeletonComponents';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';

export default function TimeCards() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">Time Cards</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 sm:mt-1">Track and manage crew time</p>
        </div>
        <div className="flex gap-1.5 sm:gap-2 flex-wrap">
          <Button variant="outline" size="sm" className="text-xs sm:text-sm h-9 sm:h-10">Time Card</Button>
          <Button variant="outline" size="sm" className="text-xs sm:text-sm h-9 sm:h-10">Crew Card</Button>
          <Button variant="outline" size="sm" className="text-xs sm:text-sm h-9 sm:h-10">Crew Sheet</Button>
          <Button size="sm" className="text-xs sm:text-sm h-9 sm:h-10">Weekly Sheet</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">
              {format(selectedMonth, 'MMMM yyyy')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              month={selectedMonth}
              onMonthChange={setSelectedMonth}
              className="rounded-md"
            />
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 bg-red-500 rounded"></div>
                <span className="text-slate-600">Injury</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                <span className="text-slate-600">Modified</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                <span className="text-slate-600">Location</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span className="text-slate-600">Verified</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats & Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Time Cards Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Last Week vs This Week</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold">0:00</span>
                    <span className="text-slate-600">Me</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold">0:00</span>
                    <span className="text-slate-600">Team</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-slate-600 mb-1">Total (Hrs)</p>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Regular Time</span>
                      <span className="font-medium">0:00</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Overtime</span>
                      <span className="font-medium">0:00</span>
                    </div>
                    <div className="flex justify-between font-semibold">
                      <span>Total (Hrs)</span>
                      <span>0:00</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Upcoming Days Off</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-8 text-slate-400">
                <p>No cards for the selected period</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Time Spent on Current Projects</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-8 text-slate-400">
                <p>No time entries</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>
                Current Week Timesheet
                <p className="text-sm font-normal text-slate-500">
                  {format(new Date(), 'MMM dd')} - {format(new Date(), 'MMM dd, yyyy')}
                </p>
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">Current Week Timesheet</Button>
                <Button variant="outline" size="sm">Detailed Activity Log</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto text-xs sm:text-sm">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-slate-600">Employee</th>
                      <th className="text-center py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-slate-600">Mon</th>
                       <th className="text-center py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-slate-600">Tue</th>
                       <th className="text-center py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-slate-600">Wed</th>
                       <th className="text-center py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-slate-600">Thu</th>
                       <th className="text-center py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-slate-600">Fri</th>
                       <th className="text-right py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-slate-600">Total Hours</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                       <td className="py-2 sm:py-3 px-2 sm:px-4">
                         <div className="font-medium text-xs sm:text-sm">Total Hours</div>
                       </td>
                       <td className="text-center py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm">00:00</td>
                       <td className="text-center py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm">00:00</td>
                       <td className="text-center py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm">00:00</td>
                       <td className="text-center py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm">00:00</td>
                       <td className="text-center py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm">00:00</td>
                       <td className="text-right py-2 sm:py-3 px-2 sm:px-4 font-semibold text-xs sm:text-sm">00:00</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}