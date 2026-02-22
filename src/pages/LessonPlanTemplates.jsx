import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion } from 'framer-motion';
import { FileText, Clock, Users, BookOpen, Plus } from 'lucide-react';

const lessonPlanTemplate = {
  objectivesStructure: ['Knowledge (Bloom\'s K)', 'Comprehension', 'Application', 'Analysis'],
  timeAllocation: ['Introduction (5-10%)', 'Content Delivery (50-60%)', 'Practice/Lab (20-30%)', 'Assessment (10-15%)'],
  deliveryMethods: ['Lecture', 'Demonstration', 'Lab/Hands-on', 'Group Discussion', 'Video', 'Q&A'],
};

export default function LessonPlanTemplates() {
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

  const { data: courses = [] } = useQuery({
    queryKey: ['courses', organization?.id],
    queryFn: () => organization?.id ? base44.entities.TrainingCourse.filter({ organization_id: organization.id }) : [],
    enabled: !!organization?.id,
  });

  const { data: levels = [] } = useQuery({
    queryKey: ['levels', organization?.id],
    queryFn: () => organization?.id ? base44.entities.CourseLevel.filter({ organization_id: organization.id }).then(r => r.sort((a, b) => a.level_number - b.level_number)) : [],
    enabled: !!organization?.id,
  });

  if (!user || !organization) return <div className="p-6">Loading...</div>;

  const sampleLessonPlans = [
    {
      id: '1',
      module: '1.1',
      title: 'Industry Overview & Safety Introduction',
      duration: 4,
      instructor: 'John Smith',
      objectives: ['Understand construction industry structure', 'Learn basic safety principles'],
      materials: ['PowerPoint presentation', 'Safety handbook', 'Video: Industry overview'],
    },
    {
      id: '2',
      module: '2.3',
      title: 'Cable Pathway Installation',
      duration: 6,
      instructor: 'Jane Doe',
      objectives: ['Install conduit systems', 'Run cable in pathways', 'Follow code requirements'],
      materials: ['Lab equipment', 'Code references', 'Installation manual', 'Safety gear'],
    },
    {
      id: '3',
      module: '3.4',
      title: 'System Programming Basics',
      duration: 4,
      instructor: 'Mike Johnson',
      objectives: ['Understand programming concepts', 'Program basic system functions', 'Test functionality'],
      materials: ['Programming software', 'Code samples', 'Reference materials', 'Lab switches'],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">Lesson Plan Templates</h1>
            <p className="text-slate-600">Standardized teaching plans for each module</p>
          </div>
          {user?.role === 'admin' && (
            <Button className="bg-blue-600 hover:bg-blue-700 gap-2">
              <Plus className="w-4 h-4" /> New Lesson Plan
            </Button>
          )}
        </motion.div>

        <Tabs defaultValue="templates" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="templates">Lesson Plans ({sampleLessonPlans.length})</TabsTrigger>
            <TabsTrigger value="structure">Plan Structure</TabsTrigger>
          </TabsList>

          <TabsContent value="templates" className="space-y-4">
            {sampleLessonPlans.map((plan, idx) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className="bg-blue-100 text-blue-800">Module {plan.module}</Badge>
                          <Badge variant="outline">{plan.duration}h</Badge>
                        </div>
                        <CardTitle>{plan.title}</CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-2">
                          <Users className="w-4 h-4" />
                          {plan.instructor}
                        </CardDescription>
                      </div>
                      <Button variant="outline" size="sm">View</Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                          <BookOpen className="w-4 h-4" /> Learning Objectives
                        </h4>
                        <ul className="space-y-1 text-sm text-slate-700">
                          {plan.objectives.map((obj, i) => (
                            <li key={i} className="flex gap-2">
                              <span className="text-blue-600">•</span>
                              <span>{obj}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                          <FileText className="w-4 h-4" /> Materials Required
                        </h4>
                        <ul className="space-y-1 text-sm text-slate-700">
                          {plan.materials.map((mat, i) => (
                            <li key={i} className="flex gap-2">
                              <span className="text-green-600">✓</span>
                              <span>{mat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </TabsContent>

          <TabsContent value="structure" className="space-y-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    Standard Lesson Plan Structure
                  </CardTitle>
                  <CardDescription>Template followed for all training modules</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold text-slate-900 mb-3">1. Learning Objectives</h4>
                      <p className="text-sm text-slate-600 mb-3">Define what students will be able to do after the lesson:</p>
                      <div className="space-y-2">
                        {lessonPlanTemplate.objectivesStructure.map((obj, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm text-slate-700">
                            <div className="w-2 h-2 bg-blue-600 rounded-full" />
                            <span>{obj}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        2. Time Allocation
                      </h4>
                      <p className="text-sm text-slate-600 mb-3">Suggested breakdown for a standard session:</p>
                      <div className="space-y-2">
                        {lessonPlanTemplate.timeAllocation.map((time, i) => (
                          <div key={i} className="flex items-center justify-between text-sm text-slate-700 p-2 bg-slate-50 rounded">
                            <span>{time.split('(')[0].trim()}</span>
                            <span className="text-slate-500">{time.match(/\((.*?)\)/)?.[1]}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold text-slate-900 mb-3">3. Delivery Methods</h4>
                      <p className="text-sm text-slate-600 mb-3">Approved teaching approaches:</p>
                      <div className="flex flex-wrap gap-2">
                        {lessonPlanTemplate.deliveryMethods.map((method, i) => (
                          <Badge key={i} variant="outline">{method}</Badge>
                        ))}
                      </div>
                    </div>

                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold text-slate-900 mb-3">4. Assessment Methods</h4>
                      <ul className="space-y-1 text-sm text-slate-700">
                        <li className="flex gap-2">
                          <span>✓</span> <span>Practical demonstration</span>
                        </li>
                        <li className="flex gap-2">
                          <span>✓</span> <span>Written exam (80% passing required)</span>
                        </li>
                        <li className="flex gap-2">
                          <span>✓</span> <span>Field hours logged (supervisor approval)</span>
                        </li>
                        <li className="flex gap-2">
                          <span>✓</span> <span>Skills assessment (1-5 rating)</span>
                        </li>
                      </ul>
                    </div>

                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold text-slate-900 mb-3">5. Required Materials</h4>
                      <ul className="space-y-1 text-sm text-slate-700">
                        <li className="flex gap-2">
                          <span>•</span> <span>Lesson plan document</span>
                        </li>
                        <li className="flex gap-2">
                          <span>•</span> <span>Presentation slides</span>
                        </li>
                        <li className="flex gap-2">
                          <span>•</span> <span>Student handouts</span>
                        </li>
                        <li className="flex gap-2">
                          <span>•</span> <span>Instructor guide</span>
                        </li>
                        <li className="flex gap-2">
                          <span>•</span> <span>Lab/demonstration equipment</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}