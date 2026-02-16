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
  { name: 'Home', icon: LayoutDashboard, page: 'Dashboard' },
  { name: 'Projects', icon: FolderKanban, page: 'Projects' },
  { name: 'Bids', icon: FileText, page: 'Bids' },
  { name: 'Tasks', icon: FileStack, page: 'TaskTracker' },
  { name: 'More', icon: Settings, page: 'Settings' }
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
      navigate(createPageUrl(page));
      window.scrollTo(0, 0);
    } else if (currentPageName !== page) {
      setSectionHistory({
        ...sectionHistory,
        [currentPageName]: location.pathname,
      });
      const savedPath = sectionHistory[page];
      navigate(savedPath || createPageUrl(page));
    }
  };

  return (
    <nav 
      className="flex sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-40 select-none" 
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-center justify-around w-full">
        {navItems.map((item) => {
          const isActive = currentPageName === item.page;
          const Icon = item.icon;
          return (
            <button
              key={item.page}
              onClick={() => handleNavClick(item.page)}
              className={cn(
                'flex flex-col items-center justify-center flex-1 min-h-16 gap-1 transition-all duration-200 active:bg-slate-100',
                isActive
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-slate-600 hover:text-blue-600'
              )}
              title={item.name}
            >
              <Icon className={cn(
                "h-5 w-5 transition-colors",
                isActive && "drop-shadow-sm"
              )} />
              <span className="text-xs font-semibold leading-tight">{item.name}</span>
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-blue-700 mx-auto w-8 rounded-t-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}