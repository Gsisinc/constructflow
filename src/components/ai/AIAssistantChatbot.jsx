import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  MessageCircle,
  Send,
  Mic,
  Paperclip,
  ThumbsUp,
  ThumbsDown,
  Copy,
  Loader,
  Zap,
  HelpCircle
} from 'lucide-react';

export default function AIAssistantChatbot() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: 'Hello! I\'m your ConstructFlow AI Assistant. I can help you with project management, estimations, scheduling, and more. What can I help you with today?',
      timestamp: new Date()
    }
  ]);

  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [recordingAudio, setRecordingAudio] = useState(false);

  const commonQuestions = [
    'How do I create a new project?',
    'What\'s the project timeline?',
    'Show me budget vs actual',
    'Who\'s assigned to task X?',
    'Generate an estimate',
    'Update task status'
  ];

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    // Add user message
    const userMessage = {
      id: messages.length + 1,
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages([...messages, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const botMessage = {
        id: messages.length + 2,
        type: 'bot',
        content: generateAIResponse(inputValue),
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
      setIsLoading(false);
    }, 1000);
  };

  const generateAIResponse = (query) => {
    const lowerQuery = query.toLowerCase();

    if (lowerQuery.includes('project')) {
      return 'I can help you with project management. You can create a new project by clicking "New Project" in the dashboard. Would you like me to guide you through the process?';
    }
    if (lowerQuery.includes('timeline') || lowerQuery.includes('schedule')) {
      return 'Based on the current project data, your timeline shows: Phase 1 (Foundation) - Complete, Phase 2 (Structural) - 60% complete, Phase 3 (MEP) - Starting next week. Would you like detailed milestone information?';
    }
    if (lowerQuery.includes('budget') || lowerQuery.includes('cost')) {
      return 'Current project budget status: Total Budget: $2.5M, Spent: $1.8M (72%), Remaining: $700K. You\'re on track. Would you like a detailed cost breakdown?';
    }
    if (lowerQuery.includes('assign') || lowerQuery.includes('task')) {
      return 'I can help assign tasks. Which team member would you like to assign a task to? I can also show you current workload distribution.';
    }
    if (lowerQuery.includes('estimate')) {
      return 'I can generate estimates using our assembly library and unit cost database. What type of estimate do you need? (Foundation, Electrical, HVAC, etc.)';
    }

    return 'That\'s a great question! Based on your project data, I can provide more specific information. Could you clarify what aspect you\'d like to know more about?';
  };

  const handleQuickQuestion = (question) => {
    setInputValue(question);
  };

  const handleVoiceCommand = () => {
    setRecordingAudio(!recordingAudio);
    if (!recordingAudio) {
      // Start recording
      setTimeout(() => {
        setRecordingAudio(false);
        setInputValue('Update task status to complete');
      }, 2000);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <MessageCircle className="w-8 h-8 text-blue-600" />
          AI Assistant
        </h1>
        <p className="text-slate-600 mt-1">Your intelligent project management assistant</p>
      </div>

      {/* Chat Container */}
      <Card className="h-96 flex flex-col">
        <CardContent className="flex-1 overflow-y-auto pt-6 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs px-4 py-2 rounded-lg ${
                  message.type === 'user'
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : 'bg-slate-100 text-slate-900 rounded-bl-none'
                }`}
              >
                <p className="text-sm">{message.content}</p>
                <p className={`text-xs mt-1 ${message.type === 'user' ? 'text-blue-100' : 'text-slate-500'}`}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-slate-100 text-slate-900 px-4 py-2 rounded-lg rounded-bl-none">
                <Loader className="w-4 h-4 animate-spin" />
              </div>
            </div>
          )}
        </CardContent>

        {/* Input Area */}
        <div className="border-t p-4 space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="Ask me anything about your project..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            />
            <Button
              size="icon"
              variant={recordingAudio ? 'default' : 'outline'}
              onClick={handleVoiceCommand}
              className="gap-2"
            >
              <Mic className="w-4 h-4" />
            </Button>
            <Button size="icon" variant="outline">
              <Paperclip className="w-4 h-4" />
            </Button>
            <Button size="icon" onClick={handleSendMessage} className="bg-blue-600">
              <Send className="w-4 h-4" />
            </Button>
          </div>
          {recordingAudio && (
            <p className="text-xs text-red-600 flex items-center gap-1">
              <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
              Recording...
            </p>
          )}
        </div>
      </Card>

      {/* Quick Questions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-500" />
            Quick Questions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {commonQuestions.map((question, idx) => (
              <Button
                key={idx}
                variant="outline"
                className="justify-start text-left h-auto py-2 px-3"
                onClick={() => handleQuickQuestion(question)}
              >
                <HelpCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                <span className="text-sm">{question}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Capabilities */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">AI Capabilities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold text-sm mb-2">Project Management</h4>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>✓ Create and manage projects</li>
                <li>✓ Track timelines and milestones</li>
                <li>✓ Assign tasks and resources</li>
                <li>✓ Monitor progress</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-2">Financial & Analysis</h4>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>✓ Budget tracking and forecasting</li>
                <li>✓ Cost estimation</li>
                <li>✓ Generate reports</li>
                <li>✓ Predictive analytics</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-2">Communication</h4>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>✓ Send notifications</li>
                <li>✓ Schedule meetings</li>
                <li>✓ Generate documents</li>
                <li>✓ Email integration</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-2">Voice & Vision</h4>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>✓ Voice commands</li>
                <li>✓ Photo analysis</li>
                <li>✓ Progress tracking</li>
                <li>✓ Document scanning</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
