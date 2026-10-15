import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { createPageUrl } from './utils';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { cn } from '@/lib/utils';
import CommandPalette from '@/components/layout/CommandPalette';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
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
  ChevronLeft,
  ChevronRight,
  Clock,
  Settings,
  User,
  Bot,
  Search,
  Grid3x3,
  ArrowLeft,
  Wrench,
  Calendar,
  BookOpen,
  Banknote,
  CalendarOff,
  CalendarRange,
  Building2,
  Truck,
  Tag,
  Mic,
  Calculator,
  BarChart3,
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
import AgentChat from '@/components/agents/AgentChat';
// import ApiKeyBanner from '@/components/settings/ApiKeyBanner';

// Grouped navigation for admin/default users (Kemar's master layout)
const navGroups = [
  { items: [
    { name: 'Dashboard', icon: LayoutDashboard, page: 'Dashboard' },
    { name: 'Schedule', icon: Calendar, page: 'Calendar' },
    { name: 'Ops Dashboard', icon: BarChart3, page: 'OpsDashboard' },
    { name: 'Resource Board', icon: CalendarRange, page: 'ResourceBoard' },
  ]},
  { label: 'Sales & Estimating', items: [
    { name: 'Bids', icon: FileText, page: 'Bids' },
    { name: 'Leads', icon: Users, page: 'Leads' },
    { name: 'Contractor Directory', icon: Building2, page: 'ContractorDirectory' },
    { name: 'Estimates', icon: DollarSign, page: 'Estimates' },
    { name: 'Rate Card', icon: Tag, page: 'RateCard' },
  ]},
  { items: [
    { name: 'Projects', icon: FolderKanban, page: 'Projects' },
    { name: 'Documents', icon: FileStack, page: 'Documents' },
  ]},
  { label: 'Billing', items: [
    { name: 'Billing', icon: Banknote, page: 'Billing' },
    { name: 'WIP Report', icon: Calculator, page: 'WIPReport' },
  ]},
  { label: 'Procurement', items: [
    { name: 'Suppliers', icon: Truck, page: 'Suppliers' },
    { name: 'Purchase Orders', icon: FileText, page: 'PurchaseOrders' },
  ]},
];

const settingsAdminItems = [
  { name: 'Settings', icon: Settings, page: 'Settings' },
  { name: 'Role Permissions', icon: Settings, page: 'RolePermissions' },
  { name: 'User Approvals', icon: User, page: 'UserApprovals' },
  { name: 'AI Agents', icon: Bot, page: 'AIAgents' },
  { name: 'Alerts', icon: AlertTriangle, page: 'AlertSettings' },
  { name: 'Templates', icon: FileText, page: 'TemplateLibrary' },
  { name: 'Audit Trail', icon: FileStack, page: 'AuditTrail' },
  { name: 'Service Desk', icon: Wrench, page: 'ServiceDesk' },
];

// Backward-compat flat lists (used by MobileBottomNav / MegaMenu if referenced)
const primaryNavItems = navGroups.flatMap(g => g.items);
const secondaryNavItems = navGroups.slice(1).flatMap(g => g.items);
const financialNavItems = navGroups.find(g => g.label === 'Billing')?.items || [];
const adminNavItems = settingsAdminItems;
const navItems = primaryNavItems.concat(settingsAdminItems);

// Technician portal: dashboard + calendar, tasks, time cards, modules, directory, etc.
const technicianPrimaryNav = [
  { name: 'Dashboard', icon: LayoutDashboard, page: 'TechnicianPortal' },
  { name: 'Calendar', icon: Calendar, page: 'Calendar' },
  { name: 'Tasks', icon: FileStack, page: 'TaskTracker' },
  { name: 'Time Cards', icon: Clock, page: 'TimeCards' },
];

const technicianSecondaryNav = [
  { name: 'Modules & Training', icon: BookOpen, page: 'TechnicianTraining' },
  { name: 'Directory', icon: Users, page: 'Directory' },
  { name: 'AI Agents (onsite help)', icon: Bot, page: 'AIAgents' },
  { name: 'Pay Stub', icon: Banknote, page: 'PayStub' },
  { name: 'Request Time Off', icon: CalendarOff, page: 'RequestTimeOff' },
];

// Client/stakeholder portal: projects they can see, documents, messages, support
const clientPrimaryNav = [
  { name: 'Dashboard', icon: LayoutDashboard, page: 'ClientPortal' },
  { name: 'Projects', icon: FolderKanban, page: 'Projects' },
  { name: 'Documents', icon: FileStack, page: 'Documents' },
  { name: 'Support', icon: Wrench, page: 'ServiceDesk' },
];

function UserMenu({ user, onLogout }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 p-1.5 sm:p-2 rounded-lg hover:bg-slate-100 transition-colors">
          <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold flex-shrink-0" style={{ backgroundColor: '#0B1F3A', color: '#C9A227' }}>
            {user.full_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-xs sm:text-sm font-medium text-slate-900 truncate max-w-[120px]">
              {user.full_name || 'User'}
            </p>
            <p className="text-xs text-slate-500 truncate max-w-[120px]">{user.email}</p>
          </div>
          <ChevronDown className="h-4 w-4 text-slate-400 hidden sm:block flex-shrink-0" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 sm:w-56">
        <DropdownMenuItem asChild>
          <Link to={createPageUrl('Settings')} className="flex items-center text-xs sm:text-sm cursor-pointer">
            <Settings className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2 flex-shrink-0" />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onLogout} className="text-red-600 text-xs sm:text-sm cursor-pointer">
          <LogOut className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2 flex-shrink-0" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Sidebar nav item component
function SidebarNavItem({ item, isActive, onNavigate }) {
  const Icon = item.icon;
  return (
    <Link
      to={createPageUrl(item.page)}
      onClick={onNavigate}
      title={item.name}
      className={cn(
        "group flex items-center gap-3 px-4 py-2.5 rounded-r-lg text-sm font-medium transition-all duration-200 min-h-[44px] border-l-[3px]",
        isActive
          ? "bg-[#16335C] text-white font-semibold border-[#C9A227] shadow-sm"
          : "text-white/70 border-transparent hover:bg-white/5 hover:text-white"
      )}
    >
      <Icon className={cn("h-5 w-5 flex-shrink-0", isActive ? "text-white" : "text-[#C9A227]/70 group-hover:text-[#C9A227]")} />
      <span className="truncate">{item.name}</span>
    </Link>
  );
}

export default function Layout({ children, currentPageName }) {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try { return localStorage.getItem('mygsis_sidebar_collapsed') === 'true'; } catch { return false; }
  });
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [organization, setOrganization] = useState(null);
  const [previousPage, setPreviousPage] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  const isHomePage = currentPageName === 'Home';
  const isOnboardingPage = currentPageName === 'Onboarding';
  const isLandingPage = currentPageName === 'Landing';
  const isRootPage = location.pathname === '/';

  // Auth guard: no org -> onboarding (handled once auth is ready)
  useEffect(() => {
    if (!user) return;
    if (!user.organization_id && currentPageName !== 'Onboarding' && !isHomePage && !isLandingPage) {
      navigate(createPageUrl('Onboarding'));
    }
  }, [user, user?.organization_id, currentPageName, isHomePage, isLandingPage, navigate]);

  // Admin default: from Home go to Bids (technicians/clients are redirected by RoleGuard before we mount)
  useEffect(() => {
    if (!user || !isHomePage) return;
    if (user.role === 'technician') navigate(createPageUrl('TechnicianPortal'));
    else if (user.role === 'client') navigate(createPageUrl('ClientPortal'));
    else navigate(createPageUrl('Bids'));
  }, [user, user?.role, isHomePage, navigate]);

  // Load organization for logo/theme
  useEffect(() => {
    if (!user?.organization_id) return;
    let cancelled = false;
    base44.entities.Organization.filter({ id: user.organization_id }).then((orgs) => {
      if (cancelled || !orgs?.length) return;
      setOrganization(orgs[0]);
      document.documentElement.style.setProperty('--primary', hexToHSL(orgs[0].primary_color || '#0B1F3A'));
      document.documentElement.style.setProperty('--secondary', hexToHSL(orgs[0].secondary_color || '#1E3A5F'));
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [user?.organization_id]);

  // Track page changes for back navigation
  useEffect(() => {
    if (currentPageName !== previousPage) {
      setPreviousPage(currentPageName);
    }
  }, [currentPageName, previousPage]);

  const handleBack = () => {
    // Map of pages to their parent pages
    const pageHierarchy = {
      'ProjectDetail': 'Projects',
      'BidDetail': 'Bids',
      'TaskDetail': 'Tasks',
      'DocumentDetail': 'Documents',
      'EstimateDetail': 'Estimates',
      'InvoiceDetail': 'Invoices',
      'ExpenseBillingDetail': 'ExpenseBilling',
    };
    
    // If current page has a parent, go to parent
    if (pageHierarchy[currentPageName]) {
      navigate(createPageUrl(pageHierarchy[currentPageName]));
    } 
    // Otherwise, try browser back
    else if (previousPage && previousPage !== currentPageName) {
      navigate(-1);
    }
    // Fallback by role
    else if (user?.role === 'technician') {
      navigate(createPageUrl('TechnicianPortal'));
    } else if (user?.role === 'client') {
      navigate(createPageUrl('ClientPortal'));
    } else {
      navigate(createPageUrl('Bids'));
    }
  };

  const handleLogout = async () => {
    try {
      try { sessionStorage.removeItem('mygsis_portal_role'); } catch (_) {}
      await base44.auth.logout();
      navigate(createPageUrl('Home'));
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleNavigateFromSidebar = () => {
    setSidebarOpen(false);
  };

  const toggleSidebarCollapsed = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try { localStorage.setItem('mygsis_sidebar_collapsed', String(next)); } catch {}
      return next;
    });
  };

  function hexToHSL(hex) {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    h = Math.round(h * 360);
    s = Math.round(s * 100);
    l = Math.round(l * 100);
    return `${h} ${s}% ${l}%`;
  }

  // Full-bleed pages (no sidebar): Home, Onboarding, Landing (marketing website)
  if (isHomePage || isOnboardingPage || isLandingPage) {
    return children;
  }

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      <CommandPalette />
      <style>{`
              html {
                overscroll-behavior: none;
              }
              body {
                overscroll-behavior: none;
                -webkit-overflow-scrolling: touch;
              }
        input, textarea, select {
          font-size: 16px !important;
        }
        :root {
          --primary: 37 99% 36%;
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
        @media (max-width: 640px) {
          h1 { font-size: 1.5rem; line-height: 1.3; }
          h2 { font-size: 1.25rem; line-height: 1.3; }
          h3 { font-size: 1.1rem; line-height: 1.3; }
          h4, h5, h6 { font-size: 1rem; line-height: 1.3; }
          p { font-size: 0.875rem; }
          label, span { font-size: 0.8125rem; }
        }
      `}</style>

      {/* Header */}
      <header className={cn("fixed top-0 left-0 right-0 h-16 sm:h-16 bg-white border-b border-gray-200 shadow-sm z-40 transition-all duration-300", sidebarCollapsed ? "lg:pl-20" : "lg:pl-64")}>
        <div className="h-full flex items-center justify-between px-2 sm:px-3 md:px-4 lg:px-6">
          {/* Left section: Menu & Logo */}
          <div className="flex items-center gap-1 sm:gap-2 min-w-0 flex-1">
            {/* Mobile menu toggle - ALWAYS VISIBLE on small screens */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden h-10 w-10 p-2 flex items-center justify-center hover:bg-slate-100 active:bg-slate-200 text-slate-700 rounded-lg transition-colors"
              title="Toggle menu"
              type="button"
            >
              {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
            
            <div className="flex items-center gap-0.5">
              {!isRootPage && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBack}
                  className="hidden sm:inline-flex h-8 w-8 sm:h-9 sm:w-9 p-0 flex-shrink-0"
                >
                  <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </Button>
              )}
            </div>

            {/* Logo/Org Name */}
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              {organization?.logo_url ? (
                <img src={organization.logo_url} alt={organization.name} className="h-8 sm:h-8 w-auto flex-shrink-0" />
              ) : (
                <>
                  <img 
                    src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6983e2500291b5dfd8507ab1/c68ded0e2_Screenshot2026-01-20202907.png" 
                    alt="GSIS Manager" 
                    className="h-7 sm:h-8 w-auto flex-shrink-0"
                  />
                  <span className="font-bold text-sm sm:text-base text-slate-900 hidden sm:inline truncate">{organization?.name || 'GSIS'}</span>
                </>
              )}
            </div>
          </div>

          {/* Right section: Menu & User */}
          <div className="flex items-center gap-1 sm:gap-1.5 ml-auto flex-shrink-0">
            {/* Desktop sidebar toggle - visible on all screens */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSidebarCollapsed}
              className="inline-flex h-8 sm:h-9 px-1.5 sm:px-2 text-slate-600 hover:text-navy-700 hover:bg-slate-100 flex-shrink-0"
              title="Toggle sidebar"
            >
              {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMegaMenuOpen(!megaMenuOpen)}
              className="h-8 sm:h-9 px-1.5 sm:px-2 text-slate-600 hover:text-navy-700 hover:bg-slate-100 flex-shrink-0"
              title="Quick Access"
            >
              <Grid3x3 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
            <ThemeToggle />
            {user && <UserMenu user={user} onLogout={handleLogout} />}
          </div>
        </div>
      </header>

      {/* Mega Menu */}
      <MegaMenu isOpen={megaMenuOpen} onClose={() => setMegaMenuOpen(false)} userRole={user?.role} />

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30 top-14 sm:top-16"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - on mobile leave room for bottom nav (4rem) so nothing is cut off */}
      <aside className={cn(
        "fixed top-14 sm:top-16 left-0 bg-[#0B1F3A] border-r border-[#C9A227]/20 shadow-lg z-40 transition-all duration-300 lg:top-16 overflow-y-auto overscroll-contain",
        "h-[calc(100vh-3.5rem-4rem)] sm:h-[calc(100vh-4rem)] lg:h-[calc(100vh-4rem)]",
        sidebarCollapsed ? "lg:w-20" : "lg:w-64",
        sidebarOpen ? "translate-x-0" : "-translate-x-full",
        "lg:translate-x-0"
      )}>
        <div className={cn("flex items-center px-4 h-12 border-b border-[#C9A227]/15", sidebarCollapsed && "lg:hidden")}>
          <span className="text-lg font-bold tracking-tight text-[#C9A227]">GSIS</span>
        </div>
        <nav className="p-3 sm:p-4 pb-6 sm:pb-4 space-y-1">
          {user?.role === 'technician' ? (
            <>
              {technicianPrimaryNav.map((item) => (
                <SidebarNavItem key={item.page} item={item} isActive={currentPageName === item.page} onNavigate={handleNavigateFromSidebar} />
              ))}
              <div className="h-px bg-white/10 my-2 sm:my-3" />
              <div className="text-[11px] font-semibold text-white/40 px-3 py-2 uppercase tracking-widest">My tools</div>
              {technicianSecondaryNav.map((item) => (
                <SidebarNavItem key={item.page} item={item} isActive={currentPageName === item.page} onNavigate={handleNavigateFromSidebar} />
              ))}
              <div className="h-px bg-white/10 my-2 sm:my-3" />
              <SidebarNavItem item={{ name: 'Settings', icon: Settings, page: 'Settings' }} isActive={currentPageName === 'Settings'} onNavigate={handleNavigateFromSidebar} />
            </>
          ) : user?.role === 'client' ? (
            <>
              {clientPrimaryNav.map((item) => (
                <SidebarNavItem key={item.page} item={item} isActive={currentPageName === item.page} onNavigate={handleNavigateFromSidebar} />
              ))}
              <div className="h-px bg-white/10 my-2 sm:my-3" />
              <SidebarNavItem item={{ name: 'Settings', icon: Settings, page: 'Settings' }} isActive={currentPageName === 'Settings'} onNavigate={handleNavigateFromSidebar} />
            </>
          ) : (
            <>
          {navGroups.map((group, gi) => (
            <React.Fragment key={gi}>
              {gi > 0 && <div className="h-px bg-white/10 my-2 sm:my-3" />}
              {group.label && (
                <div className="text-[11px] font-semibold text-white/40 px-3 py-2 uppercase tracking-widest">
                  {group.label}
                </div>
              )}
              {group.items.map((item) => (
                <SidebarNavItem key={item.page} item={item} isActive={currentPageName === item.page} onNavigate={handleNavigateFromSidebar} />
              ))}
            </React.Fragment>
          ))}

          {/* Settings / Admin gear section */}
          <div className="h-px bg-white/10 my-2 sm:my-3" />
          <div className="text-[11px] font-semibold text-white/40 px-3 py-2 uppercase tracking-widest flex items-center gap-1.5">
            <Settings className="h-3.5 w-3.5" /> Admin
          </div>
          {settingsAdminItems.map((item) => (
            <SidebarNavItem key={item.page} item={item} isActive={currentPageName === item.page} onNavigate={handleNavigateFromSidebar} />
          ))}
            </>
          )}
        </nav>

        {/* Sidebar Footer */}
        <div className="sticky bottom-0 p-3 sm:p-4 border-t border-[#C9A227]/20 bg-[#0B1F3A]">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ backgroundColor: '#C9A227', color: '#0B1F3A' }}>
              {organization?.name?.[0] || 'G'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-semibold text-white truncate">{organization?.name || 'GSIS Manager'}</p>
              <p className="text-xs text-[#C9A227]">Pro Plan</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={cn("flex-1 pt-14 sm:pt-16 pb-16 sm:pb-0 overflow-y-auto transition-all duration-300", sidebarCollapsed ? "lg:pl-20" : "lg:pl-64")}>
        {/* <ApiKeyBanner /> */}
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="p-2 sm:p-3 md:p-4 lg:p-6 w-full max-w-7xl mx-auto"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile Bottom Navigation */}
      {!isHomePage && !isLandingPage && <MobileBottomNav currentPageName={currentPageName} userRole={user?.role} />}

      {/* Floating voice agent — available on every app page, aware of the current page/project */}
      {!isHomePage && !isLandingPage && (
        <>
          <button
            onClick={() => setVoiceOpen(true)}
            className="fixed bottom-20 lg:bottom-6 right-4 z-40 h-14 w-14 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-lg flex items-center justify-center transition-transform hover:scale-105"
            title="Voice agent"
            type="button"
          >
            <Mic className="h-6 w-6" />
          </button>
          {voiceOpen && (
            <AgentChat
              agent={{ id: 'central_orchestrator', name: 'Central Orchestrator', description: 'Coordinate specialist agents and execute tasks', color: 'from-slate-500 to-slate-600' }}
              pageName={currentPageName}
              autoListen
              onClose={() => setVoiceOpen(false)}
            />
          )}
        </>
      )}
    </div>
  );
}