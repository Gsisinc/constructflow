import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Send, X, Paperclip, Bot, User, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import BlueprintUploader from '@/components/agents/BlueprintUploader';
import BlueprintEstimateResult from '@/components/agents/BlueprintEstimateResult';
import { analyzeBlueprintWithVision, analyzeBlueprintFromPDF } from '@/services/bidDocumentAnalysisService';
import { callAgent } from '@/services/llmService';

/**
 * Local agent chat: uses Claude/OpenAI via callAgent (existing API keys).
 * Supports vision/PDF via BlueprintUploader. No backend conversation storage.
 */
export default function LocalAgentChat({ agent, onClose, initialPrompt }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [blueprintResult, setBlueprintResult] = useState(null);
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
      sendMessage(initialPrompt);
    }
  }, [initialPrompt]);

  const sendMessage = async (overrideText) => {
    const text = typeof overrideText === 'string' ? overrideText.trim() : input.trim();
    if (!text || loading) return;

    const userMsg = { id: crypto.randomUUID(), role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const systemPrompt = agent.systemPrompt || `You are ${agent.name}. ${agent.description}`;
      const response = await callAgent(systemPrompt, text);
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: 'assistant', content: response || 'No response.' },
      ]);
    } catch (err) {
      console.error('Local agent error:', err);
      toast.error(err?.message || 'Request failed. Check API keys in Settings.');
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `Error: ${err?.message}. Add a Claude or OpenAI API key in Settings → API status and try again.`,
          error: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const msg = `I've attached a file: ${file.name}. I cannot read binary files directly here — please paste the relevant text, or use the blueprint/image analyzer below for images or PDFs.`;
    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: 'user', content: msg }]);
    setLoading(true);
    try {
      const systemPrompt = agent.systemPrompt || `You are ${agent.name}. ${agent.description}`;
      const response = await callAgent(systemPrompt, msg);
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: 'assistant', content: response || 'Noted.' },
      ]);
    } catch (err) {
      toast.error(err?.message || 'Request failed.');
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: 'assistant', content: `Error: ${err?.message}`, error: true },
      ]);
    } finally {
      setLoading(false);
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleBlueprintAnalysis = async (imageUrl, options = {}) => {
    if (loading) return;
    setLoading(true);

    const isPdf = !!options.pdfFile;
    const userContent = isPdf
      ? '📐 Analyzing PDF with computer vision...'
      : '📐 Analyzing uploaded image with computer vision...';
    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: 'user', content: userContent }]);

    const userPrompt =
      input.trim() ||
      'Extract all dimensions, quantities, and key information. Summarize for the agent.';

    try {
      let structured;
      if (isPdf) {
        const { combined, pages } = await analyzeBlueprintFromPDF(options.pdfFile, userPrompt, { maxPages: 20 });
        structured = { ...combined, _pdfPages: pages };
      } else {
        structured = await analyzeBlueprintWithVision(imageUrl, userPrompt, options);
      }
      setBlueprintResult({ ...structured, imageUrl: imageUrl || undefined });

      const summary =
        typeof structured === 'string'
          ? structured
          : JSON.stringify(
              {
                drawing_overview: structured.drawing_overview,
                line_items: (structured.line_items || []).slice(0, 15),
                summary: structured.summary,
                assumptions: structured.assumptions,
                confidence: structured.confidence,
              },
              null,
              2
            );
      const agentPrompt = `The user shared this document/image analysis (vision extraction):\n\n${summary}\n\nRespond based on this data. If they asked a specific question, answer it; otherwise provide a short summary and any recommendations.`;
      const systemPrompt = agent.systemPrompt || `You are ${agent.name}. ${agent.description} You can interpret blueprint/drawing data and PDF extractions.`;
      const response = await callAgent(systemPrompt, agentPrompt);
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: 'assistant', content: response || 'Analysis complete. See the takeoff panel below.' },
      ]);
      setInput('');
    } catch (err) {
      console.error('Blueprint analysis error:', err);
      toast.error(err?.message || 'Vision analysis failed.');
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `Error: ${err?.message}. Check your API key (Claude/OpenAI) supports vision.`,
          error: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const agentColor = agent.color || 'from-violet-500 to-violet-600';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-0 sm:p-4">
      <Card className="w-full max-w-2xl h-full sm:h-[80vh] flex flex-col shadow-2xl rounded-none sm:rounded-xl">
        <CardHeader className="border-b pb-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-gradient-to-br ${agentColor} text-white`}>
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base">{agent.name}</CardTitle>
                <CardDescription className="text-xs">
                  {agent.description} · Uses Claude/OpenAI (your API key)
                </CardDescription>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full text-center">
              <div>
                <Sparkles className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                <p className="text-slate-500 font-medium">Start a conversation with {agent.name}</p>
                <p className="text-xs text-slate-400 mt-1">
                  Ask anything. Attach images or PDFs for vision extraction.
                </p>
              </div>
            </div>
          )}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div
                  className={`p-2 rounded-lg bg-gradient-to-br ${agentColor} text-white flex-shrink-0 h-8 w-8 flex items-center justify-center`}
                >
                  <Bot className="h-4 w-4" />
                </div>
              )}
              <div
                className={`max-w-md p-3 rounded-lg text-sm ${
                  msg.role === 'user'
                    ? 'bg-blue-100 text-blue-900'
                    : msg.error
                      ? 'bg-red-50 text-red-700'
                      : 'bg-slate-100 text-slate-900'
                }`}
              >
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
              <div
                className={`p-2 rounded-lg bg-gradient-to-br ${agentColor} text-white flex-shrink-0 h-8 w-8 flex items-center justify-center`}
              >
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

        {blueprintResult && (
          <div className="px-4 pb-2">
            <BlueprintEstimateResult
              result={blueprintResult}
              imageUrl={blueprintResult.imageUrl}
              onClose={() => setBlueprintResult(null)}
            />
          </div>
        )}

        <div className="border-t p-4 flex-shrink-0 space-y-3">
          <BlueprintUploader onAnalysis={handleBlueprintAnalysis} disabled={loading} />
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
            <Button onClick={() => sendMessage()} disabled={loading || !input.trim()} size="icon">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
          <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} />
        </div>
      </Card>
    </div>
  );
}
