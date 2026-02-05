import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, MessageSquare, Image as ImageIcon, FileText, Plus, Send, DollarSign, Clock, CheckCircle, AlertTriangle, Home, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import ProjectDeadlines from '../components/calendar/ProjectDeadlines';

export default function ClientPortal() {
  const [selectedProject, setSelectedProject] = useState(null);
  const [showCommentDialog, setShowCommentDialog] = useState(false);
  const [showChangeOrderDialog, setShowChangeOrderDialog] = useState(false);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['clientProjects', user?.email],
    queryFn: () => base44.entities.Project.filter({ client_email: user?.email }),
    enabled: !!user?.email
  });

  const { data: updates = [] } = useQuery({
    queryKey: ['clientUpdates', selectedProject?.id],
    queryFn: () => base44.entities.ClientUpdate.filter({ project_id: selectedProject?.id }, '-created_date'),
    enabled: !!selectedProject?.id
  });

  const { data: changeOrders = [] } = useQuery({
    queryKey: ['clientChangeOrders', selectedProject?.id],
    queryFn: () => base44.entities.PhaseChangeOrder.filter({ project_id: selectedProject?.id }),
    enabled: !!selectedProject?.id
  });

  const { data: calendarEvents = [] } = useQuery({
    queryKey: ['clientCalendarEvents', selectedProject?.id],
    queryFn: () => base44.entities.CalendarEvent.filter({ project_id: selectedProject?.id }),
    enabled: !!selectedProject?.id
  });

  const createCommentMutation = useMutation({
    mutationFn: (data) => base44.entities.ClientUpdate.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientUpdates'] });
      setShowCommentDialog(false);
      toast.success('Comment posted');
    }
  });

  const createChangeOrderMutation = useMutation({
    mutationFn: (data) => base44.entities.PhaseChangeOrder.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientChangeOrders'] });
      setShowChangeOrderDialog(false);
      toast.success('Change order request submitted');
    }
  });

  const [commentForm, setCommentForm] = useState({ message: '' });
  const [changeOrderForm, setChangeOrderForm] = useState({
    description: '',
    reason: 'owner_request',
    cost_impact: 0
  });

  React.useEffect(() => {
    if (projects.length > 0 && !selectedProject) {
      setSelectedProject(projects[0]);
    }
  }, [projects, selectedProject]);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <Home className="h-16 w-16 mx-auto mb-4 text-slate-300" />
            <h2 className="text-2xl font-semibold mb-2">No Projects Found</h2>
            <p className="text-slate-500">You don't have any active projects yet.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Welcome, {user.full_name}</h1>
            <p className="text-slate-500 mt-1">Track your project progress and stay updated</p>
          </div>
          {projects.length > 1 && (
            <Select value={selectedProject?.id} onValueChange={(id) => setSelectedProject(projects.find(p => p.id === id))}>
              <SelectTrigger className="w-72">
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {selectedProject && (
          <>
            {/* Project Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="md:col-span-2 border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
                <CardHeader>
                  <CardTitle className="text-2xl">{selectedProject.name}</CardTitle>
                  <div className="flex gap-2 mt-2">
                    <Badge variant={selectedProject.status === 'in_progress' ? 'default' : 'secondary'}>
                      {selectedProject.status.replace('_', ' ')}
                    </Badge>
                    <Badge variant="outline">{selectedProject.project_type}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-slate-600">Overall Progress</span>
                      <span className="font-semibold">{selectedProject.progress}%</span>
                    </div>
                    <Progress value={selectedProject.progress} className="h-3" />
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div>
                      <p className="text-sm text-slate-500">Start Date</p>
                      <p className="font-semibold">{selectedProject.start_date ? format(new Date(selectedProject.start_date), 'MMM dd, yyyy') : 'Not set'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Target Completion</p>
                      <p className="font-semibold">{selectedProject.end_date ? format(new Date(selectedProject.end_date), 'MMM dd, yyyy') : 'Not set'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Dialog open={showCommentDialog} onOpenChange={setShowCommentDialog}>
                    <DialogTrigger asChild>
                      <Button className="w-full" variant="outline">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Post Comment
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Comment</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <Textarea
                          value={commentForm.message}
                          onChange={(e) => setCommentForm({ message: e.target.value })}
                          placeholder="Share your thoughts or questions..."
                          rows={4}
                        />
                        <Button 
                          onClick={() => createCommentMutation.mutate({ 
                            project_id: selectedProject.id,
                            update_type: 'comment',
                            message: commentForm.message,
                            sent_by: user.email
                          })}
                          className="w-full"
                        >
                          <Send className="h-4 w-4 mr-2" />
                          Post Comment
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Dialog open={showChangeOrderDialog} onOpenChange={setShowChangeOrderDialog}>
                    <DialogTrigger asChild>
                      <Button className="w-full" variant="outline">
                        <FileText className="h-4 w-4 mr-2" />
                        Request Change
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Submit Change Order Request</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>Description</Label>
                          <Textarea
                            value={changeOrderForm.description}
                            onChange={(e) => setChangeOrderForm({ ...changeOrderForm, description: e.target.value })}
                            placeholder="Describe the change you'd like..."
                            rows={4}
                          />
                        </div>
                        <div>
                          <Label>Reason</Label>
                          <Select value={changeOrderForm.reason} onValueChange={(value) => setChangeOrderForm({ ...changeOrderForm, reason: value })}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="owner_request">Owner Request</SelectItem>
                              <SelectItem value="design_change">Design Change</SelectItem>
                              <SelectItem value="value_engineering">Value Engineering</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button 
                          onClick={() => createChangeOrderMutation.mutate({
                            project_id: selectedProject.id,
                            phase_name: selectedProject.current_phase,
                            co_number: `CO-${Date.now()}`,
                            description: changeOrderForm.description,
                            reason: changeOrderForm.reason,
                            cost_impact: 0,
                            status: 'proposed'
                          })}
                          className="w-full"
                        >
                          Submit Request
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            </div>

            {/* Countdown Timers */}
            {selectedProject.end_date && (
              <ProjectDeadlines projectId={selectedProject.id} />
            )}

            {/* Tabs */}
            <Tabs defaultValue="updates" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="updates">Updates</TabsTrigger>
                <TabsTrigger value="photos">Photos</TabsTrigger>
                <TabsTrigger value="calendar">Calendar</TabsTrigger>
                <TabsTrigger value="changes">Change Orders</TabsTrigger>
              </TabsList>

              <TabsContent value="updates" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Project Updates</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {updates.length === 0 ? (
                      <div className="text-center py-12 text-slate-500">
                        <MessageSquare className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                        <p>No updates yet</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {updates.map(update => (
                          <div key={update.id} className="border-l-4 border-blue-500 bg-slate-50 p-4 rounded-r-lg">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <Badge variant={update.update_type === 'milestone' ? 'default' : 'outline'}>
                                  {update.update_type}
                                </Badge>
                                {update.milestone_name && (
                                  <span className="ml-2 font-semibold">{update.milestone_name}</span>
                                )}
                              </div>
                              <span className="text-sm text-slate-500">
                                {format(new Date(update.created_date), 'MMM dd, yyyy')}
                              </span>
                            </div>
                            <p className="text-slate-700">{update.message}</p>
                            {update.photo_urls && update.photo_urls.length > 0 && (
                              <div className="flex gap-2 mt-3">
                                {update.photo_urls.map((url, idx) => (
                                  <img key={idx} src={url} alt="Update" className="w-24 h-24 object-cover rounded-lg" />
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="photos" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Project Photos & 3D Models</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {updates.filter(u => u.photo_urls?.length > 0).length === 0 ? (
                      <div className="text-center py-12 text-slate-500">
                        <ImageIcon className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                        <p>No photos uploaded yet</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {updates
                          .filter(u => u.photo_urls?.length > 0)
                          .flatMap(u => u.photo_urls)
                          .map((url, idx) => (
                            <div key={idx} className="relative group cursor-pointer">
                              <img src={url} alt="Project" className="w-full h-48 object-cover rounded-lg" />
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all rounded-lg flex items-center justify-center">
                                <Button size="sm" variant="secondary" className="opacity-0 group-hover:opacity-100">
                                  View Full
                                </Button>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="calendar" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Upcoming Events</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {calendarEvents.length === 0 ? (
                      <div className="text-center py-12 text-slate-500">
                        <Calendar className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                        <p>No upcoming events</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {calendarEvents.slice(0, 10).map(event => (
                          <div key={event.id} className="flex items-start gap-4 p-4 border rounded-lg hover:bg-slate-50">
                            <div className="bg-blue-100 rounded-lg p-3 text-center min-w-16">
                              <p className="text-2xl font-bold text-blue-600">
                                {format(new Date(event.start_date), 'd')}
                              </p>
                              <p className="text-xs text-slate-500">
                                {format(new Date(event.start_date), 'MMM')}
                              </p>
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold">{event.title}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {event.event_type?.replace('_', ' ')}
                                </Badge>
                                {event.start_time && (
                                  <span className="text-sm text-slate-500 flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {event.start_time}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="changes" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Change Order Requests</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {changeOrders.length === 0 ? (
                      <div className="text-center py-12 text-slate-500">
                        <FileText className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                        <p>No change orders submitted</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {changeOrders.map(co => (
                          <div key={co.id} className="border rounded-lg p-4 hover:bg-slate-50">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <span className="font-mono font-semibold">{co.co_number}</span>
                                <Badge 
                                  className="ml-2"
                                  variant={
                                    co.status === 'approved' ? 'default' :
                                    co.status === 'rejected' ? 'destructive' :
                                    'secondary'
                                  }
                                >
                                  {co.status}
                                </Badge>
                              </div>
                              {co.cost_impact !== 0 && (
                                <p className={`font-bold ${co.cost_impact > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                  {co.cost_impact > 0 ? '+' : ''}${co.cost_impact.toLocaleString()}
                                </p>
                              )}
                            </div>
                            <p className="text-sm text-slate-700">{co.description}</p>
                            <p className="text-xs text-slate-500 mt-2">
                              Submitted {co.submitted_date && format(new Date(co.submitted_date), 'MMM dd, yyyy')}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </div>
  );
}