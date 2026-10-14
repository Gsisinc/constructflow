import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * Voice hook for agents: mic transcription (Web Speech API) + spoken replies (SpeechSynthesis).
 * No backend, no credits. Gracefully degrades when unsupported.
 */
export function useVoiceChat({ onFinalTranscript, autoSpeakAssistant = true } = {}) {
  const [listening, setListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(autoSpeakAssistant);
  const [supported, setSupported] = useState(true);
  const recRef = useRef(null);
  const onFinalRef = useRef(onFinalTranscript);
  useEffect(() => { onFinalRef.current = onFinalTranscript; }, [onFinalTranscript]);

  useEffect(() => {
    const SR = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);
    if (!SR) { setSupported(false); return; }
    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = 'en-US';
    rec.onresult = (e) => {
      let txt = '';
      for (let i = 0; i < e.results.length; i++) txt += e.results[i][0].transcript;
      const last = e.results[e.results.length - 1];
      if (last && last.isFinal && onFinalRef.current) onFinalRef.current(txt.trim());
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recRef.current = rec;
    return () => { try { rec.abort(); } catch (_) {} };
  }, []);

  const startListening = useCallback(() => {
    if (!recRef.current) return;
    try { recRef.current.start(); setListening(true); } catch (_) { setListening(false); }
  }, []);
  const stopListening = useCallback(() => {
    if (!recRef.current) return;
    try { recRef.current.stop(); } catch (_) {}
    setListening(false);
  }, []);
  const toggleListening = useCallback(() => { listening ? stopListening() : startListening(); }, [listening, startListening, stopListening]);

  const speak = useCallback((text) => {
    if (!voiceEnabled || typeof window === 'undefined' || !('speechSynthesis' in window) || !text) return;
    try {
      window.speechSynthesis.cancel();
      const clean = String(text).replace(/[*_#`>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 1200);
      const u = new SpeechSynthesisUtterance(clean);
      u.lang = 'en-US';
      window.speechSynthesis.speak(u);
    } catch (_) {}
  }, [voiceEnabled]);

  const stopSpeaking = useCallback(() => { try { window.speechSynthesis?.cancel(); } catch (_) {} }, []);

  return { listening, startListening, stopListening, toggleListening, speak, stopSpeaking, voiceEnabled, setVoiceEnabled, supported };
}