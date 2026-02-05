import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  TrendingUp, 
  DollarSign, 
  Calendar, 
  Image,
  MessageSquare,
  ThumbsUp,
  Heart,
  Send,
  Download,
  Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';

const healthColors = {
  green: 'bg-green-500',
  yellow: 'bg-amber-500',
  red: 'bg-red-500',
};

export default function ClientPortal({ 
  project, 
  updates = [], 
  changeOrders = [],
  onAddComment,
  onAddReaction,
  onApproveChangeOrder
}) {
  const [commentText, setCommentText] = useState('');
  const [activeUpdate, setActiveUpdate] = useState(null);

  const handleAddComment = (updateId) => {
    if (!commentText.trim()) return;
    onAddComment?.(updateId, commentText);
    setCommentText('');
  };

  return (
    <div className="space-y-6">
      {/* Executive Dashboard Header */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <h1 className="text-2xl font-semibold">{project?.name}</h1>
            <p className="text-slate-400 mt-1">{project?.client_name} • {project?.address}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-sm">Project Health</span>
              <div className={cn(
                "w-4 h-4 rounded-full",
                healthColors[project?.health_status || 'green']
              )} />
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <div className="bg-white/10 rounded-xl p-4">
            <p className="text-slate-400 text-sm">Progress</p>
            <p className="text-2xl font-semibold mt-1">{project?.progress || 0}%</p>
            <Progress value={project?.progress || 0} className="h-1.5 mt-2" />
          </div>
          <div className="bg-white/10 rounded-xl p-4">
            <p className="text-slate-400 text-sm">Budget</p>
            <p className="text-2xl font-semibold mt-1">${(project?.budget || 0).toLocaleString()}</p>
            <p className="text-xs text-slate-400 mt-1">
              ${(project?.spent || 0).toLocaleString()} spent
            </p>
          </div>
          <div className="bg-white/10 rounded-xl p-4">
            <p className="text-slate-400 text-sm">Current Phase</p>
            <p className="text-lg font-semibold mt-1 capitalize">
              {project?.current_phase?.replace('_', ' ') || 'Planning'}
            </p>
          </div>
          <div className="bg-white/10 rounded-xl p-4">
            <p className="text-slate-400 text-sm">Completion</p>
            <p className="text-lg font-semibold mt-1">
              {project?.end_date ? format(new Date(project.end_date), 'MMM d, yyyy') : 'TBD'}
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="updates" className="w-full">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="updates">Update Feed</TabsTrigger>
          <TabsTrigger value="approvals">Pending Approvals</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        {/* Update Feed */}
        <TabsContent value="updates" className="mt-6">
          <div className="space-y-4">
            {updates.map((update) => (
              <div key={update.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b border-slate-100">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback className="bg-slate-100 text-slate-600">
                          {update.posted_by?.[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-slate-900">{update.posted_by}</p>
                        <p className="text-xs text-slate-500">
                          {update.created_date && formatDistanceToNow(new Date(update.created_date), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {update.update_type?.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-semibold text-slate-900">{update.title}</h3>
                  <p className="text-slate-600 mt-2 text-sm">{update.content}</p>

                  {/* Media */}
                  {update.media_urls?.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
                      {update.media_urls.slice(0, 4).map((url, idx) => (
                        <div key={idx} className="aspect-square rounded-lg overflow-hidden bg-slate-100">
                          <img src={url} alt="" className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Reactions & Comments */}
                <div className="px-4 py-3 bg-slate-50 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => onAddReaction?.(update.id, 'like')}
                        className="flex items-center gap-1 text-slate-500 hover:text-blue-600 transition-colors"
                      >
                        <ThumbsUp className="h-4 w-4" />
                        <span className="text-sm">{update.reactions?.filter(r => r.type === 'like').length || 0}</span>
                      </button>
                      <button
                        onClick={() => onAddReaction?.(update.id, 'love')}
                        className="flex items-center gap-1 text-slate-500 hover:text-red-500 transition-colors"
                      >
                        <Heart className="h-4 w-4" />
                        <span className="text-sm">{update.reactions?.filter(r => r.type === 'love').length || 0}</span>
                      </button>
                      <button
                        onClick={() => setActiveUpdate(activeUpdate === update.id ? null : update.id)}
                        className="flex items-center gap-1 text-slate-500 hover:text-slate-700 transition-colors"
                      >
                        <MessageSquare className="h-4 w-4" />
                        <span className="text-sm">{update.comments?.length || 0}</span>
                      </button>
                    </div>
                  </div>

                  {/* Comments Section */}
                  {activeUpdate === update.id && (
                    <div className="space-y-3 pt-3 border-t border-slate-200">
                      {update.comments?.map((comment, idx) => (
                        <div key={idx} className="flex gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">{comment.user?.[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 bg-white rounded-lg p-2">
                            <p className="text-xs font-medium text-slate-900">{comment.user}</p>
                            <p className="text-sm text-slate-600">{comment.content}</p>
                          </div>
                        </div>
                      ))}
                      <div className="flex gap-2">
                        <Textarea
                          placeholder="Add a comment..."
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          rows={2}
                          className="text-sm"
                        />
                        <Button size="icon" onClick={() => handleAddComment(update.id)}>
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {updates.length === 0 && (
              <div className="text-center py-12 text-slate-500">
                <Image className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                <p>No updates yet</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Pending Approvals */}
        <TabsContent value="approvals" className="mt-6">
          <div className="space-y-4">
            {changeOrders.filter(co => co.status === 'client_review').map((co) => (
              <div key={co.id} className="bg-white rounded-xl border border-slate-200 p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <Badge className="bg-amber-100 text-amber-700 mb-2">Awaiting Your Approval</Badge>
                    <h3 className="font-semibold text-slate-900">{co.title}</h3>
                    <p className="text-sm text-slate-500 mt-1">{co.change_order_number}</p>
                  </div>
                  <div className="text-right">
                    <p className={cn(
                      "text-xl font-semibold",
                      co.cost_impact > 0 ? "text-red-600" : "text-green-600"
                    )}>
                      {co.cost_impact > 0 ? '+' : ''}${Math.abs(co.cost_impact || 0).toLocaleString()}
                    </p>
                    <p className="text-xs text-slate-500">
                      {co.schedule_impact_days ? `${co.schedule_impact_days > 0 ? '+' : ''}${co.schedule_impact_days} days` : 'No schedule impact'}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-slate-600 mt-3">{co.description}</p>
                <div className="flex gap-3 mt-4">
                  <Button 
                    onClick={() => onApproveChangeOrder?.(co.id, true)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Approve
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => onApproveChangeOrder?.(co.id, false)}
                  >
                    Request Changes
                  </Button>
                  <Button variant="ghost">
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                </div>
              </div>
            ))}
            {changeOrders.filter(co => co.status === 'client_review').length === 0 && (
              <div className="text-center py-12 text-slate-500">
                <DollarSign className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                <p>No pending approvals</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Reports */}
        <TabsContent value="reports" className="mt-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-4">Automated Reports</h3>
            <p className="text-sm text-slate-500 mb-6">
              Configure automatic report delivery to your inbox.
            </p>
            <div className="space-y-3">
              {['Weekly Progress Report', 'Monthly Budget Summary', 'Photo Documentation'].map(report => (
                <div key={report} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <span className="text-sm font-medium text-slate-700">{report}</span>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}