import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Hash, Plus, Send, MessageSquare, ArrowLeft, UserCircle2, Loader2, PenSquare } from 'lucide-react';

/**
 * Chats — project chat rooms (hosted in SupportChannels.jsx; URL /SupportChannels).
 * Storage: ExamResult entity, chat records only (chat_kind = 'room' | 'message').
 * Only CREATES records; never updates/deletes. Sender identity = session display name.
 */
const ENTITY = () => base44.entities.ExamResult;
const NAME_KEY = 'gsis_chat_display_name';
const POLL_MS = 3000; // 3s while visible (rate-limit relief, Developer 2026-10-15); was 1s per Kemar
const ROOMS_POLL_MS = 5000;
const ENTERED_BY = 'Entered by: Ops Manager';
// Premium gold CTA (mockups/Chief/Premium chats.html .btn-gold) — theme vars only, no hex.
const GOLD = 'var(--brand-gold, hsl(var(--ring)))';
const GOLD2 = 'var(--brand-gold-2, var(--brand-gold, hsl(var(--ring))))';
const GOLD_BTN_STYLE = {
  background: `linear-gradient(180deg, ${GOLD2}, ${GOLD})`,
  boxShadow: `0 0 0 1px color-mix(in srgb, ${GOLD2} 45%, transparent) inset, 0 8px 24px -8px color-mix(in srgb, ${GOLD} 65%, transparent)`,
};

function initials(name) {
  return (name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('');
}
function parseUtc(iso) {
  // Base44 created_date is UTC; add Z when no zone is given so it isn't read as local time.
  const s = String(iso);
  return new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(s) ? s : s + 'Z');
}
function laKey(d) {
  return d.toLocaleDateString('en-US', { timeZone: 'America/Los_Angeles' });
}
function fmtTime(iso) {
  if (!iso) return '';
  const d = parseUtc(iso);
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', timeZone: 'America/Los_Angeles' });
}
function fmtDay(iso) {
  const d = parseUtc(iso);
  const today = new Date();
  const y = new Date(today.getTime() - 86400000);
  if (laKey(d) === laKey(today)) return 'Today';
  if (laKey(d) === laKey(y)) return 'Yesterday';
  return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'America/Los_Angeles' });
}

export default function SupportChannels() {
  const qc = useQueryClient();
  const [activeRoomId, setActiveRoomId] = useState(null);
  const [showRoomsMobile, setShowRoomsMobile] = useState(true);
  const [newRoom, setNewRoom] = useState('');
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState('');
  const [displayName, setDisplayName] = useState(() => {
    try { return sessionStorage.getItem(NAME_KEY) || ''; } catch { return ''; }
  });
  const [askName, setAskName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [error, setError] = useState('');
  const scrollRef = useRef(null);
  const composerRef = useRef(null);
  const focusComposerPending = useRef(false);
  const [focusReq, setFocusReq] = useState(0);

  const { data: user } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me() });
  const orgId = user?.organization_id;

  const { data: rooms = [], isLoading: roomsLoading } = useQuery({
    queryKey: ['chat-rooms', orgId],
    enabled: !!orgId,
    queryFn: () => ENTITY().filter({ organization_id: orgId, chat_kind: 'room' }, 'created_date'),
    refetchInterval: ROOMS_POLL_MS,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  const activeRoom = useMemo(() => rooms.find((r) => r.id === activeRoomId) || null, [rooms, activeRoomId]);

  useEffect(() => {
    if (!activeRoomId && rooms.length && typeof window !== 'undefined' && window.innerWidth >= 768) {
      setActiveRoomId(rooms[0].id);
    }
  }, [rooms, activeRoomId]);

  const { data: messages = [], isLoading: msgsLoading, refetch: refetchMessages } = useQuery({
    queryKey: ['chat-messages', orgId, activeRoomId],
    enabled: !!orgId && !!activeRoomId,
    // Newest 500 first from the server, then oldest-to-newest for display.
    queryFn: async () => {
      const rows = await ENTITY().filter(
        { organization_id: orgId, chat_kind: 'message', chat_room_id: activeRoomId }, '-created_date', 500
      );
      return (rows || []).slice().reverse();
    },
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  // Belt-and-braces poll: the app's global query defaults turn off focus refetch,
  // so run our own timer and refetch right away when the tab or window regains focus.
  const { refetch: refetchRooms } = { refetch: () => qc.invalidateQueries({ queryKey: ['chat-rooms'] }) };
  useEffect(() => {
    if (!orgId || !activeRoomId) return undefined;
    const tick = () => {
      // Skip while hidden, and never start a new request while one is still in flight.
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
      if (qc.isFetching({ queryKey: ['chat-messages', orgId, activeRoomId] }) > 0) return;
      refetchMessages({ cancelRefetch: false });
    };
    const id = setInterval(tick, POLL_MS);
    const onFocus = () => { refetchMessages({ cancelRefetch: false }); refetchRooms(); };
    const onVis = () => { if (document.visibilityState === 'visible') onFocus(); };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      clearInterval(id);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [orgId, activeRoomId, refetchMessages]);

  // Defensive client-side filter: only our own chat records.
  const safeMessages = useMemo(
    () => messages.filter((m) => m.chat_kind === 'message' && m.chat_room_id === activeRoomId),
    [messages, activeRoomId]
  );

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [safeMessages.length, safeMessages[safeMessages.length - 1]?.id, activeRoomId]);

  const createRoom = useMutation({
    mutationFn: (name) => ENTITY().create({
      organization_id: orgId,
      technician_email: user?.email || 'chat@gsis.local', // required by schema
      exam_type: 'written',                                 // required by schema (placeholder)
      status: 'pending',
      chat_kind: 'room',
      chat_room_name: name,
      chat_sender: displayName || '',
      notes: ENTERED_BY,
    }),
    onSuccess: (room) => {
      setNewRoom(''); setCreating(false); setError('');
      qc.invalidateQueries({ queryKey: ['chat-rooms', orgId] });
      if (room?.id) { setActiveRoomId(room.id); setShowRoomsMobile(false); }
    },
    onError: (e) => setError(e?.message || 'Could not create room'),
  });

  const sendMsg = useMutation({
    mutationFn: ({ body, sender }) => ENTITY().create({
      organization_id: orgId,
      technician_email: user?.email || 'chat@gsis.local',
      exam_type: 'written',
      status: 'pending',
      chat_kind: 'message',
      chat_room_id: activeRoomId,
      chat_room_name: activeRoom?.chat_room_name || '',
      chat_sender: sender,
      chat_body: body,
      notes: ENTERED_BY,
    }),
    onSuccess: () => {
      setDraft(''); setError('');
      qc.invalidateQueries({ queryKey: ['chat-messages', orgId, activeRoomId] });
    },
    onError: (e) => setError(e?.message || 'Message failed to send'),
  });

  const submitRoom = (e) => {
    e.preventDefault();
    const name = newRoom.trim();
    if (!name || !orgId) return;
    if (rooms.some((r) => (r.chat_room_name || '').toLowerCase() === name.toLowerCase())) {
      setError('A room with that name already exists'); return;
    }
    createRoom.mutate(name);
  };

  const submitMessage = (e) => {
    e.preventDefault();
    const body = draft.trim();
    if (!body || !activeRoomId) return;
    if (!displayName) { setAskName(true); return; }
    sendMsg.mutate({ body, sender: displayName });
  };

  const saveName = (e) => {
    e.preventDefault();
    const n = nameInput.trim().slice(0, 40);
    if (!n) return;
    try { sessionStorage.setItem(NAME_KEY, n); } catch { /* ignore */ }
    setDisplayName(n); setAskName(false);
    const body = draft.trim();
    if (body && activeRoomId) sendMsg.mutate({ body, sender: n });
  };

  const changeName = () => { setNameInput(displayName); setAskName(true); };

  // "New message" (UI only): focus the selected room's composer; with no room selected, open the
  // first room; with no rooms at all, open the existing create-room form. No new requests.
  const startNewMessage = () => {
    setError('');
    if (activeRoom) {
      setShowRoomsMobile(false);
    } else if (rooms.length) {
      setActiveRoomId(rooms[0].id);
      setShowRoomsMobile(false);
    } else {
      setShowRoomsMobile(true);
      setCreating(true);
      return;
    }
    focusComposerPending.current = true;
    setFocusReq((n) => n + 1);
  };

  useEffect(() => {
    if (!focusComposerPending.current || !activeRoom || showRoomsMobile) return;
    const el = composerRef.current;
    if (!el) return;
    focusComposerPending.current = false;
    el.focus({ preventScroll: true });
    if (typeof el.scrollIntoView === 'function') el.scrollIntoView({ block: 'nearest' });
  }, [focusReq, activeRoom, showRoomsMobile]);

  // Group messages by day
  let lastDay = '';

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            Team <span className="text-ring">Chats</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Project rooms for the whole crew. Updates every few seconds.</p>
        </div>
        <div className="flex w-full sm:w-auto items-center gap-2">
          <button
            type="button"
            onClick={changeName}
            className="inline-flex min-w-0 items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-sm text-card-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <UserCircle2 className="h-4 w-4 shrink-0 text-ring" />
            <span className="truncate">{displayName ? <>Chatting as <b className="font-semibold">{displayName}</b></> : 'Set your name'}</span>
          </button>
          <button
            type="button"
            onClick={startNewMessage}
            disabled={roomsLoading || !orgId}
            style={GOLD_BTN_STYLE}
            className="ml-auto sm:ml-0 inline-flex h-9 shrink-0 items-center gap-2 rounded-[10px] px-3.5 text-[13px] font-semibold whitespace-nowrap text-primary dark:text-primary-foreground transition-all duration-200 hover:-translate-y-px hover:brightness-105 active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-60"
          >
            <PenSquare className="h-4 w-4" />
            New message
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>
      )}

      <div className="grid overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-sm md:grid-cols-[260px_minmax(0,1fr)] h-[calc(100vh-220px)] min-h-[480px]">
        {/* Room list */}
        <aside className={`${showRoomsMobile ? 'flex' : 'hidden'} md:flex flex-col min-h-0 border-r border-border bg-muted/40`}>
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Project rooms</span>
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setCreating((v) => !v)} title="New room">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {creating && (
            <form onSubmit={submitRoom} className="px-3 pb-3 flex gap-2">
              <Input autoFocus value={newRoom} onChange={(e) => setNewRoom(e.target.value)} placeholder="e.g. Fire Sprinkler Tracy" className="h-9 text-sm" maxLength={60} />
              <Button type="submit" size="sm" disabled={!newRoom.trim() || createRoom.isPending}>
                {createRoom.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add'}
              </Button>
            </form>
          )}
          <div className="flex-1 overflow-y-auto px-2 pb-3 space-y-0.5">
            {roomsLoading || !orgId ? (
              <div className="flex items-center gap-2 px-3 py-4 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading rooms…</div>
            ) : rooms.length === 0 ? (
              <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                No rooms yet.
                <Button size="sm" className="mt-3 w-full" onClick={() => setCreating(true)}><Plus className="h-4 w-4 mr-1" />Create first room</Button>
              </div>
            ) : rooms.map((r) => {
              const on = r.id === activeRoomId;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => { setActiveRoomId(r.id); setShowRoomsMobile(false); }}
                  className={`w-full flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${on ? 'bg-ring/15 text-foreground font-semibold ring-1 ring-inset ring-ring/30' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'}`}
                >
                  <Hash className={`h-4 w-4 shrink-0 ${on ? 'text-ring' : ''}`} />
                  <span className="truncate">{r.chat_room_name || 'Untitled room'}</span>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Message pane */}
        <section className={`${showRoomsMobile ? 'hidden' : 'flex'} md:flex flex-col min-h-0 min-w-0`}>
          {!activeRoom ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center text-muted-foreground">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary text-primary-foreground"><MessageSquare className="h-7 w-7" /></div>
              <p className="font-medium text-foreground">Pick a project room</p>
              <p className="text-sm max-w-xs">Choose a room on the left or create one named for the project.</p>
              <Button variant="outline" size="sm" className="md:hidden" onClick={() => setShowRoomsMobile(true)}>Show rooms</Button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 border-b border-border px-4 py-3">
                <Button variant="ghost" size="icon" className="md:hidden h-8 w-8" onClick={() => setShowRoomsMobile(true)}><ArrowLeft className="h-4 w-4" /></Button>
                <Hash className="h-5 w-5 text-ring" />
                <b className="truncate text-[15px]">{activeRoom.chat_room_name}</b>
                <span className="ml-auto inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="h-2 w-2 rounded-full bg-ring animate-pulse" />Live
                </span>
              </div>

              <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                {msgsLoading ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading messages…</div>
                ) : safeMessages.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center text-center text-sm text-muted-foreground">
                    <p className="font-medium text-foreground">No messages yet</p>
                    <p>Start the conversation in #{activeRoom.chat_room_name}.</p>
                  </div>
                ) : safeMessages.map((m) => {
                  const me = displayName && m.chat_sender === displayName;
                  const day = m.created_date ? fmtDay(m.created_date) : '';
                  const showDay = day && day !== lastDay;
                  lastDay = day || lastDay;
                  return (
                    <React.Fragment key={m.id}>
                      {showDay && (
                        <div className="flex items-center gap-3 text-[11px] font-semibold tracking-wider text-muted-foreground">
                          <span className="h-px flex-1 bg-border" />{day}<span className="h-px flex-1 bg-border" />
                        </div>
                      )}
                      <div className={`flex gap-2.5 max-w-[760px] ${me ? 'ml-auto flex-row-reverse' : ''}`}>
                        <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold ${me ? 'bg-ring text-primary dark:text-primary-foreground' : 'bg-primary text-primary-foreground'}`}>
                          {initials(m.chat_sender)}
                        </div>
                        <div className="min-w-0">
                          <div className={`flex items-baseline gap-2 text-[13px] ${me ? 'justify-end' : ''}`}>
                            <b className="font-semibold text-foreground">{m.chat_sender || 'Unknown'}</b>
                            <time className="text-[11px] text-muted-foreground">{fmtTime(m.created_date)}</time>
                          </div>
                          <div className={`mt-1 whitespace-pre-wrap break-words px-3.5 py-2.5 text-sm leading-relaxed border ${me ? 'rounded-[14px_4px_14px_14px] bg-ring/15 border-ring/30 text-foreground' : 'rounded-[4px_14px_14px_14px] bg-muted border-border text-foreground'}`}>
                            {m.chat_body}
                          </div>
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>

              <form onSubmit={submitMessage} className="m-3 sm:m-4 flex items-center gap-2 rounded-2xl border border-border bg-background pl-3 pr-1.5 py-1.5 focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20 transition">
                <input
                  ref={composerRef}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder={`Message #${activeRoom.chat_room_name}`}
                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                  maxLength={4000}
                />
                <Button type="submit" size="sm" disabled={!draft.trim() || sendMsg.isPending} className="rounded-xl">
                  {sendMsg.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  <span className="hidden sm:inline ml-1">Send</span>
                </Button>
              </form>
            </>
          )}
        </section>
      </div>

      {/* Display-name prompt */}
      {askName && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-background/80 backdrop-blur-sm p-4">
          <form onSubmit={saveName} className="w-full max-w-sm rounded-xl border border-border bg-card p-5 text-card-foreground shadow-lg space-y-3">
            <h2 className="text-lg font-semibold">Who's chatting?</h2>
            <p className="text-sm text-muted-foreground">Everyone shares one login, so type the name to show on your messages (e.g. Kemar, Chief, Ops Manager). It stays for this browser session.</p>
            <Input autoFocus value={nameInput} onChange={(e) => setNameInput(e.target.value)} placeholder="Your display name" maxLength={40} />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setAskName(false)}>Cancel</Button>
              <Button type="submit" disabled={!nameInput.trim()}>{draft.trim() ? 'Save & send' : 'Save'}</Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
