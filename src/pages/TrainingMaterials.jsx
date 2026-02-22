import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { FileText, Play, BookOpen, Zap, Download, Plus } from 'lucide-react';

const materialIcons = {
  presentation: <FileText className="w-5 h-5" />,
  handout: <BookOpen className="w-5 h-5" />,
  video: <Play className="w-5 h-5" />,
  practical_kit: <Zap className="w-5 h-5" />,
  exam: <FileText className="w-5 h-5" />,
  lesson_plan: <BookOpen className="w-5 h-5" />
};

const materialColors = {
  presentation: 'bg-blue-100 text-blue-800',
  handout: 'bg-green-100 text-green-800',
  video: 'bg-purple-100 text-purple-800',
  practical_kit: 'bg-orange-100 text-orange-800',
  exam: 'bg-red-100 text-red-800',
  lesson_plan: 'bg-indigo-100 text-indigo-800'
};

export default function TrainingMaterials() {
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

  const { data: materials = [] } = useQuery({
    queryKey: ['materials', organization?.id],
    queryFn: () => organization?.id ? base44.entities.TrainingMaterial.filter({}) : [],
    enabled: !!organization?.id,
  });

  const { data: levels = [] } = useQuery({
    queryKey: ['levels', organization?.id],
    queryFn: () => organization?.id ? base44.entities.CourseLevel.filter({ organization_id: organization.id }).then(r => r.sort((a, b) => a.level_number - b.level_number)) : [],
    enabled: !!organization?.id,
  });

  if (!user || !organization) return <div className="p-6">Loading...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">Training Materials Library</h1>
            <p className="text-slate-600">Presentations, handouts, videos, and exams</p>
          </div>
          {user?.role === 'admin' && (
            <Button className="bg-blue-600 hover:bg-blue-700 gap-2">
              <Plus className="w-4 h-4" /> Add Material
            </Button>
          )}
        </motion.div>

        <Tabs defaultValue="level1" className="w-full">
          <TabsList className="grid w-full grid-cols-6 mb-6">
            {levels.map(level => (
              <TabsTrigger key={level.id} value={`level${level.level_number}`}>
                Level {level.level_number}
              </TabsTrigger>
            ))}
          </TabsList>

          {levels.map(level => {
            const levelCourses = courses.filter(c => c.level_id === level.id).sort((a, b) => (a.sequence_in_level || 0) - (b.sequence_in_level || 0));
            return (
              <TabsContent key={level.id} value={`level${level.level_number}`} className="space-y-6">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <Card>
                    <CardHeader>
                      <CardTitle>{level.title}</CardTitle>
                      <CardDescription>{levelCourses.length} courses • {level.duration_weeks} weeks • {level.required_field_hours} field hours required</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {levelCourses.map((course, idx) => {
                          const courseMaterials = materials.filter(m => m.course_id === course.id && m.status !== 'archived');
                          const materialsByType = {};
                          courseMaterials.forEach(m => {
                            if (!materialsByType[m.material_type]) materialsByType[m.material_type] = [];
                            materialsByType[m.material_type].push(m);
                          });

                          return (
                            <motion.div
                              key={course.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: idx * 0.05 }}
                              className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                            >
                              <div className="flex items-start justify-between mb-4">
                                <div>
                                  <h3 className="font-semibold text-slate-900">{course.module_number} - {course.title}</h3>
                                  <p className="text-sm text-slate-600 mt-1">{course.description}</p>
                                </div>
                                <div className="text-right text-xs text-slate-500">
                                  <p>{course.duration_hours}h</p>
                                </div>
                              </div>

                              {Object.keys(materialsByType).length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                  {Object.entries(materialsByType).map(([type, mats]) => (
                                    <div key={type} className="space-y-2">
                                      <div className="flex items-center gap-2 mb-2">
                                        {materialIcons[type]}
                                        <span className="text-sm font-semibold capitalize text-slate-700">{type.replace('_', ' ')}</span>
                                      </div>
                                      {mats.map(mat => (
                                        <div key={mat.id} className="flex items-center justify-between bg-slate-50 p-2 rounded">
                                          <div className="flex-1 min-w-0">
                                            <p className="text-xs font-medium text-slate-900 truncate">{mat.title}</p>
                                            {mat.duration_minutes && <p className="text-xs text-slate-500">{mat.duration_minutes}min</p>}
                                          </div>
                                          {mat.file_url && (
                                            <a href={mat.file_url} target="_blank" rel="noopener noreferrer" className="ml-2">
                                              <Download className="w-4 h-4 text-blue-600 hover:text-blue-800" />
                                            </a>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-slate-500 italic">No materials uploaded yet</p>
                              )}
                            </motion.div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>
            );
          })}
        </Tabs>
      </div>
    </div>
  );
}