import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { Calendar, Users, Clock } from 'lucide-react';

const scheduleData = [
  { month: 1, week: 1, level: 1, days: ['1.1 Industry Overview (4h)', '1.2 Safety Part 1 (4h)', '1.2 Safety Part 2 (4h)', '1.2 Safety Exam (4h)', '1.3 Tools Part 1 (4h)'], fieldHours: 0 },
  { month: 1, week: 2, level: 1, days: ['1.3 Tools Part 2 (4h)', '1.3 Tools Practical (4h)', '1.4 Materials ID (4h)', '1.4 Materials Practical (4h)', '1.5 Blueprint Reading (4h)'], fieldHours: 0 },
  { month: 2, week: 5, level: 2, days: ['2.1 Codes (4h)', '2.2 Pathways Lecture (4h)', '2.2 Pathways Lab (4h)', '2.2 Pathways Lab (4h)', '2.2 Practical Exam'], fieldHours: 0 },
  { month: 3, week: 9, level: 2, days: ['Level 2 Written Exam', 'BICSI Installer 1 Prep', 'BICSI Installer 1 Prep', 'Field', 'Field'], fieldHours: 16 },
  { month: 4, week: 13, level: 3, days: ['3.4 Programming Lab (4h)', '3.4 Programming Lab (4h)', '3.4 Practical Exam', '3.5 CCTV Fund. (4h)', '3.5 Lab (4h)'], fieldHours: 0 },
  { month: 5, week: 17, level: 4, days: ['4.1 Fire Fund. (4h)', '4.1 Lab (4h)', '4.2 Install Lecture (4h)', '4.2 Install Lab (4h)', '4.2 Install Lab (4h)'], fieldHours: 0 },
];

export default function TrainingSchedule() {
  const [user, setUser] = useState(null);
  const [organization, setOrganization] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      const userData = await base44.auth.me();
      setUser(userData);
      if (userData?.organization_id) {
        const orgs = await base44.entities.Organization.filter({ id: userData.organization_id });
        setOrganization(orgs[0]);
      }
    };
    loadUser();
  }, []);

  const { data: scheduleItems = [] } = useQuery({
    queryKey: ['schedule', organization?.id],
    queryFn: () => organization?.id ? base44.entities.TrainingScheduleItem.filter({}) : [],
    enabled: !!organization?.id,
  });

  if (!user || !organization) return <div className="p-6">Loading...</div>;

  const displaySchedule = scheduleItems.length > 0 ? scheduleItems : scheduleData;

  const byMonth = {};
  displaySchedule.forEach(item => {
    const month = item.month || 1;
    if (!byMonth[month]) byMonth[month] = [];
    byMonth[month].push(item);
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900">26-Week Training Schedule</h1>
          <p className="text-slate-600">Level 1 through Level 6 certification roadmap</p>
        </motion.div>

        <div className="space-y-6">
          {Object.entries(byMonth).map(([monthNum, items]) => {
            const monthNames = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July'];
            return (
              <motion.div key={monthNum} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      Month {monthNum}: {monthNames[monthNum]}
                    </CardTitle>
                    <CardDescription>Weeks {items[0].week_number} - {items[items.length - 1].week_number}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {items.map(week => (
                        <div key={week.id || `${week.month}-${week.week}`} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="font-semibold text-slate-900">Week {week.week_number}</h3>
                              <p className="text-sm text-slate-600">{week.course_title || 'Training Week'}</p>
                            </div>
                            <div className="flex gap-2">
                              <Badge className="bg-blue-100 text-blue-800">Level {week.level_number || 1}</Badge>
                              {week.field_hours > 0 && (
                                <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
                                  <Clock className="w-3 h-3" /> {week.field_hours}h Field
                                </Badge>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-5 gap-2">
                            {['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].map((day, idx) => (
                              <div key={day} className="bg-slate-50 p-2 rounded text-xs">
                                <p className="font-semibold text-slate-700 capitalize mb-1">{day.slice(0, 3)}</p>
                                <p className="text-slate-600 text-xs">{week[day] || 'Off'}</p>
                              </div>
                            ))}
                          </div>

                          {week.instructor && (
                            <div className="mt-3 pt-3 border-t text-xs text-slate-600 flex items-center gap-2">
                              <Users className="w-4 h-4" />
                              Instructor: {week.instructor}
                              {week.location && ` • ${week.location}`}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        <Card className="mt-8 bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle>Training Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-slate-600 mb-1">Total Weeks</p>
                <p className="text-2xl font-bold text-blue-600">26</p>
              </div>
              <div>
                <p className="text-slate-600 mb-1">Total Classroom Hours</p>
                <p className="text-2xl font-bold text-blue-600">520+</p>
              </div>
              <div>
                <p className="text-slate-600 mb-1">Total Field Hours</p>
                <p className="text-2xl font-bold text-blue-600">320+</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}