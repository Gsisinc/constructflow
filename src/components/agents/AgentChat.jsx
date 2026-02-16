import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Send, X, Paperclip, Bot, User, DollarSign, Calendar, MapPin, ExternalLink, Plus, Sparkles, History, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import { format } from 'date-fns';
import { useQueryClient } from '@tanstack/react-query';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { buildAgentSystemPrompt, getAgentWorkflow } from '@/config/agentWorkflows';
import { shouldInvokeLiveDiscovery } from '@/config/agentRuntimeRules';
import { callAgent } from '@/services/llmService';
import {
  extractDiscoveryFilters,
  normalizeOpportunities,
  rankOpportunities
} from '@/config/bidDiscoveryEngine';


// Helper function removed - now using llmService.parseLLMResponse

export default function AgentChat({ agent, onClose, initialPrompt }) {
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [opportunities, setOpportunities] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const workflow = getAgentWorkflow(agent.id);
  const behavior = workflow || { supportsLiveBidDiscovery: false, showBidOpportunitiesPanel: false };
  const fileInputRef = useRef(null);
  const queryClient = useQueryClient();
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  useEffect(() => {
    let unsubscribe;

    const run = async () => {
      unsubscribe = await initializeConversation();
    };

    run();

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [agent]);

  useEffect(() => {
    if (initialPrompt && conversation && !loading) {
      setTimeout(() => handleSend(initialPrompt), 100);
    }
  }, [conversation, initialPrompt, loading]);

  useEffect(() => {
    // Only fetch opportunities once when we first get messages
    if (behavior.showBidOpportunitiesPanel && messages.length > 0) {
      fetchOpportunities();
    }
  }, [messages.length, behavior.showBidOpportunitiesPanel]);

  useEffect(() => {
    // Scroll to bottom when messages update (bottom = highest scrollTop in normal scroll)
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  const initializeConversation = async () => {
    setLoading(true);

    const localConversation = {
      id: `local-${agent.id}`,
      messages: []
    };

    setConversation(localConversation);
    setMessages([]);
    setLoading(false);
    return undefined;
  };

  const callExternalLLM = async (messageText) => {
    try {
      // Build comprehensive system prompt
      const systemPrompt = `${buildAgentSystemPrompt(agent.id)}

Runtime instructions:
- Never ask the user for organization_id, bid_id, or internal database IDs.
- If IDs are missing, proceed with assumptions and provide actionable output.
- Provide detailed, actionable responses specific to the user's request.
- Use the agent's expertise to deliver high-quality analysis and recommendations.
- Format responses clearly with sections, bullet points, and actionable next steps.`;

      // Call the LLM service
      const response = await callAgent(systemPrompt, messageText, {
        temperature: 0.7,
        maxTokens: 2000
      });

      if (!response) {
        throw new Error('No response from LLM');
      }

      return response;
    } catch (error) {
      console.error('LLM call failed:', error);
      throw error;
    }
  };

  const handleSend = async (overrideMessage) => {
    const messageText = typeof overrideMessage === 'string' ? overrideMessage.trim() : input.trim();
    if (!messageText || !conversation || loading) return;

    setInput('');
    setLoading(true);

    try {
      // Handle live discovery if needed
      if (shouldInvokeLiveDiscovery(agent.id, messageText)) {
        try {
          const filters = extractDiscoveryFilters(messageText);
          const discoveryResponse = await base44.functions.invoke('scrapeCaliforniaBids', {
            workType: filters.workType,
            state: filters.state,
            page: filters.page,
            pageSize: filters.pageSize
          });
          const scraped = rankOpportunities(normalizeOpportunities(null, discoveryResponse));
          setOpportunities(scraped);
        } catch (discoveryError) {
          console.warn('Live discovery failed for this prompt', discoveryError);
        }
      }

      // Add user message
      const userLocalMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: messageText,
        created_date: new Date().toISOString()
      };

      setMessages((prev) => [...prev, userLocalMessage]);

      let content = '';
      let error = null;

      // Try to get response from external LLM
      try {
        const fullPrompt = `Agent: ${agent.name}
Description: ${agent.description}
Capabilities: ${workflow?.capabilities?.join(', ') || 'General project management'}

User Request: ${messageText}`;

        content = await callExternalLLM(fullPrompt);
      } catch (providerError) {
        console.error('External LLM failed:', providerError);
        error = providerError;
        content = `I encountered an error processing your request: ${providerError.message}. Please try again or rephrase your question.`;
      }

      // Add assistant response
      const assistantMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: content || 'I could not generate a response right now. Please retry.',
        created_date: new Date().toISOString(),
        error: error ? true : false
      };

      setMessages((prev) => [...prev, assistantMessage]);
      
      // Show error toast if there was an issue
      if (error) {
        toast.error('LLM Error: ' + error.message);
      }
    } catch (error) {
      console.error('Send error:', error);
      toast.error('Failed to send message: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchOpportunities = async () => {
    try {
      const allOpps = await base44.entities.BidOpportunity.list('-created_date', 100);
      setOpportunities(allOpps);
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

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !conversation) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      await handleSend(`I've uploaded a file: ${file.name}. File URL: ${file_url}`);

      toast.success('File uploaded');
    } catch (error) {
      toast.error('Failed to upload file');
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  const BidOpportunityCard = ({ opportunity }) => {
    const [expanded, setExpanded] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [analysis, setAnalysis] = useState(null);
    
    const statusColors = {
      active: 'bg-green-100 text-green-700',
      upcoming: 'bg-blue-100 text-blue-700',
      closing_soon: 'bg-orange-100 text-orange-700',
      new: 'bg-purple-100 text-purple-700'
    };

    const toggleExpand = async () => {
      if (!expanded && !analysis && conversation) {
        setExpanded(true);
        setAnalyzing(true);
        try {
          await handleSend(`Analyze this bid opportunity in detail: ${opportunity.title || opportunity.project_name}. Project: ${opportunity.project_name || opportunity.title}, Agency: ${opportunity.agency || opportunity.client_name}, Value: $${opportunity.estimated_value?.toLocaleString() || 'Unknown'}, Due: ${opportunity.due_date || 'Not specified'}. Provide a comprehensive analysis including feasibility, risks, and recommendations.`);
          // The analysis will appear in the main chat, so we just mark it as done
          setTimeout(() => {
            setAnalyzing(false);
          }, 500);
        } catch (err) {
          console.error('Analysis failed:', err);
          setAnalyzing(false);
        }
      } else {
        setExpanded(!expanded);
      }
    };

    return (
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-base">{opportunity.title || opportunity.project_name}</CardTitle>
              <CardDescription className="text-xs mt-1">
                {opportunity.agency || opportunity.client_name}
              </CardDescription>
            </div>
            <Badge className={statusColors[opportunity.status] || 'bg-gray-100 text-gray-700'}>
              {opportunity.status || 'active'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2 text-sm">
            {opportunity.estimated_value && (
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                <span>${opportunity.estimated_value.toLocaleString()}</span>
              </div>
            )}
            {opportunity.due_date && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-600" />
                <span>{format(new Date(opportunity.due_date), 'MMM d')}</span>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={toggleExpand} className="flex-1">
              {analyzing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Analyze
                </>
              )}
            </Button>
            <Button size="sm" onClick={() => handleAddToBids(opportunity)} className="flex-1">
              <Plus className="h-4 w-4 mr-2" />
              Add to Bids
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl h-[80vh] flex flex-col">
        {/* Header */}
        <CardHeader className="border-b pb-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-gradient-to-br ${agent.color} text-white`}>
                {agent.icon && <agent.icon className="h-5 w-5" />}
              </div>
              <div>
                <CardTitle>{agent.name}</CardTitle>
                <CardDescription className="text-xs">{agent.description}</CardDescription>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        {/* Messages Area */}
        <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-center">
              <div>
                <Sparkles className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                <p className="text-slate-500">Start a conversation with {agent.name}</p>
                <p className="text-xs text-slate-400 mt-2">Ask questions or describe your needs</p>
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${agent.color} text-white flex-shrink-0 h-8 w-8 flex items-center justify-center`}>
                    <Bot className="h-4 w-4" />
                  </div>
                )}
                <div className={`max-w-md p-3 rounded-lg ${msg.role === 'user' ? 'bg-blue-100 text-blue-900' : 'bg-slate-100 text-slate-900'}`}>
                  {msg.error ? (
                    <p className="text-red-600 text-sm">{msg.content}</p>
                  ) : (
                    <ReactMarkdown className="text-sm prose prose-sm max-w-none">
                      {msg.content}
                    </ReactMarkdown>
                  )}
                </div>
                {msg.role === 'user' && (
                  <div className="p-2 rounded-lg bg-blue-500 text-white flex-shrink-0 h-8 w-8 flex items-center justify-center">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))
          )}
          {loading && (
            <div className="flex gap-3">
              <div className={`p-2 rounded-lg bg-gradient-to-br ${agent.color} text-white flex-shrink-0 h-8 w-8 flex items-center justify-center`}>
                <Bot className="h-4 w-4" />
              </div>
              <div className="bg-slate-100 p-3 rounded-lg">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Bid Opportunities Panel */}
        {behavior.showBidOpportunitiesPanel && opportunities.length > 0 && (
          <div className="border-t p-4 max-h-64 overflow-y-auto bg-slate-50">
            <Collapsible>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between">
                  <span className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Bid Opportunities ({opportunities.length})
                  </span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2">
                {opportunities.slice(0, 3).map((opp) => (
                  <BidOpportunityCard key={opp.id} opportunity={opp} />
                ))}
              </CollapsibleContent>
            </Collapsible>
          </div>
        )}

        {/* Input Area */}
        <div className="border-t p-4 flex-shrink-0 space-y-2">
          <div className="flex gap-2">
            <Input
              placeholder="Ask me anything..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !loading && handleSend()}
              disabled={loading}
              className="flex-1"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              size="icon"
              disabled={loading || uploading}
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              size="icon"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileUpload}
          />
          {workflow && (
            <div className="text-xs text-slate-500 p-2 bg-slate-50 rounded">
              <strong>Agent Capabilities:</strong> {workflow.capabilities?.join(', ') || 'General assistance'}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
