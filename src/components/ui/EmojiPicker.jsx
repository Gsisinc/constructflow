import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

const EMOJI_CATEGORIES = {
  'Construction': ['🏗️', '🏢', '🏛️', '🏭', '🏚️', '🏗', '⚒️', '🔨', '🪛', '🔧', '🪚', '⚙️', '🧱', '🪜', '🚧', '⛏️'],
  'Progress': ['📋', '✅', '🎯', '📊', '📈', '✔️', '☑️', '✓', '🔄', '⏳', '⏰', '🔔', '📅', '📆', '📌', '📍'],
  'Safety': ['🦺', '⚠️', '🚨', '🛡️', '🔒', '🔐', '🚦', '🚥', '⛑️', '🪖'],
  'Foundation': ['🧱', '🪨', '⛰️', '🏔️', '🗻'],
  'Structure': ['🏢', '🏛️', '🏗️', '🏘️', '🏚️', '🏠', '🏡', '🏰'],
  'Utilities': ['⚡', '💡', '🔌', '🪔', '💧', '🚿', '🚰', '🔥', '❄️', '🌡️'],
  'Finishing': ['🎨', '🖌️', '🖍️', '✏️', '🪟', '🚪', '🛋️'],
  'General': ['📦', '📁', '📂', '📄', '📃', '📑', '🔖', '🏷️', '💼', '🗂️', '📇', '📋']
};

export default function EmojiPicker({ value, onChange }) {
  const [selectedCategory, setSelectedCategory] = useState('Construction');

  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl">{value || '📌'}</span>
        <span className="text-sm text-slate-500">Selected</span>
      </div>
      
      <div className="flex gap-2 mb-3 flex-wrap">
        {Object.keys(EMOJI_CATEGORIES).map(category => (
          <Button
            key={category}
            size="sm"
            variant={selectedCategory === category ? 'default' : 'outline'}
            onClick={() => setSelectedCategory(category)}
            className="text-xs"
          >
            {category}
          </Button>
        ))}
      </div>

      <ScrollArea className="h-40 border rounded-md p-2">
        <div className="grid grid-cols-8 gap-2">
          {EMOJI_CATEGORIES[selectedCategory].map((emoji, index) => (
            <button
              key={index}
              onClick={() => onChange(emoji)}
              className={cn(
                "text-2xl hover:bg-slate-100 rounded p-1 transition-colors",
                value === emoji && "bg-blue-100 ring-2 ring-blue-500"
              )}
            >
              {emoji}
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}