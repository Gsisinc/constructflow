import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { motion } from 'framer-motion';
import { BookOpen, Award, Clock, TrendingUp, AlertTriangle, CheckCircle2, Zap } from 'lucide-react';

export default function TechnicianPortal() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      const userData = await base44.auth.me();
      setUser(userData);
    };
    loadUser();
  }, []);

  const { data: profile = {} } = useQuery({
    queryKey: ['techProfile', user?.email],
    queryFn: () => user?.email ? 
      base44.entities.TechnicianProfile.filter({ email: user.email }).then(r => r[0] || {}) : 
      Promise.resolve({}),
    enabled: !!user?.email,
  });

  const { data: certifications = [] } = useQuery({
    queryKey: ['techCerts', user?.email],
    queryFn: () => user?.email ? base44.entities.TechnicianCertification.filter({ technician_email: user.email }) : [],
    enabled: !!user?.email,
  });

  const { data: fieldHours = [] } = useQuery({
    queryKey: ['fieldHours', user?.email],
    queryFn: () => user?.email ? base44.entities.FieldHoursLog.filter({ technician_email: user.email }) : [],
    enabled: !!user?.email,
  });

  const { data: skills = [] } = useQuery({
    queryKey: ['skills', user?.email],
    queryFn: () => user?.email ? base44.entities.SkillsMatrix.filter({ technician_email: user.email }) : [],
    enabled: !!user?.email,
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ['assignments', user?.email],
    queryFn: () => user?.email ? base44.entities.CourseAssignment.filter({ technician_email: user.email }) : [],
    enabled: !!user?.email,
  });

  if (!user) return <div className="p-6">Loading...</div>;

  const totalFieldHours = fieldHours.reduce((sum, log) => sum + (log.hours || 0), 0);
  const validCerts = certifications.filter(c => c.status === 'valid').length;
  const expiringCerts = certifications.filter(c => c.status === 'expiring_soon');
  const activeCourses = assignments.filter(a => a.status === 'in_progress');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900">Your Training Portal</h1>
          <p className="text-slate-600">Track your progress, certifications, and skills</p>
        </motion.div>

        {/* Alerts */}
        {expiringCerts.length > 0 && (
          <Alert className="mb-6 bg-amber-50 border-amber-200">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              {expiringCerts.length} certification(s) expiring soon. Schedule renewal!
            </AlertDescription>
          </Alert>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Current Level</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-blue-600">{profile.current_level || 0}/6</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Certifications</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-green-600">{validCerts}</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Field Hours</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-purple-600">{totalFieldHours}</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Active Courses</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-orange-600">{activeCourses.length}</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="certifications">Certifications</TabsTrigger>
            <TabsTrigger value="skills">Skills</TabsTrigger>
            <TabsTrigger value="fieldHours">Field Hours</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Level Progress</CardTitle>
                <CardDescription>Your journey to Level {(profile.current_level || 0) + 1}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <p className="text-sm font-medium">Level {profile.current_level || 0} Completion</p>
                      <p className="text-xs text-slate-500">{Math.round((activeCourses.length / 6) * 100)}%</p>
                    </div>
                    <Progress value={(activeCourses.length / 6) * 100} className="h-3" />
                  </div>
                  <p className="text-sm text-slate-600">
                    {activeCourses.length} of 6 modules completed for this level
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Active Courses
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activeCourses.length > 0 ? (
                  <div className="space-y-3">
                    {activeCourses.map(course => (
                      <div key={course.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                        <div>
                          <p className="font-medium text-slate-900">{course.course_title}</p>
                          <p className="text-xs text-slate-600">Due: {new Date(course.due_date).toLocaleDateString()}</p>
                        </div>
                        <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 text-center py-6">No active courses</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Certifications Tab */}
          <TabsContent value="certifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  Your Certifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                {certifications.length > 0 ? (
                  <div className="space-y-3">
                    {certifications.map(cert => (
                      <motion.div
                        key={cert.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={`p-4 rounded-lg border-2 ${
                          cert.status === 'valid'
                            ? 'bg-green-50 border-green-200'
                            : cert.status === 'expiring_soon'
                            ? 'bg-amber-50 border-amber-200'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold text-slate-900">{cert.cert_name}</p>
                            <p className="text-sm text-slate-600">{cert.issuing_body}</p>
                            <p className="text-xs text-slate-500 mt-1">
                              Earned: {new Date(cert.date_earned).toLocaleDateString()}
                            </p>
                            {cert.expiration_date && (
                              <p className="text-xs text-slate-500">
                                Expires: {new Date(cert.expiration_date).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                          <Badge
                            className={
                              cert.status === 'valid'
                                ? 'bg-green-100 text-green-800'
                                : cert.status === 'expiring_soon'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-800'
                            }
                          >
                            {cert.status}
                          </Badge>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 text-center py-6">No certifications yet. Start your training!</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Skills Tab */}
          <TabsContent value="skills" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Skills Assessment
                </CardTitle>
                <CardDescription>1 = Beginner, 5 = Expert</CardDescription>
              </CardHeader>
              <CardContent>
                {skills.length > 0 ? (
                  <div className="space-y-6">
                    {['cabling', 'access_control', 'cctv', 'fire_alarm', 'isp'].map(category => {
                      const categorySkills = skills.filter(s => s.skill_category === category);
                      if (categorySkills.length === 0) return null;
                      return (
                        <div key={category}>
                          <h3 className="font-semibold text-slate-900 mb-3 capitalize">
                            {category.replace('_', ' ')}
                          </h3>
                          <div className="space-y-3">
                            {categorySkills.map(skill => (
                              <div key={skill.id}>
                                <div className="flex items-center justify-between mb-1">
                                  <p className="text-sm font-medium text-slate-700">{skill.skill_name}</p>
                                  <div className="flex gap-2">
                                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                      You: {skill.self_rating}/5
                                    </span>
                                    {skill.supervisor_rating && (
                                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                        Supervisor: {skill.supervisor_rating}/5
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <div className="flex-1">
                                    <Progress value={(skill.self_rating / 5) * 100} className="h-2" />
                                  </div>
                                  {skill.gap_notes && (
                                    <div className="text-xs text-amber-600">⚠ Gap</div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-slate-500 text-center py-6">No skills assessed yet</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Field Hours Tab */}
          <TabsContent value="fieldHours" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Field Hours Log
                </CardTitle>
                <CardDescription>Total: {totalFieldHours} hours logged</CardDescription>
              </CardHeader>
              <CardContent>
                {fieldHours.length > 0 ? (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {fieldHours.map(log => (
                      <motion.div
                        key={log.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-slate-900">{log.project_name}</p>
                          <p className="text-xs text-slate-600">
                            {new Date(log.date).toLocaleDateString()} • {log.task_type}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-blue-600">{log.hours}h</p>
                          {log.approved && (
                            <Badge className="bg-green-100 text-green-800 text-xs mt-1">Approved</Badge>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 text-center py-6">No field hours logged yet</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}