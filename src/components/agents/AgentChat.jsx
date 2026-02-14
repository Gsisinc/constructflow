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
import { parseLlmJsonResponse } from '@/lib/llmResponse';
import {
  extractDiscoveryFilters,
  normalizeOpportunities,
  rankOpportunities
} from '@/config/bidDiscoveryEngine';


function getAssistantText(response) {
  const parsed = parseLlmJsonResponse(response);
  if (typeof parsed === 'string') return parsed.trim();
  if (parsed && typeof parsed === 'object') {
    return parsed.answer || parsed.response || parsed.content || parsed.text || parsed.output || '';
  }
  return '';
}

function buildLocalFallbackResponse(agent, workflow, messageText) {
  const title = workflow?.name || agent?.name || 'Assistant';
  const purpose = workflow?.purpose || agent?.description || 'Provide practical construction guidance.';
  const outputs = Array.isArray(workflow?.outputs) ? workflow.outputs : [];
  const workflowSteps = Array.isArray(workflow?.workflow) ? workflow.workflow : [];
  const sample = workflow?.sampleOutput || '';

  const immediateActions = workflowSteps
    .slice(0, 3)
    .map((step, index) => `${index + 1}. ${step}`)
    .join('\n');

  const deliverables = outputs.length > 0
    ? outputs.map((item) => `- ${item}`).join('\n')
    : '- Action plan\n- Risks and mitigations\n- Next steps';

  return [
    `### ${title} response (local fallback)`,
    '',
    `I could not reach the live AI provider, so I generated an immediate in-app response for your request: **"${messageText}"**.`,
    '',
    `**Purpose**: ${purpose}`,
    '',
    '**Immediate workflow**',
    immediateActions || '1. Clarify your objective\n2. Build action plan\n3. Recommend next execution steps',
    '',
    '**Expected deliverables**',
    deliverables,
    '',
    sample ? `**Reference output style**: ${sample}` : '',
    '',
    '**Next step**: Reply with any missing details (deadline, budget range, location, constraints), and I will refine this into final output.'
  ].filter(Boolean).join('\n');
}

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
    const configuredProviders = (import.meta.env.VITE_AI_PROVIDER_PRIORITY || 'openai')
      .split(',')
      .map((provider) => provider.trim().toLowerCase())
      .filter(Boolean);

    const response = await base44.functions.invoke('invokeExternalLLM', {
      prompt: messageText,
      systemPrompt: `${buildAgentSystemPrompt(agent.id)}

Runtime instructions:
- Never ask the user for organization_id, bid_id, or internal database IDs.
- If IDs are missing, proceed with assumptions and provide actionable output.`,
      temperature: 0.2,
      preferredProviders: configuredProviders.length > 0 ? configuredProviders : ['openai']
    });

    const parsed = parseLlmJsonResponse(response);
    return parsed?.output || parsed?.response || parsed?.answer || parsed?.content || '';
  };

  const handleSend = async (overrideMessage) => {
    const messageText = typeof overrideMessage === 'string' ? overrideMessage.trim() : input.trim();
    if (!messageText || !conversation || loading) return;

    setInput('');
    setLoading(true);

    try {
      if (shouldInvokeLiveDiscovery(agent.id, messageText)) {
        const filters = extractDiscoveryFilters(messageText);
        const discoveryResponse = await base44.functions.invoke('scrapeCaliforniaBids', {
          workType: filters.workType,
          state: filters.state,
          page: filters.page,
          pageSize: filters.pageSize
        });
        const scraped = rankOpportunities(normalizeOpportunities(null, discoveryResponse));
        setOpportunities(scraped);
      }
    } catch (discoveryError) {
      console.warn('Live discovery failed for this prompt', discoveryError);
    }

    {
      const userLocalMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: messageText,
        created_date: new Date().toISOString()
      };

      setMessages((prev) => [...prev, userLocalMessage]);

      try {
        let content = '';
        let providerErrors = [];
        try {
          content = await callExternalLLM(`Agent: ${agent.name}\nDescription: ${agent.description}\nUser: ${messageText}`);
        } catch (providerError) {
          providerErrors.push(`invokeExternalLLM: ${providerError?.message || providerError}`);
          console.warn('invokeExternalLLM failed', providerError);
        }

        if (!content) {
          try {
            const coreFallback = await base44.integrations.Core.InvokeLLM({
              prompt: `${buildAgentSystemPrompt(agent.id)}\n\nUser: ${messageText}`,
              temperature: 0.2
            });
            content = getAssistantText(coreFallback);
          } catch (coreError) {
            providerErrors.push(`Core.InvokeLLM: ${coreError?.message || coreError}`);
            console.warn('Core.InvokeLLM fallback failed', coreError);
          }
        }

        if (!content) {
          content = buildLocalFallbackResponse(agent, workflow, messageText);
          if (providerErrors.length > 0) {
            toast.warning('Live AI is unavailable. Using local fallback response.');
          }
        }

        const assistantMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: content || 'I could not generate a response right now. Please retry.',
          created_date: new Date().toISOString()
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } catch (error) {
        console.error('Fallback send error:', error);
        toast.error('Failed to send message in fallback mode');
      } finally {
        setLoading(false);
      }

      return;
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
            setAnalysis('Analysis complete - see chat above');
          }, 1000);
        } catch {
          setAnalyzing(false);
          toast.error('Failed to analyze');
        }
      } else {
        setExpanded(!expanded);
      }
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
                <span>
                  {(() => {
                    try {
                      const date = new Date(opportunity.due_date);
                      if (isNaN(date.getTime())) {
                        return opportunity.due_date;
                      }
                      return format(date, 'MMM d');
                    } catch {
                      return opportunity.due_date;
                    }
                  })()}
                </span>
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
            <p className={`text-xs text-slate-600 ${expanded ? '' : 'line-clamp-2'}`}>{opportunity.description}</p>
          )}

          {expanded && (
            <div className="space-y-2 pt-2 border-t">
              {analyzing ? (
                <div className="flex items-center gap-2 py-2">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  <p className="text-xs text-slate-600">Generating detailed analysis...</p>
                </div>
              ) : (
                <>
                  {opportunity.scope_of_work && (
                    <div>
                      <p className="text-xs font-semibold text-slate-700">Scope of Work:</p>
                      <p className="text-xs text-slate-600">{opportunity.scope_of_work}</p>
                    </div>
                  )}
                  {opportunity.requirements && opportunity.requirements.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-slate-700">Requirements:</p>
                      <ul className="text-xs text-slate-600 list-disc list-inside">
                        {opportunity.requirements.map((req, idx) => (
                          <li key={idx}>{req}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {opportunity.ai_analysis && (
                    <div>
                      <p className="text-xs font-semibold text-slate-700">AI Analysis:</p>
                      <div className="text-xs text-slate-600 space-y-1">
                        {opportunity.ai_analysis.complexity_score && (
                          <p>Complexity Score: {opportunity.ai_analysis.complexity_score}/10</p>
                        )}
                        {opportunity.ai_analysis.recommended_markup && (
                          <p>Recommended Markup: {opportunity.ai_analysis.recommended_markup}%</p>
                        )}
                        {opportunity.ai_analysis.risk_factors && opportunity.ai_analysis.risk_factors.length > 0 && (
                          <div>
                            <p className="font-medium">Risk Factors:</p>
                            <ul className="list-disc list-inside">
                              {opportunity.ai_analysis.risk_factors.map((risk, idx) => (
                                <li key={idx}>{risk}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {analysis && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                      <p className="text-xs text-blue-700 font-medium">✓ Full analysis generated - check the chat above</p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <Button 
              size="sm"
              className="flex-1 h-8 text-xs gap-1.5"
              onClick={toggleExpand}
              disabled={analyzing}
            >
              {analyzing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
              {expanded ? 'Hide Details' : 'Full Analysis'}
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
    <Card className="h-full flex flex-col overflow-hidden">
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

      <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-6" style={{maxHeight: 'calc(100% - 140px)'}}>
        {/* History Toggle - Only show if there are messages */}
        {messages.length > 2 && (
          <Collapsible open={showHistory} onOpenChange={setShowHistory} className="mb-4">
            <CollapsibleTrigger asChild>
              <Button variant="outline" size="sm" className="w-full gap-2">
                <History className="h-4 w-4" />
                {showHistory ? 'Hide' : 'Show'} Chat History ({messages.length} messages)
                <ChevronDown className={`h-4 w-4 transition-transform ${showHistory ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4 space-y-4 border-l-2 border-slate-200 pl-4">
              {messages.slice(0, -2).map((msg, idx) => (
                <MessageBubble key={idx} message={msg} />
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Current Conversation */}
        <div>
          {messages.length === 0 && (!behavior.showBidOpportunitiesPanel || opportunities.length === 0) && (
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
          
          {/* Show messages in chronological order (oldest first, newest last) */}
          {(showHistory ? messages : messages.slice(-2)).map((msg, idx) => (
            <MessageBubble key={idx} message={msg} />
          ))}

          {/* Opportunities Cards - Show after messages */}
          {behavior.showBidOpportunitiesPanel && opportunities.length > 0 && (
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
          
          <div ref={messagesEndRef} />
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
    </Card>
  );
}
