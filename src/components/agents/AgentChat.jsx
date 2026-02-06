import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Loader2, Send, X, Paperclip, Bot, User, DollarSign, Calendar, MapPin, ExternalLink, Plus, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import { format } from 'date-fns';
import { useQueryClient } from '@tanstack/react-query';

export default function AgentChat({ agent, onClose, initialPrompt }) {
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [opportunities, setOpportunities] = useState([]);
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    initializeConversation();
  }, [agent]);

  useEffect(() => {
    if (initialPrompt && conversation) {
      setInput(initialPrompt);
      setTimeout(() => handleSend(), 500);
    }
  }, [conversation, initialPrompt]);

  useEffect(() => {
    // Fetch opportunities every 3 seconds to show newly created ones
    const interval = setInterval(() => {
      fetchOpportunities();
    }, 3000);
    
    // Also fetch on mount and when messages change
    fetchOpportunities();
    
    return () => clearInterval(interval);
  }, []);

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
      setLoading(false);

      // Subscribe to real-time updates
      const unsubscribe = base44.agents.subscribeToConversation(conv.id, (data) => {
        console.log('Received conversation update:', data);
        setMessages(data.messages);
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (error) {
      toast.error('Failed to start conversation: ' + (error.message || 'Unknown error'));
      console.error('Init conversation error:', error);
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !conversation || loading) return;

    const userMessage = input.trim();
    setInput('');
    setLoading(true);

    try {
      console.log('Sending message:', userMessage);
      console.log('Conversation:', conversation);
      await base44.agents.addMessage(conversation, {
        role: 'user',
        content: userMessage
      });
      console.log('Message sent successfully');
    } catch (error) {
      toast.error('Failed to send message: ' + (error.message || 'Unknown error'));
      console.error('Send message error:', error);
      setLoading(false);
    }
  };

  const fetchOpportunities = async () => {
    try {
      const opps = await base44.entities.BidOpportunity.list('-created_date', 50);
      setOpportunities(opps);
    } catch (error) {
      console.error('Failed to fetch opportunities:', error);
    }
  };

  const handleAddToBids = async (opportunity) => {
    try {
      await base44.entities.Bid.create({
        rfp_name: opportunity.project_name || opportunity.title,
        client_name: opportunity.agency || opportunity.client_name,
        status: 'draft',
        bid_amount: opportunity.estimated_value || 0,
        due_date: opportunity.due_date,
        win_probability: opportunity.win_probability || 50,
        notes: opportunity.description
      });
      queryClient.invalidateQueries({ queryKey: ['bids'] });
      toast.success('Added to bid pipeline!');
    } catch (error) {
      toast.error('Failed to add bid');
      console.error(error);
    }
  };

  const handleAnalyze = async (opportunity) => {
    const analysisPrompt = `Please provide a comprehensive analysis of the bid opportunity you already researched and stored:

**BID ID:** ${opportunity.id}
**Project:** ${opportunity.title || opportunity.project_name}
**Agency:** ${opportunity.agency || opportunity.client_name}

Using the detailed information you already extracted and stored for this bid, please provide a full analysis organized into these sections:

1. **PROJECT OVERVIEW** - Summarize the project scope and objectives
2. **KEY REQUIREMENTS** - List all technical, bonding, licensing, and qualification requirements
3. **CONTACT INFORMATION** - Provide all contact details for questions and submissions
4. **IMPORTANT DATES** - List all deadlines: bid due, pre-bid meetings, site visits, question deadlines
5. **REQUIRED DOCUMENTS** - List all attachments and documents needed for submission
6. **SCOPE DETAILS** - Detailed breakdown of work to be performed
7. **CHALLENGES & RISKS** - Identify potential issues or concerns
8. **WIN PROBABILITY** - Assess our chances (0-100%) based on project fit
9. **RECOMMENDATION** - Should we bid? Why or why not?

Please reference the complete details you stored when you first found this opportunity.`;

    setInput(analysisPrompt);
    setTimeout(() => handleSend(), 100);
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

  const BidOpportunityCard = ({ opportunity }) => {
    const statusColors = {
      active: 'bg-green-100 text-green-700',
      upcoming: 'bg-blue-100 text-blue-700',
      closing_soon: 'bg-orange-100 text-orange-700',
      new: 'bg-purple-100 text-purple-700'
    };

    return (
      <Card className="mb-3 hover:shadow-md transition-all">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <Badge className={statusColors[opportunity.status] || 'bg-slate-100 text-slate-700'}>
                {opportunity.status?.replace('_', ' ').toUpperCase()}
              </Badge>
              <CardTitle className="mt-2 text-base">{opportunity.project_name || opportunity.title}</CardTitle>
              <CardDescription className="text-sm">
                {opportunity.agency || opportunity.client_name}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          <div className="grid grid-cols-2 gap-2 text-xs">
            {opportunity.estimated_value && (
              <div className="flex items-center gap-1.5">
                <DollarSign className="h-3.5 w-3.5 text-slate-400" />
                <span className="font-medium">${opportunity.estimated_value?.toLocaleString()}</span>
              </div>
            )}
            {opportunity.due_date && (
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                <span>{format(new Date(opportunity.due_date), 'MMM d')}</span>
              </div>
            )}
            {opportunity.location && (
              <div className="flex items-center gap-1.5 col-span-2">
                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                <span className="truncate text-slate-600">{opportunity.location}</span>
              </div>
            )}
          </div>
          
          {opportunity.description && (
            <p className="text-xs text-slate-600 line-clamp-2">{opportunity.description}</p>
          )}

          <div className="flex gap-2">
            <Button 
              size="sm"
              className="flex-1 h-8 text-xs gap-1.5"
              onClick={() => handleAnalyze(opportunity)}
            >
              <Sparkles className="h-3.5 w-3.5" />
              Full Analysis
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              className="flex-1 h-8 text-xs gap-1.5"
              onClick={() => handleAddToBids(opportunity)}
            >
              <Plus className="h-3.5 w-3.5" />
              Add to Bids
            </Button>
          </div>
          
          {opportunity.url && (
            <Button 
              size="sm" 
              variant="ghost"
              className="w-full h-7 text-xs gap-1.5"
              onClick={() => window.open(opportunity.url, '_blank')}
            >
              <ExternalLink className="h-3 w-3" />
              View Source
            </Button>
          )}
        </CardContent>
      </Card>
    );
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
        <div className="flex-1 overflow-y-auto p-6">
          <div>
            {messages.length === 0 && opportunities.length === 0 && (
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

            {/* Opportunities Cards - Show after messages */}
            {opportunities.length > 0 && (
              <div className="mt-6">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b">
                  <Sparkles className="h-4 w-4 text-blue-600" />
                  <h3 className="text-sm font-semibold text-slate-700">Discovered Opportunities ({opportunities.length})</h3>
                </div>
                <div className="space-y-3">
                  {opportunities.map((opp) => (
                    <BidOpportunityCard key={opp.id} opportunity={opp} />
                  ))}
                </div>
              </div>
            )}
            
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
        </div>

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