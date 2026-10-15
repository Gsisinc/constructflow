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
  Sun as SunIcon,
  Moon as MoonIcon,
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
  LayoutGrid,
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
  ChevronUp as FooterChevronUp,
  HelpCircle as FooterHelpCircle,
  MessageSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import MegaMenu from '@/components/layout/MegaMenu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
    { name: 'Chats', icon: MessageSquare, page: 'SupportChannels' },
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

// ---- AppFooter (inlined: Base44 editor cannot create new files) ----
// Former "Settings & Support" group. Labels and routes unchanged; split per settings-audit/audit.md.
// CORE: listed first in the Add-ins popover (placement B keeps the bar to Settings + Support, per mockup v4).
const coreLinks = [
  { label: 'AI Agents', page: 'AIAgents' },
  { label: 'Role Permissions', page: 'RolePermissions' },
  { label: 'Audit Trail', page: 'AuditTrail' },
];
// ADD-IN (real, occasional use) then DEAD (stub/misrouted/irrelevant: hidden in the popover, not deleted).
const addInLinks = [
  { label: 'Bid Leveling & Forecasts', page: 'Phase2Operations' },
  { label: 'Enterprise Integrations', page: 'Phase3Operations' },
  { label: 'Reliability & Support Ops', page: 'Phase6ReliabilityOps' },
];
const deadLinks = [
  { label: 'Help & Support', page: 'Settings' },
  { label: 'Support Channels', page: 'SupportChannels' },
  { label: "What's New", page: 'Dashboard' },
  { label: 'Make a Suggestion', page: 'Settings' },
  { label: 'Implementation', page: 'Implementation' },
  { label: 'Platform & Tenant Control', page: 'Phase5PlatformScale' },
];

const linkCls = 'text-navy-200 hover:text-gold-500 transition-colors whitespace-nowrap';

/**
 * Admin-only footer, placement A (Kemar 3:59 PM PT): sits right under the content on short pages.
 * No logo, company name or license text; buttons only, right-aligned.
 * The "Support" button goes to ServiceDesk, the working support/ticket page; the old
 * "Help & Support" label routed to Settings, which has no help content.
 */
function AppFooter({ userRole }) {
  if (userRole !== 'admin') return null;

  return (
    <footer className="bg-navy-900 text-navy-200 border-t-2 border-gold-500" role="contentinfo">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3 sm:gap-4">
        <nav aria-label="Settings and support" className="flex flex-wrap items-center gap-2 sm:ml-auto text-[12px]">
          <Link to={createPageUrl('Settings')} className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-gold-500 text-navy-900 font-semibold hover:brightness-110 transition">
            <Settings className="h-3.5 w-3.5" /> Settings
          </Link>
          <Link to={createPageUrl('ServiceDesk')} className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full border border-gold-500 text-white font-semibold hover:bg-gold-500/10 transition">
            <FooterHelpCircle className="h-3.5 w-3.5" /> Support
          </Link>
          <Popover>
            <PopoverTrigger asChild>
              <button type="button" className="inline-flex items-center gap-1 h-8 px-2.5 rounded-full border border-navy-700 text-navy-200 hover:text-gold-500 hover:border-gold-500 transition-colors">
                Add-ins <FooterChevronUp className="h-3 w-3" />
              </button>
            </PopoverTrigger>
            <PopoverContent side="top" align="end" className="w-56 p-2 bg-navy-900 border-navy-700 text-[12px]">
              <p className="px-1 pb-1 text-[10px] uppercase tracking-wider text-gold-500 font-bold">Admin</p>
              {coreLinks.map((item) => (
                <Link key={item.label} to={createPageUrl(item.page)} className={`block px-1 py-1 rounded hover:bg-navy-800 ${linkCls}`}>{item.label}</Link>
              ))}
              <p className="px-1 pt-2 pb-1 mt-1 border-t border-navy-700 text-[10px] uppercase tracking-wider text-gold-500 font-bold">Add-ins</p>
              {addInLinks.map((item) => (
                <Link key={item.label} to={createPageUrl(item.page)} className={`block px-1 py-1 rounded hover:bg-navy-800 ${linkCls}`}>{item.label}</Link>
              ))}
              <p className="px-1 pt-2 pb-1 mt-1 border-t border-navy-700 text-[10px] uppercase tracking-wider text-navy-400 font-bold">Hidden / under review</p>
              {deadLinks.map((item) => (
                <Link key={item.label} to={createPageUrl(item.page)} className="block px-1 py-1 rounded text-navy-400 hover:text-gold-500 hover:bg-navy-800 whitespace-nowrap">{item.label}</Link>
              ))}
            </PopoverContent>
          </Popover>
        </nav>
      </div>
    </footer>
  );
}

export default function Layout({ children, currentPageName }) {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try { return localStorage.getItem('mygsis_sidebar_collapsed') === 'true'; } catch { return false; }
  });
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  // Premium theme (Kemar-approved): dark default, light = html.theme-light. Stored in localStorage.
  const [gsTheme, setGsTheme] = useState(() => {
    try { return localStorage.getItem('mygsis_theme') === 'light' ? 'light' : 'dark'; } catch { return 'dark'; }
  });
  useEffect(() => {
    const root = document.documentElement;
    const apply = () => {
      root.classList.toggle('theme-light', gsTheme === 'light');
      root.classList.toggle('dark', gsTheme === 'dark'); // keeps Tailwind dark: variants in sync
      root.classList.toggle('light', gsTheme === 'light');
      root.style.colorScheme = gsTheme;
      root.dataset.theme = gsTheme; // mockup spec uses [data-theme=light]
    };
    apply();
    // ThemeProvider's mount effect runs after ours; re-apply on next frame so it can't override
    const raf = requestAnimationFrame(apply);
    try {
      localStorage.setItem('mygsis_theme', gsTheme);
      localStorage.setItem('constructflow-theme', gsTheme); // keep legacy ThemeContext in agreement
    } catch {}
    return () => cancelAnimationFrame(raf);
  }, [gsTheme]);
  const toggleGsTheme = () => {
    const root = document.documentElement;
    root.classList.add('gs-theme-switching');
    root.dataset.theme = gsTheme === 'dark' ? 'light' : 'dark';
    setGsTheme((t) => (t === 'dark' ? 'light' : 'dark'));
    setTimeout(() => root.classList.remove('gs-theme-switching'), 350);
  };
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
    // FIX (tech loop): technicians/clients cannot open Onboarding (RoleGuard bounces them to their portal),
    // so redirecting them there ping-pongs forever when organization_id is missing. Admin-only redirect.
    if (user.role === 'technician' || user.role === 'client') return;
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
    <div className="flex flex-col h-screen bg-background text-foreground">
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
        :root.legacy-light-overrides {
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
      <header className={cn("gs-topbar fixed top-0 left-0 right-0 h-16 sm:h-16 border-b shadow-sm z-40 transition-all duration-300", sidebarCollapsed ? "lg:pl-20" : "lg:pl-64")}>
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
                <span className="gs-logo-plate gs-logo-plate-sm flex-shrink-0"><img src={organization.logo_url} alt={organization.name} className="h-9 sm:h-10 w-auto max-w-[160px] object-contain" /></span>
              ) : (
                <>
                  <span className="gs-logo-plate gs-logo-plate-sm flex-shrink-0">
                    <img 
                      src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6983e2500291b5dfd8507ab1/c68ded0e2_Screenshot2026-01-20202907.png" 
                      alt="GSIS Manager" 
                      className="h-9 sm:h-10 w-auto max-w-[160px] object-contain"
                    />
                  </span>
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
              className="h-8 sm:h-9 px-2 sm:px-3 gap-1.5 rounded-full bg-navy-900 text-white hover:bg-navy-700 hover:text-white shadow-sm ring-1 ring-navy-700 flex-shrink-0"
              title="Quick Access"
              aria-label="Quick Access"
            >
              <LayoutGrid className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gold-500" />
              <span className="hidden sm:inline text-xs sm:text-sm font-semibold">Quick Access</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleGsTheme}
              className="h-8 sm:h-9 w-8 sm:w-9 p-0 text-[#B7C4DA] hover:text-white hover:bg-white/10 flex-shrink-0"
              title={gsTheme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
              aria-label="Toggle theme"
            >
              {gsTheme === 'dark' ? <SunIcon className="h-4 w-4" /> : <MoonIcon className="h-4 w-4 text-[#F0C75E]" />}
            </Button>
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
        "gs-sidebar fixed top-14 sm:top-16 left-0 bg-[#0B1F3A] border-r border-[#C9A227]/20 shadow-lg z-40 transition-all duration-300 lg:top-16 overflow-y-auto overscroll-contain",
        "h-[calc(100vh-3.5rem-4rem)] sm:h-[calc(100vh-4rem)] lg:h-[calc(100vh-4rem)]",
        sidebarCollapsed ? "lg:w-20" : "lg:w-64",
        sidebarOpen ? "translate-x-0" : "-translate-x-full",
        "lg:translate-x-0"
      )}>
        {/* Sidebar brand block (Kemar 3:52 PM PT): GSIS logo only, no text (Kemar 4:00 PM PT) */}
        <div className={cn("flex flex-col items-center px-4 pt-5 pb-4 border-b border-[#C9A227]/15", sidebarCollapsed && "lg:hidden")}>
          <span className="gs-logo-plate"><img src="/mygsis-logo.png" alt="Golden State Integrated Systems" className="h-[120px] w-auto object-contain" /></span>
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
        <AppFooter userRole={user?.role} />
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