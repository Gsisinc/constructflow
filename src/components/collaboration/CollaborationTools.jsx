import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Send, Heart, MessageCircle, Search, Plus, AtSign, Clock } from 'lucide-react';
import { toast } from 'sonner';

// Team Chat Component
export function TeamChat() {
  const [channels, setChannels] = useState([
    { id: 1, name: 'general', unread: 0 },
    { id: 2, name: 'project-updates', unread: 3 },
    { id: 3, name: 'announcements', unread: 0 },
    { id: 4, name: 'safety-alerts', unread: 1 }
  ]);

  const [selectedChannel, setSelectedChannel] = useState(1);
  const [messages, setMessages] = useState([
    {
      id: 1,
      channel: 1,
      author: 'John Smith',
      content: 'Good morning team! Let\'s make it a productive day.',
      timestamp: '9:30 AM',
      avatar: '👤',
      likes: 2
    },
    {
      id: 2,
      channel: 1,
      author: 'Sarah Johnson',
      content: 'Morning everyone! Foundation work is progressing well.',
      timestamp: '9:45 AM',
      avatar: '👤',
      likes: 5
    }
  ]);

  const [messageText, setMessageText] = useState('');
  const [showNewChannel, setShowNewChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');

  const sendMessage = () => {
    if (!messageText.trim()) {
      toast.error('Message cannot be empty');
      return;
    }

    const newMessage = {
      id: messages.length + 1,
      channel: selectedChannel,
      author: 'You',
      content: messageText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      avatar: '👤',
      likes: 0
    };

    setMessages([...messages, newMessage]);
    setMessageText('');
    toast.success('Message sent');
  };

  const createChannel = () => {
    if (!newChannelName.trim()) {
      toast.error('Please enter channel name');
      return;
    }

    setChannels([...channels, {
      id: channels.length + 1,
      name: newChannelName.toLowerCase().replace(/\s/g, '-'),
      unread: 0
    }]);

    setNewChannelName('');
    setShowNewChannel(false);
    toast.success('Channel created');
  };

  const likeMessage = (messageId) => {
    setMessages(messages.map(m =>
      m.id === messageId ? { ...m, likes: m.likes + 1 } : m
    ));
  };

  const currentChannel = channels.find(c => c.id === selectedChannel);
  const channelMessages = messages.filter(m => m.channel === selectedChannel);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 h-[600px]">
      {/* Channels Sidebar */}
      <Card className="md:col-span-1">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Channels</CardTitle>
            <Dialog open={showNewChannel} onOpenChange={setShowNewChannel}>
              <DialogTrigger asChild>
                <Button size="sm" variant="ghost">
                  <Plus className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Channel</DialogTitle>
                </DialogHeader>
                <Input
                  placeholder="Channel name"
                  value={newChannelName}
                  onChange={(e) => setNewChannelName(e.target.value)}
                />
                <Button onClick={createChannel} className="w-full">Create</Button>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-1">
          {channels.map(channel => (
            <button
              key={channel.id}
              onClick={() => setSelectedChannel(channel.id)}
              className={`w-full text-left px-3 py-2 rounded text-sm flex items-center justify-between ${
                selectedChannel === channel.id
                  ? 'bg-blue-100 text-blue-900 font-medium'
                  : 'hover:bg-slate-100'
              }`}
            >
              <span>#{channel.name}</span>
              {channel.unread > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {channel.unread}
                </span>
              )}
            </button>
          ))}
        </CardContent>
      </Card>

      {/* Chat Area */}
      <Card className="md:col-span-3 flex flex-col">
        <CardHeader className="pb-2 border-b">
          <CardTitle className="text-base">#{currentChannel?.name}</CardTitle>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto py-4 space-y-4">
          {channelMessages.map(msg => (
            <div key={msg.id} className="flex gap-3 group">
              <div className="text-2xl">{msg.avatar}</div>
              <div className="flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="font-medium text-sm">{msg.author}</span>
                  <span className="text-xs text-slate-500">{msg.timestamp}</span>
                </div>
                <p className="text-sm text-slate-700 mt-1">{msg.content}</p>
                <div className="flex gap-2 mt-1 opacity-0 group-hover:opacity-100 transition">
                  <button
                    onClick={() => likeMessage(msg.id)}
                    className="flex items-center gap-1 text-xs text-slate-600 hover:text-red-600"
                  >
                    <Heart className="h-3 w-3" />
                    {msg.likes}
                  </button>
                  <button className="text-xs text-slate-600 hover:text-blue-600">Reply</button>
                </div>
              </div>
            </div>
          ))}
        </CardContent>

        <div className="border-t p-4 flex gap-2">
          <Input
            placeholder="Type a message... (use @ to mention)"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          />
          <Button onClick={sendMessage} size="sm">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
}

// Activity Feed Component
export function ActivityFeed() {
  const [activities] = useState([
    {
      id: 1,
      type: 'project_update',
      user: 'John Smith',
      action: 'updated Foundation Work',
      target: 'Project Timeline',
      timestamp: '10 minutes ago',
      icon: '📝'
    },
    {
      id: 2,
      type: 'comment',
      user: 'Sarah Johnson',
      action: 'commented on',
      target: 'Daily Report - Feb 15',
      timestamp: '25 minutes ago',
      icon: '💬'
    },
    {
      id: 3,
      type: 'file_upload',
      user: 'Mike Chen',
      action: 'uploaded',
      target: 'Foundation Inspection Photos',
      timestamp: '1 hour ago',
      icon: '📸'
    },
    {
      id: 4,
      type: 'task_completed',
      user: 'Lisa Martinez',
      action: 'completed task',
      target: 'Electrical Rough-In Inspection',
      timestamp: '2 hours ago',
      icon: '✅'
    },
    {
      id: 5,
      type: 'alert',
      user: 'System',
      action: 'Safety alert raised',
      target: 'PPE Non-Compliance on West Building',
      timestamp: '3 hours ago',
      icon: '⚠️'
    }
  ]);

  const activityColors = {
    'project_update': 'bg-blue-50 border-l-4 border-l-blue-500',
    'comment': 'bg-green-50 border-l-4 border-l-green-500',
    'file_upload': 'bg-purple-50 border-l-4 border-l-purple-500',
    'task_completed': 'bg-green-50 border-l-4 border-l-green-500',
    'alert': 'bg-red-50 border-l-4 border-l-red-500'
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Feed</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {activities.map(activity => (
          <div key={activity.id} className={`p-3 rounded ${activityColors[activity.type] || ''}`}>
            <div className="flex gap-3">
              <span className="text-xl flex-shrink-0">{activity.icon}</span>
              <div className="flex-1">
                <p className="text-sm font-medium">
                  {activity.user} {activity.action}
                </p>
                <p className="text-sm text-slate-700">{activity.target}</p>
                <p className="text-xs text-slate-600 mt-1 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {activity.timestamp}
                </p>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// Comments Component
export function FileComments({ fileName = 'Inspection Report.pdf' }) {
  const [comments, setComments] = useState([
    {
      id: 1,
      author: 'John Smith',
      content: 'Good work on the inspection. Everything looks on schedule.',
      timestamp: '2 hours ago',
      replies: []
    },
    {
      id: 2,
      author: 'Sarah Johnson',
      content: 'Found a small issue on page 3. See my markup.',
      timestamp: '1 hour ago',
      replies: [
        {
          id: 1,
          author: 'Mike Chen',
          content: 'I\'ll fix that today.',
          timestamp: '30 minutes ago'
        }
      ]
    }
  ]);

  const [newComment, setNewComment] = useState('');

  const addComment = () => {
    if (!newComment.trim()) return;

    setComments([...comments, {
      id: comments.length + 1,
      author: 'You',
      content: newComment,
      timestamp: 'just now',
      replies: []
    }]);

    setNewComment('');
    toast.success('Comment added');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Comments on {fileName}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {comments.map(comment => (
          <div key={comment.id} className="border rounded-lg p-3">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="font-medium text-sm">{comment.author}</p>
                <p className="text-xs text-slate-600">{comment.timestamp}</p>
              </div>
            </div>
            <p className="text-sm text-slate-700 mb-3">{comment.content}</p>

            {comment.replies && comment.replies.length > 0 && (
              <div className="ml-4 space-y-2 border-l-2 border-slate-200 pl-3">
                {comment.replies.map(reply => (
                  <div key={reply.id}>
                    <p className="font-medium text-xs">{reply.author}</p>
                    <p className="text-xs text-slate-600">{reply.timestamp}</p>
                    <p className="text-xs text-slate-700 mt-1">{reply.content}</p>
                  </div>
                ))}
              </div>
            )}

            <Button variant="ghost" size="sm" className="text-xs">
              <MessageCircle className="h-3 w-3 mr-1" />
              Reply
            </Button>
          </div>
        ))}

        <div className="space-y-2">
          <Textarea
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[60px]"
          />
          <Button onClick={addComment} className="w-full">Add Comment</Button>
        </div>
      </CardContent>
    </Card>
  );
}
