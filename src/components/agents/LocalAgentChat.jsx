import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Send, X, Bot, User, Sparkles, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import BlueprintUploader from '@/components/agents/BlueprintUploader';
import BlueprintEstimateResult from '@/components/agents/BlueprintEstimateResult';
import { analyzeBlueprintWithVision, analyzeBlueprintFromPDF } from '@/services/bidDocumentAnalysisService';
import { useVoiceChat } from '@/hooks/useVoiceChat';
import { buildPageContext, AGENT_GROUNDING } from '@/lib/agentContext';

/**
 * Agency specialist chat — backed by the Base44 platform agent (agency_specialist),
 * so it runs server-side (no browser CORS / API keys). The agent's role is injected
 * as the conversation preamble. Voice-enabled (mic + spoken replies).
 */
export default function LocalAgentChat({ agent, onClose, initialPrompt, pageName = 'AIAgents', autoListen = false }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [blueprintResult, setBlueprintResult] = useState(null);
  const [conversation, setConversation] = useState(null);
  const [preamble, setPreamble] = useState('');
  const preambleSentRef = useRef(false);
  const messagesEndRef = useRef(null);
  const sentInitial = useRef(false);
  const unsubscribeRef = useRef(null);
  const lastSpokenRef = useRef(null);

  const { listening, toggleListening, speak, stopSpeaking, voiceEnabled, setVoiceEnabled, supported: voiceSupported } = useVoiceChat({
    onFinalTranscript: (txt) => setInput(txt),
  });

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages.length]);

  useEffect(() => {
    const last = messages[messages.length - 1];
    if (last && last.role === 'assistant' && last.id && last.id !== lastSpokenRef.current) {
      lastSpokenRef.current = last.id;
      speak(last.content);
    }
  }, [messages, speak]);

  // Build role + page preamble once
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const ctx = await buildPageContext(pageName);
      const role = `You are acting as ${agent.name}. ${agent.systemPrompt || agent.description}`;
      if (!cancelled) setPreamble(`${role}\n\n${ctx}.${AGENT_GROUNDING}`);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agent.id]);

  // Init platform agent conversation (agency_specialist backs all Agency library agents)
  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      try {
        const conv = await base44.agents.createConversation({ agent_name: 'agency_specialist' });
        if (cancelled) return;
        setConversation(conv);
        unsubscribeRef.current = base44.agents.subscribeToConversation(conv.id, (updated) => {
          const agentMessages = (updated?.messages || [])
            .filter(m => m.role === 'assistant' || m.role === 'user')
            .map(m => ({ id: m.id || crypto.randomUUID(), role: m.role, content: m.content }));
          setMessages(agentMessages);
          setLoading(false);
        });
      } catch (err) {
        setMessages([{ id: crypto.randomUUID(), role: 'assistant', content: `This agent is temporarily unavailable (${err.message || 'service error'}).` }]);
      }
    };
    init();
    return () => { cancelled = true; if (unsubscribeRef.current) unsubscribeRef.current(); stopSpeaking(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { if (autoListen && conversation) toggleListening(); /* eslint-disable-next-line */ }, [conversation]);

  useEffect(() => {
    if (conversation && initialPrompt && !sentInitial.current) {
      sentInitial.current = true;
      setTimeout(() => sendMessage(initialPrompt), 200);
    }
    // eslint-disable-next-line
  }, [conversation, initialPrompt]);

  const sendMessage = async (overrideText) => {
    const text = (typeof overrideText === 'string' ? overrideText : input).trim();
    if (!text || loading || !conversation) return;
    let payload = text;
    if (!preambleSentRef.current && preamble) { payload = `${preamble}\n\nUser: ${text}`; preambleSentRef.current = true; }
    setInput('');
    setLoading(true);
    stopSpeaking();
    try {
      await base44.agents.addMessage(conversation, { role: 'user', content: payload });
    } catch (err) {
      toast.error('Failed to send: ' + err.message);
      setLoading(false);
    }
  };

  const handleBlueprintAnalysis = async (imageUrl, options = {}) => {
    if (loading) return;
    setLoading(true);
    setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'user', content: options.pdfFile ? 'Analyzing PDF with computer vision...' : 'Analyzing uploaded image with computer vision...' }]);
    const userPrompt = input.trim() || 'Extract all dimensions, quantities, and key information. Summarize for the agent.';
    try {
      let structured;
      if (options.pdfFile) {
        const { combined } = await analyzeBlueprintFromPDF(options.pdfFile, userPrompt, { maxPages: 20 });
        structured = combined;
      } else {
        structured = await analyzeBlueprintWithVision(imageUrl, userPrompt, options);
      }
      setBlueprintResult({ ...structured, imageUrl: imageUrl || undefined });
      const summary = typeof structured === 'string' ? structured : JSON.stringify({ overview: structured.drawing_overview, items: (structured.line_items || []).slice(0, 15), summary: structured.summary }, null, 2);
      setInput('');
      await sendMessage(`Here is a blueprint/image analysis (vision extraction):\n\n${summary}\n\nRespond based on this data. If I asked a question, answer it; otherwise give a short summary and recommendations.`);
    } catch (err) {
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: `Blueprint analysis error: ${err.message}.`, error: true }]);
      toast.error(err?.message || 'Vision analysis failed.');
    } finally { setLoading(false); }
  };

  const isReady = !!conversation;
  const agentColor = agent.color || 'from-violet-500 to-violet-600';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-0 sm:p-4">
      <Card className="w-full max-w-2xl h-full sm:h-[80vh] flex flex-col shadow-2xl rounded-none sm:rounded-xl">
        <CardHeader className="border-b pb-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-gradient-to-br ${agentColor} text-white`}><Bot className="h-5 w-5" /></div>
              <div>
                <CardTitle className="text-base">{agent.name}</CardTitle>
                <CardDescription className="text-xs">{agent.description} · Voice-enabled</CardDescription>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}><X className="h-4 w-4" /></Button>
          </div>
        </CardHeader>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full text-center">
              <div>
                {isReady ? <Sparkles className="h-12 w-12 mx-auto mb-4 text-slate-300" /> : <Loader2 className="h-12 w-12 mx-auto mb-4 text-slate-300 animate-spin" />}
                <p className="text-slate-500 font-medium">{isReady ? `Tap the mic and speak to ${agent.name}` : `Starting ${agent.name}...`}</p>
                <p className="text-xs text-slate-400 mt-1">{isReady && !voiceSupported ? 'Voice not supported in this browser - type instead.' : 'e.g. hey agent, what is on this page?'}</p>
              </div>
            </div>
          )}
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && <div className={`p-2 rounded-lg bg-gradient-to-br ${agentColor} text-white flex-shrink-0 h-8 w-8 flex items-center justify-center`}><Bot className="h-4 w-4" /></div>}
              <div className={`max-w-md p-3 rounded-lg text-sm ${msg.role === 'user' ? 'bg-blue-100 text-blue-900' : msg.error ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-900'}`}>
                <ReactMarkdown className="prose prose-sm max-w-none">{msg.content}</ReactMarkdown>
              </div>
              {msg.role === 'user' && <div className="p-2 rounded-lg bg-blue-500 text-white flex-shrink-0 h-8 w-8 flex items-center justify-center"><User className="h-4 w-4" /></div>}
            </div>
          ))}
          {loading && (
            <div className="flex gap-3">
              <div className={`p-2 rounded-lg bg-gradient-to-br ${agentColor} text-white flex-shrink-0 h-8 w-8 flex items-center justify-center`}><Bot className="h-4 w-4" /></div>
              <div className="bg-slate-100 p-3 rounded-lg flex items-center gap-2 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" />Thinking...</div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {blueprintResult && (
          <div className="px-4 pb-2"><BlueprintEstimateResult result={blueprintResult} imageUrl={blueprintResult.imageUrl} onClose={() => setBlueprintResult(null)} /></div>
        )}

        <div className="border-t p-4 flex-shrink-0 space-y-3">
          {isReady && <BlueprintUploader onAnalysis={handleBlueprintAnalysis} disabled={loading} />}
          <div className="flex gap-2 items-center">
            <Button onClick={toggleListening} variant={listening ? 'default' : 'outline'} size="icon" disabled={!isReady || !voiceSupported} title={voiceSupported ? 'Speak' : 'Voice not supported'} className={listening ? 'bg-red-600 hover:bg-red-700 animate-pulse' : ''}>
              {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
            <Button onClick={() => setVoiceEnabled(v => !v)} variant="ghost" size="icon" title={voiceEnabled ? 'Mute replies' : 'Unmute replies'} disabled={!isReady}>
              {voiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </Button>
            <Input placeholder={listening ? 'Listening...' : 'Ask me anything...'} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && !loading && sendMessage()} disabled={loading || !isReady} className="flex-1" />
            <Button onClick={() => sendMessage()} disabled={loading || !input.trim() || !isReady} size="icon">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}