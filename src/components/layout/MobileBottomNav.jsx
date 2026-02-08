import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  const [lastTapTime, setLastTapTime] = useState({});

  const handleNavClick = (page) => {
    const now = Date.now();
    const lastTap = lastTapTime[page] || 0;
    const isDoubleTap = now - lastTap < 300;

    setLastTapTime({ ...lastTapTime, [page]: now });

    if (currentPageName === page && isDoubleTap) {
      // Double tap - reset to root
      navigate(createPageUrl(page));
      window.scrollTo(0, 0);
    } else if (currentPageName !== page) {
      // Different page - navigate
      navigate(createPageUrl(page));
    }
  };

  return (
    <nav className="flex lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 z-40" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="flex items-center justify-around w-full">
        {navItems.map((item) => {
          const isActive = currentPageName === item.page;
          const Icon = item.icon;
          return (
            <button
              key={item.page}
              onClick={() => handleNavClick(item.page)}
              className={cn(
                'flex flex-col items-center justify-center flex-1 min-h-[60px] gap-1 transition-colors select-none',
                isActive
                  ? 'text-slate-900 dark:text-white'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium">{item.name}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}