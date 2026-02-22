import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Send, X, Paperclip, Bot, User, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import BlueprintUploader from '@/components/agents/BlueprintUploader';
import BlueprintEstimateResult from '@/components/agents/BlueprintEstimateResult';
import { analyzeBlueprintWithVision } from '@/services/bidDocumentAnalysisService';

export default function AgentChat({ agent, onClose, initialPrompt }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [conversation, setConversation] = useState(null);
  const [blueprintResult, setBlueprintResult] = useState(null);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const sentInitial = useRef(false);
  const unsubscribeRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  // Init conversation and subscribe
  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      try {
        const conv = await base44.agents.createConversation({ agent_name: agent.id });
        if (cancelled) return;
        setConversation(conv);

        unsubscribeRef.current = base44.agents.subscribeToConversation(conv.id, (updated) => {
          const agentMessages = updated.messages
            .filter(m => m.role === 'assistant' || m.role === 'user')
            .map(m => ({ id: m.id || crypto.randomUUID(), role: m.role, content: m.content }));
          setMessages(agentMessages);
          setLoading(false);
        });
      } catch (err) {
        console.error('Failed to create conversation:', err);
        toast.error('Could not start agent conversation: ' + err.message);
      }
    };
    init();
    return () => {
      cancelled = true;
      if (unsubscribeRef.current) unsubscribeRef.current();
    };
  }, [agent.id]);

  // Send initial prompt once conversation is ready
  useEffect(() => {
    if (conversation && initialPrompt && !sentInitial.current) {
      sentInitial.current = true;
      setTimeout(() => sendMessage(initialPrompt), 200);
    }
  }, [conversation, initialPrompt]);

  const sendMessage = async (overrideText) => {
    const text = typeof overrideText === 'string' ? overrideText.trim() : input.trim();
    if (!text || loading || !conversation) return;

    setInput('');
    setLoading(true);

    try {
      await base44.agents.addMessage(conversation, { role: 'user', content: text });
    } catch (err) {
      console.error('Send error:', err);
      toast.error('Failed to send message: ' + err.message);
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

  const handleBlueprintAnalysis = async (imageUrl, options = {}) => {
    if (loading) return;
    setLoading(true);

    const userMsg = { id: crypto.randomUUID(), role: 'user', content: '📐 Analyzing uploaded blueprint with computer vision...' };
    setMessages(prev => [...prev, userMsg]);

    const userPrompt = input.trim() || 'Analyze this blueprint. Extract all dimensions, quantities of materials, and generate a complete material takeoff table and cost estimate with labor and materials broken down.';

    try {
      const structured = await analyzeBlueprintWithVision(imageUrl, userPrompt, options);
      setBlueprintResult({ ...structured, imageUrl });
      setInput('');
    } catch (err) {
      console.error('Blueprint analysis error:', err);
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `Error analyzing blueprint: ${err.message}. For vision analysis, add VITE_OPENAI_API_KEY in Settings (OpenAI key is required for blueprint reading).`,
        error: true,
      }]);
      toast.error('Vision analysis failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const isReady = !!conversation;

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
                {!isReady ? (
                  <>
                    <Loader2 className="h-12 w-12 mx-auto mb-4 text-slate-300 animate-spin" />
                    <p className="text-slate-500 font-medium">Starting {agent.name}...</p>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                    <p className="text-slate-500 font-medium">Start a conversation with {agent.name}</p>
                    <p className="text-xs text-slate-400 mt-1">Ask questions or describe your needs</p>
                  </>
                )}
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

        {/* Blueprint Estimate Result Panel */}
        {blueprintResult && (
          <div className="px-4 pb-2">
            <BlueprintEstimateResult
              result={blueprintResult}
              imageUrl={blueprintResult.imageUrl}
              onClose={() => setBlueprintResult(null)}
            />
          </div>
        )}

        {/* Input */}
        <div className="border-t p-4 flex-shrink-0 space-y-3">
          {/* Blueprint uploader — shown for blueprint agent or any agent */}
          {isReady && (
            <BlueprintUploader onAnalysis={handleBlueprintAnalysis} disabled={loading} />
          )}
          <div className="flex gap-2">
            <Input
              placeholder="Ask me anything..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && !loading && sendMessage()}
              disabled={loading || !isReady}
              className="flex-1"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              size="icon"
              disabled={loading || uploading || !isReady}
              title="Attach file"
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
            </Button>
            <Button
              onClick={() => sendMessage()}
              disabled={loading || !input.trim() || !isReady}
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