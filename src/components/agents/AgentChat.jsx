import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Loader2, Send, X, Paperclip, Bot, User } from 'lucide-react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

export default function AgentChat({ agent, onClose }) {
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    initializeConversation();
  }, [agent]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const initializeConversation = async () => {
    try {
      const conv = await base44.agents.createConversation({
        agent_name: agent.id,
        metadata: {
          name: `${agent.name} Session`,
          description: `Chat with ${agent.name}`
        }
      });
      
      setConversation(conv);
      setMessages(conv.messages || []);

      // Subscribe to real-time updates
      const unsubscribe = base44.agents.subscribeToConversation(conv.id, (data) => {
        setMessages(data.messages);
      });

      return () => unsubscribe();
    } catch (error) {
      toast.error('Failed to start conversation');
      console.error(error);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !conversation || loading) return;

    const userMessage = input.trim();
    setInput('');
    setLoading(true);

    try {
      await base44.agents.addMessage(conversation, {
        role: 'user',
        content: userMessage
      });
    } catch (error) {
      toast.error('Failed to send message');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !conversation) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      await base44.agents.addMessage(conversation, {
        role: 'user',
        content: `I've uploaded a file: ${file.name}`,
        file_urls: [file_url]
      });
      
      toast.success('File uploaded');
    } catch (error) {
      toast.error('Failed to upload file');
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  const MessageBubble = ({ message }) => {
    const isUser = message.role === 'user';
    
    return (
      <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
        {!isUser && (
          <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${agent.color} flex items-center justify-center text-white flex-shrink-0`}>
            <Bot className="h-4 w-4" />
          </div>
        )}
        <div className={`max-w-[80%] ${isUser ? 'flex flex-col items-end' : ''}`}>
          {message.content && (
            <div className={`rounded-2xl px-4 py-2.5 ${
              isUser 
                ? 'bg-slate-900 text-white' 
                : 'bg-white border border-slate-200'
            }`}>
              {isUser ? (
                <p className="text-sm leading-relaxed">{message.content}</p>
              ) : (
                <ReactMarkdown 
                  className="text-sm prose prose-sm prose-slate max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
                  components={{
                    p: ({ children }) => <p className="my-1 leading-relaxed">{children}</p>,
                    ul: ({ children }) => <ul className="my-1 ml-4 list-disc">{children}</ul>,
                    ol: ({ children }) => <ol className="my-1 ml-4 list-decimal">{children}</ol>,
                    li: ({ children }) => <li className="my-0.5">{children}</li>,
                    code: ({ inline, children }) => (
                      inline ? (
                        <code className="px-1 py-0.5 rounded bg-slate-100 text-slate-700 text-xs">
                          {children}
                        </code>
                      ) : (
                        <pre className="bg-slate-900 text-slate-100 rounded-lg p-3 overflow-x-auto my-2">
                          <code>{children}</code>
                        </pre>
                      )
                    ),
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              )}
            </div>
          )}
          
          {message.tool_calls?.length > 0 && (
            <div className="mt-2 space-y-1">
              {message.tool_calls.map((toolCall, idx) => (
                <div key={idx} className="text-xs bg-blue-50 border border-blue-200 rounded-lg px-3 py-1.5">
                  <span className="font-medium text-blue-700">
                    {toolCall.name?.split('.').pop() || 'Function'}
                  </span>
                  {toolCall.status === 'running' && (
                    <Loader2 className="inline h-3 w-3 ml-2 animate-spin" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        {isUser && (
          <div className="h-8 w-8 rounded-lg bg-slate-700 flex items-center justify-center text-white flex-shrink-0">
            <User className="h-4 w-4" />
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className={`bg-gradient-to-r ${agent.color} text-white flex-shrink-0`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bot className="h-6 w-6" />
            <div>
              <CardTitle className="text-white">{agent.name}</CardTitle>
              <p className="text-sm text-white/80 mt-1">{agent.description}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/20">
            <X className="h-5 w-5" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        {/* Messages */}
        <ScrollArea className="flex-1 p-6">
          <div>
            {messages.length === 0 && (
              <div className="text-center py-12">
                <div className={`mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br ${agent.color} flex items-center justify-center text-white mb-4`}>
                  <Bot className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Start a conversation</h3>
                <p className="text-slate-600 text-sm mb-4">
                  {agent.name} is ready to help. Ask a question to get started.
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {agent.capabilities?.map((cap, idx) => (
                    <Badge key={idx} variant="secondary">{cap}</Badge>
                  ))}
                </div>
              </div>
            )}
            
            {messages.map((msg, idx) => (
              <MessageBubble key={idx} message={msg} />
            ))}
            
            {loading && (
              <div className="flex gap-3 justify-start mb-4">
                <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${agent.color} flex items-center justify-center text-white`}>
                  <Bot className="h-4 w-4" />
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl px-4 py-2.5">
                  <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                </div>
              </div>
            )}
            
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="border-t p-4 flex-shrink-0">
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileUpload}
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || loading}
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Paperclip className="h-4 w-4" />
              )}
            </Button>
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder={`Message ${agent.name}...`}
              disabled={loading}
              className="flex-1"
            />
            <Button onClick={handleSend} disabled={!input.trim() || loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}