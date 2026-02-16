import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { Kbd } from '@/components/ui/kbd';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';

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
  Zap,
  TrendingUp,
  ClipboardList,
  Briefcase,
  Building2,
  Truck,
  Shield,
  BarChart3,
  MessageSquare,
  Mail,
  Phone,
  MapPin,
  Star,
  History,
  Clock3,
} from 'lucide-react';

// Navigation items
const navigationItems = [
  {
    id: 'dashboard',
    name: 'Dashboard',
    icon: LayoutDashboard,
    page: 'Dashboard',
    shortcut: 'D',
    keywords: 'home overview stats analytics',
    category: 'main',
  },
  {
    id: 'bids',
    name: 'Bids',
    icon: FileText,
    page: 'Bids',
    shortcut: 'B',
    keywords: 'opportunities proposals estimates rfq',
    category: 'main',
  },
  {
    id: 'projects',
    name: 'Projects',
    icon: FolderKanban,
    page: 'Projects',
    shortcut: 'P',
    keywords: 'jobs sites work construction',
    category: 'main',
  },
  {
    id: 'tasks',
    name: 'Tasks',
    icon: ClipboardList,
    page: 'TaskTracker',
    shortcut: 'T',
    keywords: 'todos checklist assignments',
    category: 'main',
  },
  {
    id: 'team',
    name: 'Team Management',
    icon: Users,
    page: 'TeamManagement',
    shortcut: 'M',
    keywords: 'employees labor staff crew workers',
    category: 'main',
  },
  {
    id: 'ai-agents',
    name: 'AI Agents',
    icon: Bot,
    page: 'AIAgents',
    shortcut: 'A',
    keywords: 'artificial intelligence automation assistant',
    badge: '10 Active',
    category: 'main',
  },
  {
    id: 'bid-discovery',
    name: 'Bid Discovery',
    icon: Search,
    page: 'BidDiscovery',
    shortcut: 'F',
    keywords: 'find search opportunities sam.gov government',
    category: 'main',
  },
  {
    id: 'calendar',
    name: 'Calendar',
    icon: Calendar,
    page: 'Calendar',
    shortcut: 'C',
    keywords: 'schedule events meetings timeline',
    category: 'tools',
  },
  {
    id: 'timecards',
    name: 'Time Cards',
    icon: Clock,
    page: 'TimeCards',
    shortcut: 'I',
    keywords: 'timesheet hours clock in out payroll',
    category: 'tools',
  },
  {
    id: 'estimates',
    name: 'Estimates',
    icon: DollarSign,
    page: 'Estimates',
    shortcut: 'E',
    keywords: 'budget pricing cost quote',
    category: 'tools',
  },
  {
    id: 'materials',
    name: 'Materials',
    icon: Truck,
    page: 'Materials',
    shortcut: '',
    keywords: 'inventory supplies procurement',
    category: 'tools',
  },
  {
    id: 'safety',
    name: 'Safety',
    icon: Shield,
    page: 'Safety',
    shortcut: '',
    keywords: 'compliance incidents osha',
    category: 'tools',
  },
  {
    id: 'reports',
    name: 'Reports',
    icon: BarChart3,
    page: 'Reports',
    shortcut: 'R',
    keywords: 'analytics data insights',
    category: 'tools',
  },
  {
    id: 'messages',
    name: 'Messages',
    icon: MessageSquare,
    page: 'Messages',
    shortcut: '',
    keywords: 'chat communication notifications',
    badge: '3 New',
    category: 'tools',
  },
  {
    id: 'settings',
    name: 'Settings',
    icon: Settings,
    page: 'Settings',
    shortcut: ',',
    keywords: 'preferences configuration profile',
    category: 'system',
  },
  {
    id: 'help',
    name: 'Help & Support',
    icon: HelpCircle,
    page: 'Help',
    shortcut: '?',
    keywords: 'documentation guide faq',
    category: 'system',
  },
];

// Quick actions
const quickActions = [
  {
    id: 'new-bid',
    name: 'Create New Bid',
    icon: Plus,
    action: () => toast.info('Create bid dialog coming soon!'),
    keywords: 'add bid opportunity create',
    color: 'bg-blue-500',
  },
  {
    id: 'new-project',
    name: 'Create New Project',
    icon: Briefcase,
    action: () => toast.info('Create project dialog coming soon!'),
    keywords: 'add project job create',
    color: 'bg-emerald-500',
  },
  {
    id: 'new-task',
    name: 'Add New Task',
    icon: ClipboardList,
    action: () => toast.info('Add task dialog coming soon!'),
    keywords: 'add task todo create',
    color: 'bg-amber-500',
  },
  {
    id: 'ask-ai',
    name: 'Ask AI Assistant',
    icon: Sparkles,
    action: () => toast.info('AI chat coming soon!'),
    keywords: 'help question ai chat assistant',
    color: 'bg-purple-500',
  },
];

// Keyboard shortcut hints
const keyboardShortcuts = [
  { key: '↑↓', description: 'Navigate' },
  { key: '↵', description: 'Select' },
  { key: 'ESC', description: 'Close' },
];

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [recent, setRecent] = useState([]);
  const navigate = useNavigate();
  const inputRef = useRef(null);

  // Load recent items from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('cf-command-palette-recent');
      if (saved) {
        setRecent(JSON.parse(saved));
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  // Save recent items
  const saveRecent = useCallback((item) => {
    setRecent((prev) => {
      const newRecent = [item, ...prev.filter((r) => r.id !== item.id)].slice(0, 5);
      try {
        localStorage.setItem('cf-command-palette-recent', JSON.stringify(newRecent));
      } catch {
        // Ignore localStorage errors
      }
      return newRecent;
    });
  }, []);

  // Toggle command palette with keyboard shortcut
  useEffect(() => {
    const down = (e) => {
      // Cmd/Ctrl + K to open
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((open) => !open);
      }
      // Cmd/Ctrl + / for help
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        setOpen(true);
        setSearch('?');
      }
      // ? to open help
      if (e.key === '?' && !e.metaKey && !e.ctrlKey && !open) {
        e.preventDefault();
        setOpen(true);
        setSearch('help');
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
  const filterItems = useCallback((items) => {
    if (!search) return items;
    const query = search.toLowerCase().trim();
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        item.keywords?.toLowerCase().includes(query) ||
        item.id.toLowerCase().includes(query)
    );
  }, [search]);

  const filteredNavigation = useMemo(() => filterItems(navigationItems), [filterItems]);
  const filteredActions = useMemo(() => filterItems(quickActions), [filterItems]);

  // Group navigation by category
  const groupedNavigation = useMemo(() => {
    const groups = {};
    filteredNavigation.forEach((item) => {
      const category = item.category || 'other';
      if (!groups[category]) groups[category] = [];
      groups[category].push(item);
    });
    return groups;
  }, [filteredNavigation]);

  const categoryLabels = {
    main: 'Main Navigation',
    tools: 'Tools & Features',
    system: 'System',
    other: 'Other',
  };

  return (
    <>
      {/* Keyboard shortcut hint button */}
      <button
        onClick={() => setOpen(true)}
        className="hidden md:flex items-center gap-2 px-3 py-1.5 text-sm text-slate-500 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
      >
        <Search className="h-4 w-4" />
        <span>Search...</span>
        <Kbd className="hidden lg:inline-flex">⌘K</Kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <Command className="rounded-lg border shadow-xl">
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <CommandInput
              ref={inputRef}
              placeholder="Type a command or search..."
              value={search}
              onValueChange={setSearch}
              className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-slate-500 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          
          <CommandList className="max-h-[60vh] overflow-y-auto overflow-x-hidden">
            <CommandEmpty>
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                  <Search className="h-8 w-8 text-slate-400" />
                </div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  No results found
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Try searching for pages, actions, or features
                </p>
              </div>
            </CommandEmpty>

            {/* Recent Items */}
            {!search && recent.length > 0 && (
              <CommandGroup heading="Recent">
                {recent.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <CommandItem
                      key={`recent-${item.id}-${index}`}
                      onSelect={() =>
                        item.page
                          ? handleNavigate(item.page)
                          : handleAction(item.action, item)
                      }
                      className="flex items-center gap-3 px-4 py-3 cursor-pointer"
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800">
                        <Icon className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                      </div>
                      <span className="flex-1">{item.name}</span>
                      <History className="h-3 w-3 text-slate-400" />
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
                      key={`action-${item.id}`}
                      onSelect={() => handleAction(item.action, item)}
                      className="flex items-center gap-3 px-4 py-3 cursor-pointer"
                    >
                      <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${item.color}`}>
                        <Icon className="h-4 w-4 text-white" />
                      </div>
                      <span className="flex-1">{item.name}</span>
                      <ArrowRight className="h-3 w-3 text-slate-400" />
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}

            <CommandSeparator />

            {/* Navigation by Category */}
            {Object.entries(groupedNavigation).map(([category, items]) => (
              items.length > 0 && (
                <CommandGroup key={category} heading={categoryLabels[category] || category}>
                  {items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <CommandItem
                        key={`nav-${item.id}`}
                        onSelect={() => {
                          handleNavigate(item.page);
                          saveRecent(item);
                        }}
                        className="flex items-center gap-3 px-4 py-3 cursor-pointer"
                      >
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800">
                          <Icon className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                        </div>
                        <span className="flex-1">{item.name}</span>
                        {item.badge && (
                          <Badge variant="secondary" className="text-xs">
                            {item.badge}
                          </Badge>
                        )}
                        {item.shortcut && (
                          <CommandShortcut>⌘{item.shortcut}</CommandShortcut>
                        )}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              )
            ))}

            <CommandSeparator />

            {/* System Actions */}
            <CommandGroup heading="System">
              <CommandItem
                onSelect={() => {
                  toast.info('Keyboard shortcuts coming soon!');
                  setOpen(false);
                }}
                className="flex items-center gap-3 px-4 py-3 cursor-pointer"
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800">
                  <Keyboard className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                </div>
                <span className="flex-1">Keyboard Shortcuts</span>
                <CommandShortcut>?</CommandShortcut>
              </CommandItem>
              <CommandItem
                onSelect={() => {
                  document.documentElement.classList.toggle('dark');
                  toast.success('Theme toggled');
                  setOpen(false);
                }}
                className="flex items-center gap-3 px-4 py-3 cursor-pointer"
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800">
                  <Sun className="h-4 w-4 text-slate-600 dark:text-slate-400 hidden dark:block" />
                  <Moon className="h-4 w-4 text-slate-600 dark:text-slate-400 block dark:hidden" />
                </div>
                <span className="flex-1">Toggle Theme</span>
              </CommandItem>
            </CommandGroup>
          </CommandList>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-3 border-t bg-slate-50 dark:bg-slate-900/50 text-xs text-slate-500">
            <div className="flex items-center gap-4">
              {keyboardShortcuts.map((shortcut, index) => (
                <div key={index} className="flex items-center gap-1">
                  <Kbd>{shortcut.key}</Kbd>
                  <span>{shortcut.description}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-1">
              <Kbd>ESC</Kbd>
              <span>Close</span>
            </div>
          </div>
        </Command>
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
