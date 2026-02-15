import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Send, Paperclip, Smile, Trash2, Pin, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

export function TeamChat() {
  const [channels, setChannels] = useState([
    { id: 1, name: 'General', unread: 0, isActive: true },
    { id: 2, name: 'Project Updates', unread: 3, isActive: false },
    { id: 3, name: 'Safety Alerts', unread: 0, isActive: false },
    { id: 4, name: 'Schedule Changes', unread: 1, isActive: false }
  ]);

  const [activeChannelId, setActiveChannelId] = useState(1);
  const [messages, setMessages] = useState([
    {
      id: 1,
      author: 'John Smith',
      avatar: 'JS',
      timestamp: '10:30 AM',
      message: 'Team meeting scheduled for tomorrow at 2 PM. Please review the project status before then.',
      mentioned: false,
      pinned: false
    },
    {
      id: 2,
      author: 'Jane Doe',
      avatar: 'JD',
      timestamp: '11:15 AM',
      message: '@John Smith - The foundation inspection is complete. Photos uploaded to documents.',
      mentioned: true,
      pinned: false
    },
    {
      id: 3,
      author: 'You',
      avatar: 'YO',
      timestamp: '11:45 AM',
      message: 'Great! Moving forward with Phase 2. All contractors on schedule.',
      mentioned: false,
      pinned: true
    }
  ]);

  const [newMessage, setNewMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showNewChannel, setShowNewChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');

  const activeChannel = channels.find(c => c.id === activeChannelId);

  const sendMessage = () => {
    if (!newMessage.trim()) return;

    const messageText = newMessage;
    setMessages([...messages, {
      id: messages.length + 1,
      author: 'You',
      avatar: 'YO',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      message: messageText,
      mentioned: messageText.includes('@'),
      pinned: false
    }]);

    setNewMessage('');
    toast.success('Message sent');
  };

  const addChannel = () => {
    if (!newChannelName.trim()) {
      toast.error('Please enter channel name');
      return;
    }
    setChannels([...channels, {
      id: channels.length + 1,
      name: newChannelName,
      unread: 0,
      isActive: false
    }]);
    setNewChannelName('');
    setShowNewChannel(false);
    toast.success('Channel created');
  };

  const pinMessage = (messageId) => {
    setMessages(messages.map(m =>
      m.id === messageId ? { ...m, pinned: !m.pinned } : m
    ));
    toast.success('Message pinned');
  };

  const deleteMessage = (messageId) => {
    setMessages(messages.filter(m => m.id !== messageId));
    toast.success('Message deleted');
  };

  const teamMembers = ['John Smith', 'Jane Doe', 'Mike Johnson', 'Sarah Williams', 'Tom Brown'];

  return (
    <div className="grid grid-cols-4 gap-4 h-[600px]">
      {/* Sidebar - Channels */}
      <Card className="col-span-1">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-sm">Channels</CardTitle>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowNewChannel(true)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-1 overflow-y-auto max-h-[500px]">
          {channels.map(channel => (
            <button
              key={channel.id}
              onClick={() => setActiveChannelId(channel.id)}
              className={`w-full text-left px-3 py-2 rounded text-sm transition flex items-center justify-between ${
                activeChannelId === channel.id
                  ? 'bg-blue-100 text-blue-900 font-medium'
                  : 'hover:bg-slate-100'
              }`}
            >
              <span># {channel.name}</span>
              {channel.unread > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {channel.unread}
                </span>
              )}
            </button>
          ))}

          {showNewChannel && (
            <div className="mt-3 p-2 border rounded">
              <Input
                placeholder="Channel name"
                value={newChannelName}
                onChange={(e) => setNewChannelName(e.target.value)}
                className="text-sm mb-2"
              />
              <div className="flex gap-1">
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={addChannel}
                >
                  Create
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowNewChannel(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Chat Area */}
      <Card className="col-span-3 flex flex-col">
        <CardHeader className="pb-3 border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">#{activeChannel?.name}</CardTitle>
              <p className="text-xs text-slate-600 mt-1">
                {channels.find(c => c.id === activeChannelId)?.isActive ? 'Active' : '3 members'}
              </p>
            </div>
            <Button variant="outline" size="sm">
              <MessageSquare className="h-4 w-4 mr-2" />
              Thread
            </Button>
          </div>
        </CardHeader>

        {/* Messages */}
        <CardContent className="flex-1 overflow-y-auto space-y-3 py-4">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex gap-3 p-2 rounded hover:bg-slate-50 group ${msg.pinned ? 'bg-yellow-50 border-l-2 border-yellow-400' : ''}`}
            >
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                  {msg.avatar}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm">{msg.author}</p>
                  <p className="text-xs text-slate-500">{msg.timestamp}</p>
                  {msg.mentioned && (
                    <span className="bg-orange-100 text-orange-800 text-xs px-1.5 rounded">
                      Mentioned
                    </span>
                  )}
                  {msg.pinned && (
                    <Pin className="h-3 w-3 text-yellow-600" />
                  )}
                </div>
                <p className="text-sm text-slate-700 mt-1 break-words">{msg.message}</p>
              </div>

              <div className="flex-shrink-0 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => pinMessage(msg.id)}
                >
                  <Pin className="h-3 w-3" />
                </Button>
                {msg.author === 'You' && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteMessage(msg.id)}
                    className="text-red-600"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </CardContent>

        {/* Input */}
        <div className="border-t p-3 space-y-2">
          <div className="flex gap-2">
            <Button size="sm" variant="outline">
              <Paperclip className="h-4 w-4" />
            </Button>
            <Input
              placeholder={`Message #${activeChannel?.name}...`}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              className="text-sm"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            >
              <Smile className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              onClick={sendMessage}
              disabled={!newMessage.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>

          {/* Team Members Mention Helper */}
          {newMessage.includes('@') && (
            <div className="bg-slate-50 rounded p-2 max-h-[100px] overflow-y-auto">
              <p className="text-xs font-medium text-slate-600 mb-1">Mention team member</p>
              <div className="space-y-1">
                {teamMembers.map((member, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      const updatedMsg = newMessage.replace(/@\w*$/, `@${member}`);
                      setNewMessage(updatedMsg);
                    }}
                    className="block w-full text-left text-sm text-slate-700 hover:bg-slate-200 px-2 py-1 rounded"
                  >
                    {member}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

export function ActivityFeed() {
  const [activities, setActivities] = useState([
    {
      id: 1,
      user: 'John Smith',
      action: 'updated project status',
      resource: 'School Retrofit',
      time: '2 hours ago',
      icon: 'update'
    },
    {
      id: 2,
      user: 'Jane Doe',
      action: 'uploaded photos',
      resource: 'Week 5 Progress',
      time: '4 hours ago',
      icon: 'upload'
    },
    {
      id: 3,
      user: 'Mike Johnson',
      action: 'created task',
      resource: 'HVAC Installation',
      time: '1 day ago',
      icon: 'task'
    }
  ]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Feed</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {activities.map(activity => (
          <div key={activity.id} className="flex gap-3 pb-3 border-b last:border-0">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-slate-300 flex items-center justify-center text-xs font-bold">
                {activity.user.charAt(0)}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-700">
                <span className="font-medium">{activity.user}</span>
                {' '}{activity.action}
                <br />
                <span className="text-slate-600">{activity.resource}</span>
              </p>
              <p className="text-xs text-slate-500 mt-1">{activity.time}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export default TeamChat;
