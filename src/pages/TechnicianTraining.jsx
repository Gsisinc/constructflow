import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { BookOpen, CheckCircle2, Clock, Zap, Award } from 'lucide-react';
import { motion } from 'framer-motion';

export default function TechnicianTraining() {
  const [user, setUser] = useState(null);
  const [currentTechnician, setCurrentTechnician] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      const userData = await base44.auth.me();
      setUser(userData);
    };
    loadUser();
  }, []);

  const { data: assignments = [] } = useQuery({
    queryKey: ['courseAssignments', user?.email],
    queryFn: () => user?.email ? base44.entities.CourseAssignment.filter({ technician_email: user.email }) : [],
    enabled: !!user?.email,
  });

  const { data: technicianProfile } = useQuery({
    queryKey: ['technicianProfile', user?.email],
    queryFn: () => user?.email ? base44.entities.TechnicianProfile.filter({ email: user.email }) : [],
    enabled: !!user?.email,
  });

  if (!user) return <div className="p-6">Loading...</div>;

  const techProfile = technicianProfile?.[0];
  const activeCourses = assignments.filter(a => a.status === 'in_progress');
  const completedCourses = assignments.filter(a => a.status === 'completed' || a.status === 'passed');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Technician Training Portal</h1>
          <p className="text-gray-600">Complete your certification levels and build expertise</p>
        </motion.div>

        {/* Level Progress */}
        {techProfile && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <Card className="bg-white border-2 border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-blue-600" />
                  Your Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Current Level</p>
                    <p className="text-3xl font-bold text-blue-600">{techProfile.current_level || 0}</p>
                    <p className="text-xs text-gray-500 mt-1">of 6 levels</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Field Hours</p>
                    <p className="text-3xl font-bold text-green-600">{techProfile.total_field_hours || 0}</p>
                    <p className="text-xs text-gray-500 mt-1">hours logged</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Certifications</p>
                    <p className="text-3xl font-bold text-purple-600">{techProfile.certifications?.length || 0}</p>
                    <p className="text-xs text-gray-500 mt-1">earned</p>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-sm font-medium text-gray-700">Level {techProfile.current_level} Progress</p>
                    <p className="text-xs text-gray-500">{Math.round((completedCourses.length / (assignments.length || 1)) * 100)}%</p>
                  </div>
                  <Progress value={(completedCourses.length / (assignments.length || 1)) * 100} className="h-3" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="active">Active Courses ({activeCourses.length})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({completedCourses.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="active">
            {activeCourses.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {activeCourses.map((assignment, idx) => (
                  <motion.div
                    key={assignment.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <CourseCard assignment={assignment} isActive />
                  </motion.div>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <Zap className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No active courses assigned yet. Check back soon!</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="completed">
            {completedCourses.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {completedCourses.map((assignment, idx) => (
                  <motion.div
                    key={assignment.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <CourseCard assignment={assignment} isActive={false} />
                  </motion.div>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <CheckCircle2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No completed courses yet. Start with your active courses!</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function CourseCard({ assignment, isActive }) {
  const statusColors = {
    assigned: 'bg-blue-100 text-blue-800',
    in_progress: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-green-100 text-green-800',
    passed: 'bg-emerald-100 text-emerald-800',
    failed: 'bg-red-100 text-red-800',
  };

  return (
    <Card className={isActive ? 'border-2 border-blue-300 hover:shadow-lg' : 'opacity-75'}>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-lg">{assignment.course_title}</CardTitle>
            <CardDescription>Level {assignment.level_number}</CardDescription>
          </div>
          <Badge className={statusColors[assignment.status] || 'bg-gray-100'}>
            {assignment.status?.replace('_', ' ')}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {assignment.due_date && (
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600">Due: {new Date(assignment.due_date).toLocaleDateString()}</span>
            </div>
          )}

          {isActive && (
            <div>
              <p className="text-xs font-medium text-gray-700 mb-2">Progress</p>
              <Progress value={45} className="h-2" />
            </div>
          )}

          {assignment.written_exam_score && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm font-medium text-gray-700">Written Exam Score</p>
              <p className="text-2xl font-bold text-blue-600">{assignment.written_exam_score}%</p>
            </div>
          )}

          {assignment.practical_exam_score && (
            <div className="bg-green-50 p-3 rounded-lg">
              <p className="text-sm font-medium text-gray-700">Practical Exam Score</p>
              <p className="text-2xl font-bold text-green-600">{assignment.practical_exam_score}%</p>
            </div>
          )}

          {isActive && (
            <Button className="w-full mt-4 bg-blue-600 hover:bg-blue-700">
              <BookOpen className="w-4 h-4 mr-2" />
              Continue Learning
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}