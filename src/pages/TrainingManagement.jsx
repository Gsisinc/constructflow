import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { BookOpen, Plus, Trash2, CheckCircle2, Clock, Users } from 'lucide-react';
import { motion } from 'framer-motion';

export default function TrainingManagement() {
  const [user, setUser] = useState(null);
  const [org, setOrg] = useState(null);
  const [selectedLevel, setSelectedLevel] = useState('1');
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadData = async () => {
      const userData = await base44.auth.me();
      setUser(userData);
      if (userData?.organization_id) {
        const orgs = await base44.entities.Organization.filter({ id: userData.organization_id });
        setOrg(orgs[0]);
      }
    };
    loadData();
  }, []);

  const { data: levels = [] } = useQuery({
    queryKey: ['courseLevels', org?.id],
    queryFn: () => org?.id ? base44.entities.CourseLevel.filter({ organization_id: org.id }) : [],
    enabled: !!org?.id,
  });

  const { data: courses = [] } = useQuery({
    queryKey: ['trainingCourses', org?.id],
    queryFn: () => org?.id ? base44.entities.TrainingCourse.filter({ organization_id: org.id }) : [],
    enabled: !!org?.id,
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ['assignments', org?.id],
    queryFn: () => org?.id ? base44.entities.CourseAssignment.filter({ organization_id: org.id }) : [],
    enabled: !!org?.id,
  });

  const { data: technicians = [] } = useQuery({
    queryKey: ['technicians', org?.id],
    queryFn: () => org?.id ? base44.entities.TechnicianProfile.filter({ organization_id: org.id }) : [],
    enabled: !!org?.id,
  });

  if (!user) return <div className="p-6">Loading...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Training Management</h1>
          <p className="text-slate-600">Manage courses, assign technicians, and track progress</p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Total Courses</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-600">{courses.length}</p>
              <p className="text-xs text-slate-500 mt-1">across {levels.length} levels</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Active Technicians</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">{technicians.length}</p>
              <p className="text-xs text-slate-500 mt-1">in training program</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Assignments</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-purple-600">{assignments.length}</p>
              <p className="text-xs text-slate-500 mt-1">active & completed</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="assignments" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="assignments">Assign Courses</TabsTrigger>
            <TabsTrigger value="courses">Course Library</TabsTrigger>
            <TabsTrigger value="technicians">Technicians</TabsTrigger>
          </TabsList>

          {/* Assign Courses Tab */}
          <TabsContent value="assignments">
            <AssignmentsSection assignments={assignments} technicians={technicians} courses={courses} org={org} />
          </TabsContent>

          {/* Course Library Tab */}
          <TabsContent value="courses">
            <CourseLibrarySection courses={courses} levels={levels} org={org} />
          </TabsContent>

          {/* Technicians Tab */}
          <TabsContent value="technicians">
            <TechniciansSection technicians={technicians} assignments={assignments} org={org} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function AssignmentsSection({ assignments, technicians, courses, org }) {
  const [searchTech, setSearchTech] = useState('');
  const [selectedTech, setSelectedTech] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [dueDate, setDueDate] = useState('');
  const queryClient = useQueryClient();

  const createAssignmentMutation = useMutation({
    mutationFn: (data) => base44.entities.CourseAssignment.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      setSelectedTech('');
      setSelectedCourse('');
      setDueDate('');
    },
  });

  const handleAssign = async () => {
    if (selectedTech && selectedCourse) {
      const tech = technicians.find(t => t.email === selectedTech);
      const course = courses.find(c => c.id === selectedCourse);
      await createAssignmentMutation.mutateAsync({
        organization_id: org.id,
        technician_email: selectedTech,
        technician_name: tech?.full_name,
        course_id: selectedCourse,
        course_title: course?.title,
        level_number: course?.level_number,
        assigned_by: 'admin',
        assigned_date: new Date().toISOString().split('T')[0],
        due_date: dueDate,
        status: 'assigned',
      });
    }
  };

  const filteredAssignments = assignments.filter(a =>
    a.technician_name?.toLowerCase().includes(searchTech.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Assign New Course</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select value={selectedTech} onValueChange={setSelectedTech}>
              <SelectTrigger>
                <SelectValue placeholder="Select technician..." />
              </SelectTrigger>
              <SelectContent>
                {technicians.map(tech => (
                  <SelectItem key={tech.id} value={tech.email}>{tech.full_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedCourse} onValueChange={setSelectedCourse}>
              <SelectTrigger>
                <SelectValue placeholder="Select course..." />
              </SelectTrigger>
              <SelectContent>
                {courses.map(course => (
                  <SelectItem key={course.id} value={course.id}>{course.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            placeholder="Due date"
          />

          <Button onClick={handleAssign} className="w-full bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Assign Course
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Active Assignments</CardTitle>
          <Input
            placeholder="Search technician..."
            value={searchTech}
            onChange={(e) => setSearchTech(e.target.value)}
            className="mt-4"
          />
        </CardHeader>
        <CardContent>
          {filteredAssignments.length > 0 ? (
            <div className="space-y-4">
              {filteredAssignments.map((assignment) => (
                <motion.div
                  key={assignment.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50"
                >
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{assignment.technician_name}</p>
                    <p className="text-sm text-slate-600">{assignment.course_title}</p>
                  </div>
                  <Badge variant="outline">{assignment.status}</Badge>
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-center py-8">No assignments yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function CourseLibrarySection({ courses, levels, org }) {
  return (
    <div className="space-y-6">
      {levels.map((level) => {
        const levelCourses = courses.filter(c => c.level_id === level.id);
        return (
          <Card key={level.id}>
            <CardHeader>
              <CardTitle>Level {level.level_number}: {level.title}</CardTitle>
              <CardDescription>{level.description}</CardDescription>
            </CardHeader>
            <CardContent>
              {levelCourses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {levelCourses.map((course) => (
                    <Card key={course.id} className="bg-slate-50">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">{course.module_number}: {course.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          <p className="text-slate-600">{course.duration_hours} hours</p>
                          {course.has_written_exam && <Badge variant="outline">Written Exam</Badge>}
                          {course.has_practical_exam && <Badge variant="outline">Practical Exam</Badge>}
                          {course.required_field_hours > 0 && (
                            <p className="text-slate-600">{course.required_field_hours} field hours</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500">No courses added yet for this level</p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function TechniciansSection({ technicians, assignments, org }) {
  return (
    <div className="space-y-4">
      {technicians.length > 0 ? (
        technicians.map((tech) => {
          const techAssignments = assignments.filter(a => a.technician_email === tech.email);
          const completed = techAssignments.filter(a => a.status === 'completed' || a.status === 'passed').length;
          return (
            <Card key={tech.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      {tech.full_name}
                    </CardTitle>
                    <CardDescription>{tech.email}</CardDescription>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800">Level {tech.current_level || 0}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-slate-600">Assignments</p>
                    <p className="text-2xl font-bold">{techAssignments.length}</p>
                  </div>
                  <div>
                    <p className="text-slate-600">Completed</p>
                    <p className="text-2xl font-bold text-green-600">{completed}</p>
                  </div>
                  <div>
                    <p className="text-slate-600">Field Hours</p>
                    <p className="text-2xl font-bold">{tech.total_field_hours || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No technicians added yet</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}