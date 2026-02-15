import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Send, MessageSquare, Bell, Clock, AtSign, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

// Team Chat Component
export function TeamChat({ projectId = null }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedChannel, setSelectedChannel] = useState('general');
  const [channels, setChannels] = useState([
    { id: 'general', name: 'General', unread: 0 },
    { id: 'updates', name: 'Project Updates', unread: 2 }
  ]);

  const sendMessage = () => {
    if (!newMessage.trim()) {
      toast.error('Please enter a message');
      return;
    }

    const message = {
      id: Date.now(),
      channel: selectedChannel,
      text: newMessage,
      sender: 'Current User',
      timestamp: new Date(),
      mentions: (newMessage.match(/@\w+/g) || []).map(m => m.substring(1))
    };

    setMessages([...messages, message]);
    setNewMessage('');
    toast.success('Message sent');
  };

  const channelMessages = messages.filter(m => m.channel === selectedChannel);

  return (
    <Card className="h-96 flex flex-col">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Team Chat
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col overflow-hidden">
        {/* Channel List */}
        <div className="flex gap-2 mb-4 border-b pb-2 overflow-x-auto">
          {channels.map(channel => (
            <button
              key={channel.id}
              onClick={() => setSelectedChannel(channel.id)}
              className={`px-3 py-1 rounded text-sm whitespace-nowrap transition-all ${
                selectedChannel === channel.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              #{channel.name}
              {channel.unread > 0 && <span className="ml-1 badge">{channel.unread}</span>}
            </button>
          ))}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-3 mb-4">
          {channelMessages.length === 0 ? (
            <div className="text-center text-slate-500 text-sm py-8">
              No messages yet. Start a conversation!
            </div>
          ) : (
            channelMessages.map(msg => (
              <div key={msg.id} className="bg-slate-50 rounded p-2">
                <p className="text-xs font-bold text-slate-700">{msg.sender}</p>
                <p className="text-sm">{msg.text}</p>
                <p className="text-xs text-slate-500 mt-1">
                  {msg.timestamp.toLocaleTimeString()}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Input */}
        <div className="flex gap-2">
          <Input
            placeholder="Type message... (use @name to mention)"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            className="text-sm"
          />
          <Button size="sm" onClick={sendMessage}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Activity Feed Component
export function ActivityFeed({ activities = [] }) {
  const [filteredActivities, setFilteredActivities] = useState(activities);
  const [filterType, setFilterType] = useState('all');

  const activityTypes = [
    { value: 'all', label: 'All Activity' },
    { value: 'created', label: 'Created' },
    { value: 'updated', label: 'Updated' },
    { value: 'comment', label: 'Comments' },
    { value: 'status', label: 'Status Change' }
  ];

  const getActivityIcon = (type) => {
    const icons = {
      created: '✨',
      updated: '✏️',
      comment: '💬',
      status: '🔄',
      assigned: '👤'
    };
    return icons[type] || '📝';
  };

  const getActivityColor = (type) => {
    const colors = {
      created: 'bg-blue-50',
      updated: 'bg-purple-50',
      comment: 'bg-green-50',
      status: 'bg-orange-50',
      assigned: 'bg-pink-50'
    };
    return colors[type] || 'bg-slate-50';
  };

  const mockActivities = [
    {
      id: 1,
      type: 'created',
      entity: 'Project',
      title: 'Highway Bridge Renovation',
      user: 'John Smith',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      icon: '✨'
    },
    {
      id: 2,
      type: 'comment',
      entity: 'Task',
      title: 'Foundation Inspection',
      user: 'Sarah Johnson',
      comment: 'We need to schedule this for next week',
      timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
      icon: '💬'
    },
    {
      id: 3,
      type: 'status',
      entity: 'Bid',
      title: 'Electrical Work Bid',
      user: 'Mike Davis',
      oldStatus: 'draft',
      newStatus: 'submitted',
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      icon: '🔄'
    },
    {
      id: 4,
      type: 'assigned',
      entity: 'Task',
      title: 'Safety Inspection',
      user: 'Lisa Chen',
      assignedTo: 'Robert Wilson',
      timestamp: new Date(Date.now() - 10 * 60 * 1000),
      icon: '👤'
    }
  ];

  const getTimeString = (date) => {
    const now = new Date();
    const diff = now - date;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Activity Feed
        </CardTitle>
        <select
          className="text-sm border rounded px-2 py-1"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          {activityTypes.map(type => (
            <option key={type.value} value={type.value}>{type.label}</option>
          ))}
        </select>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {mockActivities.map(activity => (
            <div key={activity.id} className={`rounded-lg p-3 ${getActivityColor(activity.type)}`}>
              <div className="flex gap-3">
                <div className="text-2xl">{activity.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        {activity.user}
                      </p>
                      <p className="text-sm text-slate-700">
                        {activity.type === 'created' && `Created ${activity.entity}: ${activity.title}`}
                        {activity.type === 'comment' && `Commented on ${activity.title}`}
                        {activity.type === 'status' && `Changed status of "${activity.title}" from ${activity.oldStatus} to ${activity.newStatus}`}
                        {activity.type === 'assigned' && `Assigned ${activity.title} to ${activity.assignedTo}`}
                      </p>
                      {activity.comment && (
                        <p className="text-sm text-slate-600 mt-1 italic">"{activity.comment}"</p>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 whitespace-nowrap">
                      {getTimeString(activity.timestamp)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Notifications Component
export function NotificationCenter() {
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'alert',
      title: 'Bid Deadline',
      message: 'Highway Bridge bid due in 2 days',
      read: false,
      timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000)
    },
    {
      id: 2,
      type: 'success',
      title: 'Bid Submitted',
      message: 'Your bid for Electrical Work was submitted',
      read: false,
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000)
    },
    {
      id: 3,
      type: 'info',
      title: 'Team Message',
      message: 'Sarah mentioned you in #general',
      read: true,
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000)
    }
  ]);

  const [notificationSettings, setNotificationSettings] = useState({
    bidDeadlines: true,
    teamMessages: true,
    statusChanges: true,
    paymentReminders: true,
    emailNotifications: false
  });

  const markAsRead = (id) => {
    setNotifications(notifications.map(n =>
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const deleteNotification = (id) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotificationIcon = (type) => {
    const icons = {
      alert: '⚠️',
      success: '✅',
      info: 'ℹ️',
      error: '❌'
    };
    return icons[type] || '📢';
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base flex items-center gap-2">
          <Bell className="h-4 w-4" />
          Notifications {unreadCount > 0 && <span className="ml-2 badge">{unreadCount}</span>}
        </CardTitle>
        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">Settings</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Notification Preferences</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              {Object.entries(notificationSettings).map(([key, value]) => (
                <label key={key} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => setNotificationSettings({
                      ...notificationSettings,
                      [key]: e.target.checked
                    })}
                    className="rounded"
                  />
                  <span className="text-sm capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                </label>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>

      <CardContent>
        {notifications.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-sm">
            No notifications
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map(notif => (
              <div
                key={notif.id}
                className={`p-3 rounded-lg border-l-4 flex items-start justify-between gap-2 ${
                  notif.read ? 'bg-slate-50 border-slate-300' : 'bg-blue-50 border-blue-500'
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getNotificationIcon(notif.type)}</span>
                    <p className="font-bold text-sm">{notif.title}</p>
                  </div>
                  <p className="text-sm text-slate-600 mt-1">{notif.message}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {notif.timestamp.toLocaleString()}
                  </p>
                </div>

                <div className="flex gap-1">
                  {!notif.read && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => markAsRead(notif.id)}
                    >
                      Mark read
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteNotification(notif.id)}
                    className="text-red-600"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
