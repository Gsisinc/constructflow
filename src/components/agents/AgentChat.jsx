import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Send, X, Paperclip, Bot, User, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import { getAgentWorkflow, buildAgentSystemPrompt } from '@/config/agentWorkflows';
import { callAgent } from '@/services/llmService';
import { shouldInvokeLiveDiscovery } from '@/config/agentRuntimeRules';
import { fetchDiscoveryFromSources } from '@/lib/bidDiscoveryOrchestrator';

export default function AgentChat({ agent, onClose, initialPrompt }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const sentInitial = useRef(false);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  useEffect(() => {
    if (initialPrompt && !sentInitial.current) {
      sentInitial.current = true;
      setTimeout(() => sendMessage(initialPrompt), 200);
    }
  }, [initialPrompt]);

  const sendMessage = async (overrideText) => {
    const text = typeof overrideText === 'string' ? overrideText.trim() : input.trim();
    if (!text || loading) return;

    setInput('');
    setLoading(true);

    const userMsg = { id: crypto.randomUUID(), role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);

    try {
      const workflow = getAgentWorkflow(agent.id);
      let userMessageForLLM = text;
      let discoverySummary = '';

      // Market Intelligence: trigger live discovery when user asks for opportunities
      if (agent.id === 'market_intelligence' && shouldInvokeLiveDiscovery(agent.id, text)) {
        try {
          const lower = text.toLowerCase();
          const stateMatch = lower.match(/\b(california|ca|texas|florida|new york|washington)\b/);
          const filters = {
            state: stateMatch ? (stateMatch[1] === 'ca' ? 'California' : stateMatch[1].replace(/\b\w/g, c => c.toUpperCase())) : 'California',
            workType: 'all',
            classification: 'all'
          };
          const { opportunities = [] } = await fetchDiscoveryFromSources({
            base44Client: base44,
            filters,
            page: 1,
            pageSize: 25
          });
          if (opportunities.length > 0) {
            discoverySummary = opportunities.slice(0, 15).map((opp, i) =>
              `${i + 1}. ${opp.title || 'Untitled'} | ${opp.agency || 'N/A'} | ${opp.location || 'N/A'} | Due: ${opp.due_date || 'N/A'} | ${opp.url ? opp.url : ''}`
            ).join('\n');
            userMessageForLLM = `${text}\n\n[Live discovery results from SAM.gov and county portals - use these real opportunities in your response. Do not fabricate; only reference these.]\n${discoverySummary}`;
          } else {
            userMessageForLLM = `${text}\n\n[Live discovery was run but no opportunities were returned from sources. State this clearly and suggest checking filters or SAM.gov API key.]`;
          }
        } catch (discoveryErr) {
          console.warn('Live discovery failed:', discoveryErr);
          userMessageForLLM = `${text}\n\n[Live discovery could not be completed (${discoveryErr.message}). Answer from your workflow and advise the user to try the Bid Discovery page or check API configuration.]`;
        }
      }

      if (workflow) {
        const systemPrompt = buildAgentSystemPrompt(agent.id);
        const content = await callAgent(systemPrompt, userMessageForLLM);
        setMessages(prev => [...prev, {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: content || 'I could not generate a response. Please try again.'
        }]);
      } else {
        const systemPrompt = `You are ${agent.name}, a specialized AI assistant for construction project management.
${agent.description ? `Your role: ${agent.description}` : ''}
Provide detailed, actionable, and expert responses. Format with bullet points and clear sections where appropriate.
Never ask for internal database IDs. Proceed with best-effort answers based on context provided.`;

        const result = await base44.integrations.Core.InvokeLLM({
          prompt: `${systemPrompt}\n\nUser: ${userMessageForLLM}`,
        });

        const content = typeof result === 'string' ? result : (result?.text || result?.output || JSON.stringify(result));

        setMessages(prev => [...prev, {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: content || 'I could not generate a response. Please try again.'
        }]);
      }
    } catch (err) {
      console.error('LLM error:', err);
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `Error: ${err.message}. Please try again.`,
        error: true
      }]);
      toast.error('Agent error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await sendMessage(`I've uploaded a file: ${file.name}. URL: ${file_url}. Please analyze it.`);
      toast.success('File uploaded');
    } catch (err) {
      toast.error('Upload failed: ' + err.message);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const agentColor = agent.color || 'from-blue-500 to-blue-600';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl h-[80vh] flex flex-col shadow-2xl">
        {/* Header */}
        <CardHeader className="border-b pb-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-gradient-to-br ${agentColor} text-white`}>
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base">{agent.name}</CardTitle>
                <CardDescription className="text-xs">{agent.description}</CardDescription>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full text-center">
              <div>
                <Sparkles className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                <p className="text-slate-500 font-medium">Start a conversation with {agent.name}</p>
                <p className="text-xs text-slate-400 mt-1">Ask questions or describe your needs</p>
              </div>
            </div>
          )}
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className={`p-2 rounded-lg bg-gradient-to-br ${agentColor} text-white flex-shrink-0 h-8 w-8 flex items-center justify-center`}>
                  <Bot className="h-4 w-4" />
                </div>
              )}
              <div className={`max-w-md p-3 rounded-lg text-sm ${msg.role === 'user' ? 'bg-blue-100 text-blue-900' : msg.error ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-900'}`}>
                <ReactMarkdown className="prose prose-sm max-w-none">{msg.content}</ReactMarkdown>
              </div>
              {msg.role === 'user' && (
                <div className="p-2 rounded-lg bg-blue-500 text-white flex-shrink-0 h-8 w-8 flex items-center justify-center">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex gap-3">
              <div className={`p-2 rounded-lg bg-gradient-to-br ${agentColor} text-white flex-shrink-0 h-8 w-8 flex items-center justify-center`}>
                <Bot className="h-4 w-4" />
              </div>
              <div className="bg-slate-100 p-3 rounded-lg flex items-center gap-2 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Thinking...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t p-4 flex-shrink-0">
          <div className="flex gap-2">
            <Input
              placeholder="Ask me anything..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && !loading && sendMessage()}
              disabled={loading}
              className="flex-1"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              size="icon"
              disabled={loading || uploading}
              title="Attach file"
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
            </Button>
            <Button
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              size="icon"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
          <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} />
        </div>
      </Card>
    </div>
  );
}