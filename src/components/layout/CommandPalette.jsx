import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import {
  LayoutDashboard,
  FileText,
  FolderKanban,
  Users,
  Bot,
  Search,
  Settings,
  Plus,
  Calendar,
  DollarSign,
  Clock,
  Bell,
  HelpCircle,
  LogOut,
  Moon,
  Sun,
  Keyboard,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { toast } from 'sonner';

// Navigation items for quick access
const navigationItems = [
  {
    id: 'dashboard',
    name: 'Dashboard',
    icon: LayoutDashboard,
    page: 'Dashboard',
    shortcut: 'D',
    keywords: 'home overview stats',
  },
  {
    id: 'bids',
    name: 'Bids',
    icon: FileText,
    page: 'Bids',
    shortcut: 'B',
    keywords: 'opportunities proposals estimates',
  },
  {
    id: 'projects',
    name: 'Projects',
    icon: FolderKanban,
    page: 'Projects',
    shortcut: 'P',
    keywords: 'jobs sites work',
  },
  {
    id: 'tasks',
    name: 'Tasks',
    icon: FileText,
    page: 'TaskTracker',
    shortcut: 'T',
    keywords: 'todos checklist',
  },
  {
    id: 'team',
    name: 'Team Management',
    icon: Users,
    page: 'TeamManagement',
    shortcut: 'M',
    keywords: 'employees labor staff',
  },
  {
    id: 'ai-agents',
    name: 'AI Agents',
    icon: Bot,
    page: 'AIAgents',
    shortcut: 'A',
    keywords: 'artificial intelligence automation',
  },
  {
    id: 'bid-discovery',
    name: 'Bid Discovery',
    icon: Search,
    page: 'BidDiscovery',
    shortcut: 'F',
    keywords: 'find search opportunities sam.gov',
  },
  {
    id: 'calendar',
    name: 'Calendar',
    icon: Calendar,
    page: 'Calendar',
    shortcut: 'C',
    keywords: 'schedule events meetings',
  },
  {
    id: 'timecards',
    name: 'Time Cards',
    icon: Clock,
    page: 'TimeCards',
    shortcut: 'I',
    keywords: 'timesheet hours clock in out',
  },
  {
    id: 'estimates',
    name: 'Estimates',
    icon: DollarSign,
    page: 'Estimates',
    shortcut: 'E',
    keywords: 'budget pricing cost',
  },
  {
    id: 'settings',
    name: 'Settings',
    icon: Settings,
    page: 'Settings',
    shortcut: ',',
    keywords: 'preferences configuration',
  },
];

// Quick actions
const quickActions = [
  {
    id: 'new-bid',
    name: 'Create New Bid',
    icon: Plus,
    action: () => toast.info('Create bid dialog coming soon!'),
    keywords: 'add bid opportunity',
  },
  {
    id: 'new-project',
    name: 'Create New Project',
    icon: Plus,
    action: () => toast.info('Create project dialog coming soon!'),
    keywords: 'add project job',
  },
  {
    id: 'new-task',
    name: 'Add New Task',
    icon: Plus,
    action: () => toast.info('Add task dialog coming soon!'),
    keywords: 'add task todo',
  },
  {
    id: 'ask-ai',
    name: 'Ask AI Assistant',
    icon: Sparkles,
    action: () => toast.info('AI chat coming soon!'),
    keywords: 'help question ai chat',
  },
];

// Recent items (would be persisted in localStorage)
let recentItems = [];

try {
  recentItems = JSON.parse(localStorage.getItem('commandPaletteRecent') || '[]');
} catch {
  recentItems = [];
}

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [recent, setRecent] = useState(recentItems);
  const navigate = useNavigate();
  const inputRef = useRef(null);

  // Toggle command palette with keyboard shortcut
  useEffect(() => {
    const down = (e) => {
      // Cmd/Ctrl + K to open
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((open) => !open);
      }
      // Escape to close
      if (e.key === 'Escape' && open) {
        setOpen(false);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [open]);

  // Focus input when opened
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  // Save recent items to localStorage
  const saveRecent = useCallback((item) => {
    const newRecent = [item, ...recent.filter((r) => r.id !== item.id)].slice(0, 5);
    setRecent(newRecent);
    try {
      localStorage.setItem('commandPaletteRecent', JSON.stringify(newRecent));
    } catch {
      // Ignore localStorage errors
    }
  }, [recent]);

  // Handle navigation
  const handleNavigate = useCallback((page) => {
    navigate(createPageUrl(page));
    setOpen(false);
    setSearch('');
  }, [navigate]);

  // Handle action
  const handleAction = useCallback((action, item) => {
    if (action) {
      action();
    }
    saveRecent(item);
    setOpen(false);
    setSearch('');
  }, [saveRecent]);

  // Filter items based on search
  const filterItems = (items) => {
    if (!search) return items;
    const query = search.toLowerCase();
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        item.keywords?.toLowerCase().includes(query)
    );
  };

  const filteredNavigation = filterItems(navigationItems);
  const filteredActions = filterItems(quickActions);

  return (
    <>
      {/* Keyboard shortcut hint */}
      <button
        onClick={() => setOpen(true)}
        className="hidden md:flex items-center gap-2 px-3 py-1.5 text-sm text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
      >
        <Search className="h-4 w-4" />
        <span>Search...</span>
        <kbd className="px-1.5 py-0.5 text-xs font-mono bg-white rounded border">
          ⌘K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          ref={inputRef}
          placeholder="Type a command or search..."
          value={search}
          onValueChange={setSearch}
        />
        <CommandList>
          <CommandEmpty>
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Search className="h-10 w-10 text-slate-300 mb-3" />
              <p className="text-sm text-slate-500">No results found.</p>
              <p className="text-xs text-slate-400 mt-1">
                Try searching for pages, actions, or features.
              </p>
            </div>
          </CommandEmpty>

          {/* Recent Items */}
          {!search && recent.length > 0 && (
            <CommandGroup heading="Recent">
              {recent.map((item) => {
                const Icon = item.icon;
                return (
                  <CommandItem
                    key={item.id}
                    onSelect={() =>
                      item.page
                        ? handleNavigate(item.page)
                        : handleAction(item.action, item)
                    }
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    <span>{item.name}</span>
                    <ArrowRight className="ml-auto h-3 w-3 text-slate-400" />
                  </CommandItem>
                );
              })}
            </CommandGroup>
          )}

          {/* Quick Actions */}
          {filteredActions.length > 0 && (
            <CommandGroup heading="Quick Actions">
              {filteredActions.map((item) => {
                const Icon = item.icon;
                return (
                  <CommandItem
                    key={item.id}
                    onSelect={() => handleAction(item.action, item)}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    <span>{item.name}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          )}

          <CommandSeparator />

          {/* Navigation */}
          {filteredNavigation.length > 0 && (
            <CommandGroup heading="Navigation">
              {filteredNavigation.map((item) => {
                const Icon = item.icon;
                return (
                  <CommandItem
                    key={item.id}
                    onSelect={() => {
                      handleNavigate(item.page);
                      saveRecent(item);
                    }}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    <span>{item.name}</span>
                    {item.shortcut && (
                      <CommandShortcut>⌘{item.shortcut}</CommandShortcut>
                    )}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          )}

          <CommandSeparator />

          {/* System */}
          <CommandGroup heading="System">
            <CommandItem
              onSelect={() => {
                toast.info('Help center coming soon!');
                setOpen(false);
              }}
            >
              <HelpCircle className="mr-2 h-4 w-4" />
              <span>Help & Support</span>
            </CommandItem>
            <CommandItem
              onSelect={() => {
                toast.info('Keyboard shortcuts coming soon!');
                setOpen(false);
              }}
            >
              <Keyboard className="mr-2 h-4 w-4" />
              <span>Keyboard Shortcuts</span>
              <CommandShortcut>?</CommandShortcut>
            </CommandItem>
          </CommandGroup>
        </CommandList>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t bg-slate-50 text-xs text-slate-500">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 font-mono bg-white rounded border">↑↓</kbd>
              <span>Navigate</span>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 font-mono bg-white rounded border">↵</kbd>
              <span>Select</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 font-mono bg-white rounded border">ESC</kbd>
            <span>Close</span>
          </div>
        </div>
      </CommandDialog>
    </>
  );
}

// Hook to use command palette from anywhere
export function useCommandPalette() {
  const [open, setOpen] = useState(false);

  const toggle = useCallback(() => setOpen((o) => !o), []);
  const openPalette = useCallback(() => setOpen(true), []);
  const closePalette = useCallback(() => setOpen(false), []);

  return {
    open,
    toggle,
    openPalette,
    closePalette,
  };
}
