import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { createPageUrl } from './utils';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/AuthContext';
import {
  LayoutDashboard,
  FolderKanban,
  FileText,
  Users,
  AlertTriangle,
  DollarSign,
  FileStack,
  Menu,
  X,
  LogOut,
  ChevronDown,
  Clock,
  Settings,
  User,
  Bot,
  Search,
  Grid3x3,
  ArrowLeft,
  Wrench,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import MegaMenu from '@/components/layout/MegaMenu';
import MobileBottomNav from '@/components/layout/MobileBottomNav';
const navItems = [
                    { name: 'Bids', icon: FileText, page: 'Bids' },
                    { name: 'Projects', icon: FolderKanban, page: 'Projects' },
                    { name: 'Dashboard', icon: LayoutDashboard, page: 'Dashboard' },
                    { name: 'Task Tracker', icon: FileStack, page: 'TaskTracker' },
                    { name: 'Labor Force', icon: Users, page: 'TeamManagement' },
                    { name: 'Templates', icon: FileText, page: 'TemplateLibrary' },
                    { name: 'AI Agents', icon: Bot, page: 'AIAgents' },
                    { name: 'Bid Discovery', icon: Search, page: 'BidDiscovery' },
                    { name: 'Add Bid', icon: FileText, page: 'AddBid' },
                    { name: 'Time Cards', icon: Clock, page: 'TimeCards' },
                    { name: 'Directory', icon: Users, page: 'Directory' },
                    { name: 'Estimates', icon: DollarSign, page: 'Estimates' },
                    { name: 'PM Guide', icon: FileText, page: 'PMSetupGuide' },
                    { name: 'Alerts', icon: AlertTriangle, page: 'AlertSettings' },
                    { name: 'Settings', icon: Settings, page: 'Settings' },
                    { name: 'Role Permissions', icon: Settings, page: 'RolePermissions' },
                    { name: 'Audit Trail', icon: FileStack, page: 'AuditTrail' },
                    { name: 'Service Desk', icon: Wrench, page: 'ServiceDesk' },
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
  const { logout } = useAuth();

  // Don't show layout on Home page
  const isHomePage = currentPageName === 'Home';
  const isOnboardingPage = currentPageName === 'Onboarding';

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
        
        // Check if user has an organization
        if (!userData?.organization_id && currentPageName !== 'Onboarding' && !isHomePage) {
          navigate(createPageUrl('Onboarding'));
          return;
        }

        // Redirect to Bids if on Home page and authenticated
        if (isHomePage) {
          navigate(createPageUrl('Bids'));
          return;
        }
        
        // Fetch user's organization
        if (userData?.organization_id) {
          const org = await base44.entities.Organization.filter({ id: userData.organization_id });
          if (org.length > 0) {
            setOrganization(org[0]);
            
            document.documentElement.style.setProperty('--primary', hexToHSL(org[0].primary_color || '#1e40af'));
            document.documentElement.style.setProperty('--secondary', hexToHSL(org[0].secondary_color || '#3b82f6'));
          }
        }
      } catch (e) {
        console.log('User not logged in');
      }
    };
    loadUser();
  }, [currentPageName]);

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
    logout(true);
  };

  const isRootPage = ['Bids', 'Dashboard', 'Projects', 'TaskTracker', 'Settings'].includes(currentPageName);

  const handleBack = () => {
    navigate(-1);
  };

  if (isHomePage || isOnboardingPage) {
    return children;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:bg-white focus:px-3 focus:py-2 focus:rounded-md focus:shadow">Skip to main content</a>
      <style>{`
              html {
                overscroll-behavior: none;
              }
              body {
                overscroll-behavior: none;
              }
              button, a, [role="button"], .select-none {
                -webkit-user-select: none;
                user-select: none;
              }
              input, textarea, select {
                font-size: 16px !important;
              }
              :root {
                --primary: 222.2 47.4% 11.2%;
                --primary-foreground: 210 40% 98%;
                --accent: 38 92% 50%;
                --accent-foreground: 48 96% 89%;
                --muted: 210 40% 96.1%;
                --muted-foreground: 215.4 16.3% 46.9%;
                --card: 0 0% 100%;
                --card-foreground: 222.2 47.4% 11.2%;
                --border: 214.3 31.8% 91.4%;
                --input: 214.3 31.8% 91.4%;
                --ring: 222.2 84% 4.9%;
                --radius: 0.5rem;
              }
              @supports (padding: max(0px)) {
                body {
                  padding-left: max(0px, env(safe-area-inset-left));
                  padding-right: max(0px, env(safe-area-inset-right));
                }
              }
            `}</style>

      {/* Top Header */}
              <div className="fixed top-0 left-0 right-0 h-16 bg-white/90 backdrop-blur-xl border-b border-slate-100 shadow-sm z-40 lg:pl-72" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
                <div className="h-full flex items-center justify-between px-4 sm:px-6">
                  {/* Mobile menu button & back button */}
                  <div className="lg:hidden flex items-center gap-1 sm:gap-2">
                {!isRootPage && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleBack}
                    className="min-h-[44px] min-w-[44px] select-none"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="min-h-[44px] min-w-[44px] select-none"
                  aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
                >
                  {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </Button>
            <div className="flex items-center gap-1 sm:gap-1.5">
              {organization?.logo_url ? (
                <img src={organization.logo_url} alt={organization.name} className="h-7 sm:h-8 w-auto" />
              ) : (
                <>
                  <img 
                    src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6983e2500291b5dfd8507ab1/c68ded0e2_Screenshot2026-01-20202907.png" 
                    alt="GSIS Manager" 
                    className="h-6 sm:h-8 w-auto"
                  />
                  <span className="font-semibold text-xs sm:text-sm text-slate-900 hidden sm:inline">{organization?.name || 'GSIS Manager'}</span>
                </>
              )}
            </div>
          </div>

          {/* Quick Access Menu Button */}
          <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMegaMenuOpen(!megaMenuOpen)}
              aria-label="Open quick access menu"
              aria-expanded={megaMenuOpen}
              className="flex items-center gap-1 sm:gap-1.5 text-slate-600 hover:text-amber-600 hover:bg-amber-50/80 dark:hover:bg-amber-950/20 h-9 px-1.5 sm:px-3 text-xs sm:text-sm select-none"
            >
              <Grid3x3 className="h-4 w-4 flex-shrink-0" />
              <span className="font-medium hidden sm:inline">Quick Access</span>
              <ChevronDown className={cn("h-3.5 w-3.5 transition-transform hidden sm:block", megaMenuOpen && "rotate-180")} />
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
      <aside aria-label="Primary navigation"
        className={cn(
          "fixed top-0 left-0 h-full w-72 bg-slate-900 text-slate-300 z-50 transition-transform duration-300 lg:translate-x-0 shadow-2xl",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <div className="h-24 flex items-center px-8 mb-4">
            {organization?.logo_url ? (
              <img src={organization.logo_url} alt={organization.name} className="h-12 w-auto brightness-0 invert" />
            ) : (
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <div>
                  <span className="font-bold text-xl text-white tracking-tight block leading-none">Construct</span>
                  <span className="text-xs font-bold text-primary uppercase tracking-widest">Flow Pro</span>
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 space-y-1 overflow-y-auto no-scrollbar" aria-label="Main sections">
            <div className="text-[10px] font-bold text-slate-500 px-4 py-2 uppercase tracking-[0.2em] mb-2">Main Menu</div>
            {navItems.map((item) => {
                const isActive = currentPageName === item.page;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.page}
                    to={createPageUrl(item.page)}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      "group flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 select-none mb-1",
                      isActive
                        ? "bg-primary text-white shadow-lg shadow-primary/20"
                        : "text-slate-400 hover:bg-white/5 hover:text-white"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={cn("h-5 w-5 transition-colors", isActive ? "text-white" : "text-slate-500 group-hover:text-primary")} />
                      {item.name}
                    </div>
                    {isActive && <ChevronRight className="h-4 w-4 text-white/50" />}
                  </Link>
                );
              })}

            {user?.role === 'admin' && (
              <div className="mt-8">
                <div className="text-[10px] font-bold text-slate-500 px-4 py-2 uppercase tracking-[0.2em] mb-2">Administration</div>
                {adminNavItems.map((item) => {
                  const isActive = currentPageName === item.page;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.page}
                      to={createPageUrl(item.page)}
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        "group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 mb-1",
                        isActive
                          ? "bg-slate-800 text-white shadow-md"
                          : "text-slate-400 hover:bg-white/5 hover:text-white"
                      )}
                    >
                      <Icon className={cn("h-5 w-5 transition-colors", isActive ? "text-white" : "text-slate-500 group-hover:text-primary")} />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            )}
          </nav>

          {/* Sidebar Footer */}
          <div className="p-6 mt-auto">
            <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-lg">
                   {organization?.name?.[0] || 'G'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white text-sm truncate">{organization?.name || 'GSIS Manager'}</p>
                  <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                    <ShieldCheck className="h-3 w-3" />
                    Verified Pro
                  </div>
                </div>
              </div>
              <Button 
                variant="ghost" 
                className="w-full justify-start gap-2 text-slate-400 hover:text-white hover:bg-white/5 h-9 px-2 text-xs font-bold"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
              <main id="main-content" tabIndex={-1} className="lg:pl-72 pt-16 min-h-screen pb-20 lg:pb-0" style={{ paddingBottom: 'calc(5rem + env(safe-area-inset-bottom))' }}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={location.pathname}
                    initial={{ opacity: 0, x: 300 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -300 }}
                    transition={{ duration: 0.3 }}
                    className="p-3 sm:p-4 md:p-6 lg:p-8"
                  >
                    {children}
                  </motion.div>
                </AnimatePresence>
              </main>

      {/* Mobile Bottom Navigation */}
              {!isHomePage && <MobileBottomNav currentPageName={currentPageName} />}

              {/* Global Styles */}
              <style>{`
                @media (max-width: 640px) {
                  h1, h2, h3, h4, h5, h6 {
                    line-height: 1.3;
                  }
                }
              `}</style>
    </div>
  );
}