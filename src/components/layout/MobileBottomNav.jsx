import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  const location = useLocation();
  const [lastTapTime, setLastTapTime] = useState({});
  const [sectionHistory, setSectionHistory] = useState(() => {
    const stored = sessionStorage.getItem('sectionHistory');
    return stored ? JSON.parse(stored) : {};
  });

  useEffect(() => {
    sessionStorage.setItem('sectionHistory', JSON.stringify(sectionHistory));
  }, [sectionHistory]);

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
      // Save current location before switching
      setSectionHistory({
        ...sectionHistory,
        [currentPageName]: location.pathname,
      });
      // Navigate to saved location or root
      const savedPath = sectionHistory[page];
      navigate(savedPath || createPageUrl(page));
    }
  };

  return (
    <nav className="flex lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-950 border-t border-amber-100 dark:border-amber-900/30 z-40 select-none" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="flex items-center justify-around w-full">
        {navItems.map((item) => {
          const isActive = currentPageName === item.page;
          const Icon = item.icon;
          return (
            <button
              key={item.page}
              onClick={() => handleNavClick(item.page)}
              className={cn(
                'flex flex-col items-center justify-center flex-1 min-h-[56px] gap-0.5 transition-colors select-none',
                isActive
                  ? 'text-amber-600 dark:text-amber-500'
                  : 'text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-500'
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium leading-tight">{item.name}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}