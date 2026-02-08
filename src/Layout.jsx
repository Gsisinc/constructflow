import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { createPageUrl } from './utils';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import {
  LayoutDashboard,
  FolderKanban,
  FileText,
  Users,
  Package,
  AlertTriangle,
  DollarSign,
  FileStack,
  Menu,
  X,
  LogOut,
  ChevronDown,
  Building2,
  Calendar,
  Clock,
  Settings,
  User,
  Bot,
  Search,
  Grid3x3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import MegaMenu from '@/components/layout/MegaMenu';
const navItems = [
              { name: 'Dashboard', icon: LayoutDashboard, page: 'Dashboard' },
              { name: 'Projects', icon: FolderKanban, page: 'Projects' },
              { name: 'Task Tracker', icon: FileStack, page: 'TaskTracker' },
              { name: 'Templates', icon: FileText, page: 'TemplateLibrary' },
              { name: 'AI Agents', icon: Bot, page: 'AIAgents' },
              { name: 'Bid Discovery', icon: Search, page: 'BidDiscovery' },
              { name: 'Add Bid', icon: FileText, page: 'AddBid' },
              { name: 'Time Cards', icon: Clock, page: 'TimeCards' },
              { name: 'Directory', icon: Users, page: 'Directory' },
              { name: 'Estimates', icon: DollarSign, page: 'Estimates' },
              { name: 'PM Guide', icon: FileText, page: 'PMSetupGuide' },
              { name: 'Settings', icon: Settings, page: 'Settings' },
            ];

const adminNavItems = [
        { name: 'User Approvals', icon: User, page: 'UserApprovals' },
      ];

function UserMenu({ user, onLogout }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 transition-colors">
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-white text-sm font-medium">
            {user.full_name?.[0] || user.email?.[0]?.toUpperCase()}
          </div>
          <div className="text-left hidden lg:block">
            <p className="text-sm font-medium text-slate-900 truncate">
              {user.full_name || 'User'}
            </p>
            <p className="text-xs text-slate-500 truncate">{user.email}</p>
          </div>
          <ChevronDown className="h-4 w-4 text-slate-400 hidden lg:block" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem asChild>
          <Link to={createPageUrl('Settings')} className="flex items-center">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onLogout} className="text-red-600">
          <LogOut className="h-4 w-4 mr-2" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function Layout({ children, currentPageName }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [organization, setOrganization] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Don't show layout on Home page
  const isHomePage = currentPageName === 'Home';

  useEffect(() => {
    const loadUser = async () => {
      try {
        // Don't redirect if we're potentially handling an OAuth callback
        const urlParams = new URLSearchParams(window.location.search);
        const isCallback = urlParams.has('code') || urlParams.has('state') || window.location.hash.includes('access_token');
        
        const isAuth = await base44.auth.isAuthenticated();
        if (!isAuth && !isHomePage && !isCallback) {
          navigate(createPageUrl('Home'));
          return;
        }
        
        const userData = await base44.auth.me();
        setUser(userData);
        
        const orgs = await base44.entities.Organization.filter({ owner_email: userData.email });
        if (orgs.length > 0) {
          setOrganization(orgs[0]);
          
          document.documentElement.style.setProperty('--primary', hexToHSL(orgs[0].primary_color || '#1e40af'));
          document.documentElement.style.setProperty('--secondary', hexToHSL(orgs[0].secondary_color || '#3b82f6'));
        }
      } catch (e) {
        console.log('User not logged in');
      }
    };
    loadUser();
  }, []);

  const hexToHSL = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return '222.2 47.4% 11.2%';
    
    let r = parseInt(result[1], 16) / 255;
    let g = parseInt(result[2], 16) / 255;
    let b = parseInt(result[3], 16) / 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    
    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }
    
    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
  };

  const handleLogout = () => {
    base44.auth.logout(createPageUrl('Home'));
  };

  if (isHomePage) {
    return children;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <style>{`
        :root {
          --primary: 222.2 47.4% 11.2%;
          --primary-foreground: 210 40% 98%;
          --accent: 210 40% 96.1%;
        }
      `}</style>

      {/* Top Header */}
      <div className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 z-40 lg:pl-64">
        <div className="h-full flex items-center justify-between px-4">
          {/* Mobile menu button */}
          <div className="lg:hidden flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="h-9 w-9"
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <div className="flex items-center gap-1.5">
              {organization?.logo_url ? (
                <img src={organization.logo_url} alt={organization.name} className="h-8 w-auto" />
              ) : (
                <>
                  <img 
                    src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6983e2500291b5dfd8507ab1/c68ded0e2_Screenshot2026-01-20202907.png" 
                    alt="GSIS Manager" 
                    className="h-8 w-auto"
                  />
                  <span className="font-semibold text-sm text-slate-900 hidden sm:inline">{organization?.name || 'GSIS Manager'}</span>
                </>
              )}
            </div>
          </div>

          {/* Quick Access Menu Button */}
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMegaMenuOpen(!megaMenuOpen)}
              className="flex items-center gap-1.5 text-slate-600 hover:text-amber-600 hover:bg-amber-50 h-9 px-2 sm:px-3"
            >
              <Grid3x3 className="h-4 w-4" />
              <span className="text-xs sm:text-sm font-medium hidden sm:inline">Quick Access</span>
              <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", megaMenuOpen && "rotate-180")} />
            </Button>
            {user && <UserMenu user={user} onLogout={handleLogout} />}
          </div>
        </div>
      </div>

      {/* Mega Menu */}
      <MegaMenu isOpen={megaMenuOpen} onClose={() => setMegaMenuOpen(false)} />

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full w-64 bg-white border-r border-slate-200 z-50 transition-transform duration-300 lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-100">
            {organization?.logo_url ? (
              <img src={organization.logo_url} alt={organization.name} className="h-14 w-auto" />
            ) : (
              <>
                <img 
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6983e2500291b5dfd8507ab1/c68ded0e2_Screenshot2026-01-20202907.png" 
                  alt="GSIS Manager" 
                  className="h-14 w-auto"
                />
                <span className="font-semibold text-lg text-slate-900 tracking-tight">{organization?.name || 'GSIS Manager'}</span>
              </>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = currentPageName === item.page;
              const Icon = item.icon;
              return (
                <Link
                  key={item.page}
                  to={createPageUrl(item.page)}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  )}
                >
                  <Icon className={cn("h-4.5 w-4.5", isActive ? "text-white" : "text-slate-400")} />
                  {item.name}
                </Link>
              );
            })}

            {user?.role === 'admin' && (
              <>
                <div className="h-px bg-slate-200 my-2" />
                <div className="text-xs font-semibold text-slate-400 px-3 py-2">ADMIN</div>
                {adminNavItems.map((item) => {
                  const isActive = currentPageName === item.page;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.page}
                      to={createPageUrl(item.page)}
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                        isActive
                          ? "bg-slate-900 text-white shadow-sm"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      )}
                    >
                      <Icon className={cn("h-4.5 w-4.5", isActive ? "text-white" : "text-slate-400")} />
                      {item.name}
                    </Link>
                  );
                })}
              </>
            )}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-slate-100">
            <div className="text-xs text-slate-500 text-center">
              {organization?.name || 'GSIS Manager'}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:pl-64 pt-16 min-h-screen">
        <div className="p-3 sm:p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}