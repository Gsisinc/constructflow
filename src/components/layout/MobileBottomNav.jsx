import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  FolderKanban,
  FileText,
  FileStack,
  Settings
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', icon: LayoutDashboard, page: 'Dashboard' },
  { name: 'Projects', icon: FolderKanban, page: 'Projects' },
  { name: 'Bids', icon: FileText, page: 'Bids' },
  { name: 'Tasks', icon: FileStack, page: 'TaskTracker' },
  { name: 'Settings', icon: Settings, page: 'Settings' }
];

export default function MobileBottomNav({ currentPageName }) {
  return (
    <nav className="hidden lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 z-40 safe-area-inset-bottom">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = currentPageName === item.page;
          const Icon = item.icon;
          return (
            <Link
              key={item.page}
              to={createPageUrl(item.page)}
              className={cn(
                'flex flex-col items-center justify-center w-full h-full gap-1 transition-colors select-none',
                isActive
                  ? 'text-slate-900 dark:text-white'
                  : 'text-slate-500 dark:text-slate-400'
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}