import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Search } from 'lucide-react';

const EMOJI_DATA = [
  { emoji: '🏗️', keywords: ['construction', 'building', 'crane', 'site'] },
  { emoji: '🏢', keywords: ['building', 'office', 'structure', 'commercial'] },
  { emoji: '🏛️', keywords: ['building', 'structure', 'classical', 'monument'] },
  { emoji: '🏭', keywords: ['factory', 'industrial', 'plant', 'manufacturing'] },
  { emoji: '🏚️', keywords: ['abandoned', 'old', 'house', 'derelict'] },
  { emoji: '⚒️', keywords: ['tools', 'hammer', 'pick', 'construction'] },
  { emoji: '🔨', keywords: ['hammer', 'tool', 'construction', 'build'] },
  { emoji: '🪛', keywords: ['screwdriver', 'tool', 'repair', 'fix'] },
  { emoji: '🔧', keywords: ['wrench', 'tool', 'repair', 'maintenance'] },
  { emoji: '🪚', keywords: ['saw', 'tool', 'cut', 'wood'] },
  { emoji: '⚙️', keywords: ['gear', 'settings', 'mechanical', 'engineering'] },
  { emoji: '🧱', keywords: ['brick', 'wall', 'construction', 'foundation', 'masonry'] },
  { emoji: '🪜', keywords: ['ladder', 'climb', 'access', 'construction'] },
  { emoji: '🚧', keywords: ['construction', 'warning', 'barrier', 'work'] },
  { emoji: '⛏️', keywords: ['pick', 'mining', 'excavation', 'dig'] },
  { emoji: '📋', keywords: ['clipboard', 'checklist', 'plan', 'document', 'preconstruction'] },
  { emoji: '✅', keywords: ['check', 'done', 'complete', 'finished', 'approved'] },
  { emoji: '🎯', keywords: ['target', 'goal', 'aim', 'objective'] },
  { emoji: '📊', keywords: ['chart', 'graph', 'analytics', 'data', 'progress'] },
  { emoji: '📈', keywords: ['trending', 'up', 'growth', 'increase', 'progress'] },
  { emoji: '✔️', keywords: ['check', 'done', 'complete', 'yes'] },
  { emoji: '🔄', keywords: ['refresh', 'reload', 'repeat', 'cycle'] },
  { emoji: '⏳', keywords: ['time', 'waiting', 'hourglass', 'pending'] },
  { emoji: '⏰', keywords: ['alarm', 'clock', 'time', 'schedule'] },
  { emoji: '🔔', keywords: ['bell', 'notification', 'alert', 'reminder'] },
  { emoji: '📅', keywords: ['calendar', 'date', 'schedule', 'plan'] },
  { emoji: '📆', keywords: ['calendar', 'date', 'schedule', 'plan'] },
  { emoji: '📌', keywords: ['pin', 'mark', 'important', 'note'] },
  { emoji: '📍', keywords: ['location', 'pin', 'place', 'marker'] },
  { emoji: '🦺', keywords: ['safety', 'vest', 'protection', 'worker'] },
  { emoji: '⚠️', keywords: ['warning', 'caution', 'alert', 'danger'] },
  { emoji: '🚨', keywords: ['emergency', 'alert', 'siren', 'warning'] },
  { emoji: '🛡️', keywords: ['shield', 'protection', 'safety', 'security'] },
  { emoji: '🔒', keywords: ['lock', 'secure', 'closed', 'locked'] },
  { emoji: '🔐', keywords: ['lock', 'key', 'secure', 'locked'] },
  { emoji: '🚦', keywords: ['traffic', 'light', 'signal', 'control'] },
  { emoji: '⛑️', keywords: ['helmet', 'safety', 'protection', 'rescue'] },
  { emoji: '🪖', keywords: ['helmet', 'safety', 'protection', 'military'] },
  { emoji: '🪨', keywords: ['rock', 'stone', 'foundation', 'solid'] },
  { emoji: '⛰️', keywords: ['mountain', 'peak', 'foundation', 'solid'] },
  { emoji: '🏔️', keywords: ['mountain', 'snow', 'peak', 'foundation'] },
  { emoji: '🏘️', keywords: ['houses', 'residential', 'neighborhood', 'community'] },
  { emoji: '🏠', keywords: ['house', 'home', 'residential', 'building'] },
  { emoji: '🏡', keywords: ['house', 'garden', 'home', 'residential'] },
  { emoji: '🏰', keywords: ['castle', 'structure', 'fortress', 'building'] },
  { emoji: '⚡', keywords: ['electric', 'power', 'energy', 'lightning', 'electrical', 'mep'] },
  { emoji: '💡', keywords: ['light', 'bulb', 'idea', 'electric', 'lighting'] },
  { emoji: '🔌', keywords: ['plug', 'electric', 'power', 'outlet', 'electrical'] },
  { emoji: '💧', keywords: ['water', 'drop', 'plumbing', 'liquid'] },
  { emoji: '🚿', keywords: ['shower', 'water', 'plumbing', 'bathroom'] },
  { emoji: '🚰', keywords: ['water', 'tap', 'fountain', 'plumbing'] },
  { emoji: '🔥', keywords: ['fire', 'heat', 'hvac', 'warm'] },
  { emoji: '❄️', keywords: ['cold', 'snow', 'freeze', 'hvac', 'cooling'] },
  { emoji: '🌡️', keywords: ['temperature', 'thermometer', 'hvac', 'climate'] },
  { emoji: '🎨', keywords: ['paint', 'art', 'color', 'finishing', 'interior'] },
  { emoji: '🖌️', keywords: ['brush', 'paint', 'art', 'finishing'] },
  { emoji: '🪟', keywords: ['window', 'glass', 'view', 'opening', 'enclosure'] },
  { emoji: '🚪', keywords: ['door', 'entrance', 'exit', 'opening'] },
  { emoji: '🛋️', keywords: ['couch', 'furniture', 'interior', 'finishing'] },
  { emoji: '📦', keywords: ['box', 'package', 'delivery', 'storage'] },
  { emoji: '📁', keywords: ['folder', 'file', 'document', 'organize'] },
  { emoji: '📂', keywords: ['folder', 'open', 'file', 'document'] },
  { emoji: '📄', keywords: ['document', 'paper', 'file', 'page'] },
  { emoji: '📃', keywords: ['document', 'paper', 'scroll', 'file'] },
  { emoji: '🔖', keywords: ['bookmark', 'tag', 'mark', 'label'] },
  { emoji: '🏷️', keywords: ['tag', 'label', 'price', 'mark'] },
  { emoji: '💼', keywords: ['briefcase', 'business', 'work', 'office'] },
  { emoji: '🗂️', keywords: ['organize', 'files', 'tabs', 'index'] },
  { emoji: '🔑', keywords: ['key', 'access', 'unlock', 'closeout', 'handover'] },
  { emoji: '✨', keywords: ['sparkle', 'new', 'clean', 'finishing', 'complete'] },
  { emoji: '🎉', keywords: ['celebration', 'party', 'complete', 'finished'] },
  { emoji: '🏁', keywords: ['finish', 'end', 'complete', 'closeout'] }
];

export default function EmojiPicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filteredEmojis = useMemo(() => {
    if (!search) return EMOJI_DATA;
    const searchLower = search.toLowerCase();
    return EMOJI_DATA.filter(item => 
      item.keywords.some(keyword => keyword.includes(searchLower))
    );
  }, [search]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-start text-left font-normal">
          <span className="text-2xl mr-2">{value || '📌'}</span>
          <span className="text-sm text-slate-500">Click to change icon</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="p-3 border-b">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search (e.g., 'hammer', 'electrical', 'finish')"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        <ScrollArea className="h-64">
          <div className="grid grid-cols-6 gap-1 p-3">
            {filteredEmojis.map((item, index) => (
              <button
                key={index}
                onClick={() => {
                  onChange(item.emoji);
                  setOpen(false);
                  setSearch('');
                }}
                className={cn(
                  "text-2xl hover:bg-slate-100 rounded p-2 transition-colors",
                  value === item.emoji && "bg-blue-100 ring-2 ring-blue-500"
                )}
                title={item.keywords.join(', ')}
              >
                {item.emoji}
              </button>
            ))}
          </div>
          {filteredEmojis.length === 0 && (
            <div className="text-center py-8 text-sm text-slate-500">
              No emojis found
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}