import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  LayoutDashboard,
  Clock,
  FileText,
  AlertTriangle,
  Package,
  MessageSquare,
  DollarSign,
  FileStack,
  TrendingUp,
  Users,
  Calendar,
  Camera,
  FolderOpen,
  FileImage,
  Book,
  Settings,
  HelpCircle,
  Smartphone,
  Video,
  Building2,
  Search,
  Bot,
  Shield,
  Radio,
  Wrench,
  X,
  LayoutGrid
} from 'lucide-react';

// Quick access for technicians only (tech portal dashboard + tools)
const technicianMenuSections = [
  {
    title: 'My Work',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', page: 'TechnicianPortal' },
      { icon: Calendar, label: 'Calendar', page: 'Calendar' },
      { icon: FileStack, label: 'Tasks', page: 'TaskTracker' },
      { icon: Clock, label: 'Time Cards', page: 'TimeCards' },
      { icon: Package, label: 'Materials', page: 'Materials' },
    ]
  },
  {
    title: 'Learning & People',
    items: [
      { icon: Book, label: 'Modules & Training', page: 'TechnicianTraining' },
      { icon: Users, label: 'Directory', page: 'Directory' },
      { icon: Bot, label: 'AI Agents (onsite help)', page: 'AIAgents' },
    ]
  },
  {
    title: 'Time & Pay',
    items: [
      { icon: DollarSign, label: 'Pay Stub', page: 'PayStub' },
      { icon: Calendar, label: 'Request Time Off', page: 'RequestTimeOff' },
    ]
  },
  {
    title: 'Support',
    items: [
      { icon: Settings, label: 'Settings', page: 'Settings' },
      { icon: Wrench, label: 'Service Desk', page: 'ServiceDesk' },
    ]
  },
];

// Quick access for clients/stakeholders only
const clientMenuSections = [
  {
    title: 'Overview',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', page: 'ClientPortal' },
      { icon: FolderOpen, label: 'Projects', page: 'Projects' },
      { icon: FileStack, label: 'Documents', page: 'Documents' },
    ]
  },
  {
    title: 'Support',
    items: [
      { icon: Wrench, label: 'Support', page: 'ServiceDesk' },
      { icon: Settings, label: 'Settings', page: 'Settings' },
    ]
  },
];

const menuSections = [
  {
    title: 'Operation Management',
    items: [
      { icon: LayoutDashboard, label: 'Ops Dashboard', page: 'Dashboard' },
      { icon: FileText, label: 'Daily Log', page: 'DailyLog' },
      { icon: Clock, label: 'Time Cards', page: 'TimeCards' },
      { icon: Calendar, label: 'Schedules', page: 'Calendar' },
      { icon: Bot, label: 'Scheduling AI', page: 'SchedulingAI' },
      { icon: AlertTriangle, label: 'Issues', page: 'Issues' },
      { icon: Shield, label: 'Safety', page: 'Safety' },
      { icon: Smartphone, label: 'Vehicles', page: 'VehicleLogs' },
      { icon: Package, label: 'Materials', page: 'Materials' },
      { icon: FileStack, label: 'Documents', page: 'Documents' },
      { icon: Wrench, label: 'Service Desk', page: 'ServiceDesk' },
      { icon: Video, label: 'Training & Support', page: 'PMSetupGuide' },
    ]
  },
  {
    title: 'Financials',
    items: [
      { icon: DollarSign, label: 'Overview', page: 'Budget' },
      { icon: FileText, label: 'Estimates', page: 'Estimates' },
      { icon: Package, label: 'Purchase Orders', page: 'PurchaseOrders' },
      { icon: FileText, label: 'Invoices', page: 'Invoices' },
      { icon: FileText, label: 'AIA Billing (G702/G703)', page: 'AIABilling' },
      { icon: FileText, label: 'Bill Approvals', page: 'BillApprovals' },
      { icon: TrendingUp, label: 'Financial Projections', page: 'Budget' },
      { icon: FileStack, label: 'Change Orders', page: 'Budget' },
      { icon: TrendingUp, label: 'Job Costing (WIP)', page: 'JobCosting' },
      { icon: FileStack, label: 'Cost Plus Invoicing', page: 'CostPlusInvoicing' },
      { icon: Building2, label: 'QuickBooks Sync', page: 'QuickBooksSync' },
    ]
  },
  {
    title: 'Bid Management',
    items: [
      { icon: FileText, label: 'Add Bid Manually', page: 'AddBid' },
      { icon: Search, label: 'Bid Discovery', page: 'BidDiscovery' },
      { icon: FileStack, label: 'Active Bids', page: 'Bids' },
      { icon: FileText, label: 'Cost Library', page: 'CostLibrary' },
      { icon: FileText, label: 'AI Estimate Generator', page: 'EstimateGenerator' },
      { icon: MessageSquare, label: 'Send Text Messages', page: 'TextMessages' },
      { icon: FileText, label: 'E-signatures', page: 'ESignatures' },
    ]
  },
  {
    title: 'Compliance',
    items: [
      { icon: Shield, label: 'Lien Waivers', page: 'LienWaivers' },
      { icon: FileStack, label: 'Document Tracking', page: 'DocumentTracking' },
    ]
  },
  {
    title: 'People',
    items: [
      { icon: Users, label: 'Directory', page: 'Directory' },
      { icon: Search, label: 'Opportunities', page: 'BidDiscovery' },
      { icon: Users, label: 'Technicians', page: 'Directory' },
      { icon: Users, label: 'Tech Portal', page: 'TechnicianPortal' },
      { icon: Users, label: 'Client Portal', page: 'ClientPortal' },
      { icon: Users, label: 'Subcontractor Portal', page: 'SubcontractorPortal' },
      { icon: Calendar, label: 'Calendar', page: 'Calendar' },
      { icon: Smartphone, label: 'Vehicles', page: 'VehicleLogs' },
      { icon: FileStack, label: 'Documents', page: 'Documents' },
    ]
  },
  {
    title: 'Documents',
    items: [
      { icon: Camera, label: 'Photos', page: 'Photos' },
      { icon: FolderOpen, label: 'Files', page: 'Documents' },
      { icon: FileImage, label: 'Plans & Drawings', page: 'Documents' },
      { icon: Book, label: 'Reports', page: 'Dashboard' },
      { icon: FileStack, label: 'Submittals', page: 'Submittals' },
      { icon: Package, label: 'Equipment Logs', page: 'Materials' },
    ]
  },
  {
    title: 'Settings & Support',
    items: [
      { icon: HelpCircle, label: 'Help & Support', page: 'Settings' },
      { icon: MessageSquare, label: 'Support Channels', page: 'SupportChannels' },
      { icon: Radio, label: "What's New", page: 'Dashboard' },
      { icon: MessageSquare, label: 'Make a Suggestion', page: 'Settings' },
      { icon: Bot, label: 'AI Agents', page: 'AIAgents' },
      { icon: Settings, label: 'Role Permissions', page: 'RolePermissions' },
      { icon: FileStack, label: 'Audit Trail', page: 'AuditTrail' },
      { icon: Building2, label: 'Implementation', page: 'Implementation' },
      { icon: TrendingUp, label: 'Bid Leveling & Forecasts', page: 'Phase2Operations' },
      { icon: Building2, label: 'Enterprise Integrations', page: 'Phase3Operations' },
      { icon: Building2, label: 'Platform & Tenant Control', page: 'Phase5PlatformScale' },
      { icon: Wrench, label: 'Reliability & Support Ops', page: 'Phase6ReliabilityOps' },
    ]
  },
  {
    title: 'Resources',
    items: [
      { icon: Book, label: 'Knowledge Base', page: 'PMSetupGuide' },
      { icon: Building2, label: "Who's Behind It", page: 'Home' },
    ]
  },
];

export default function MegaMenu({ isOpen, onClose, userRole }) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) setQuery('');
  }, [isOpen]);

  // Base44 only has user/admin: we map to technician | client | admin. Default to tech menu when role not yet loaded.
  const sections = userRole === 'admin' ? menuSections : userRole === 'client' ? clientMenuSections : technicianMenuSections;
  const subtitle = userRole === 'admin' ? 'Navigate to any feature across the platform' : userRole === 'client' ? 'Projects and support' : 'Your tools, schedule, and support';

  const filteredSections = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sections;
    return sections
      .map((section) => ({
        ...section,
        items: section.title.toLowerCase().includes(q)
          ? section.items
          : section.items.filter((item) => item.label.toLowerCase().includes(q)),
      }))
      .filter((section) => section.items.length > 0);
  }, [sections, query]);

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-navy-900/60 backdrop-blur-[2px]"
        aria-hidden="true"
        onClick={onClose}
      />

      {/* Quick Access panel */}
      <div className="fixed left-0 right-0 top-14 sm:top-16 lg:left-64 lg:right-0 z-50 bg-slate-50 border-b border-navy-100 max-h-[calc(100vh-3.5rem)] sm:max-h-[calc(100vh-4rem)] overflow-y-auto shadow-2xl" role="dialog" aria-modal="true" aria-label="Quick access navigation">
        {/* Navy header band */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-navy-900 to-navy-700 text-white shadow-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-10 w-10 rounded-xl bg-white/10 ring-1 ring-white/20 flex items-center justify-center flex-shrink-0">
                  <LayoutGrid className="h-5 w-5 text-gold-500" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Quick Access</h2>
                  <p className="text-sm text-navy-200 mt-0.5 truncate">{subtitle}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="h-10 w-10 rounded-full flex items-center justify-center text-navy-200 hover:text-white hover:bg-white/10 transition-all active:scale-95 flex-shrink-0"
                title="Close menu"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            {/* Search / filter */}
            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-navy-300 pointer-events-none" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filter features..."
                aria-label="Filter features"
                className="w-full sm:max-w-md h-10 pl-9 pr-3 rounded-lg bg-white/10 text-white placeholder:text-navy-300 ring-1 ring-white/20 focus:ring-2 focus:ring-gold-500 focus:bg-white/15 outline-none text-sm transition"
              />
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
          {filteredSections.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-10">No features match &ldquo;{query}&rdquo;.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
              {filteredSections.map((section) => {
                const SectionIcon = section.items[0]?.icon || LayoutGrid;
                return (
                  <div key={section.title} className="bg-white rounded-xl border border-navy-100 border-t-4 border-t-navy-700 p-4 shadow-sm hover:shadow-lg hover:border-navy-200 transition-all">
                    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-navy-50">
                      <div className="h-7 w-7 rounded-lg bg-navy-50 text-navy-700 flex items-center justify-center flex-shrink-0">
                        <SectionIcon className="h-4 w-4" />
                      </div>
                      <h3 className="text-xs font-bold text-navy-900 uppercase tracking-wider">{section.title}</h3>
                    </div>
                    <div className="space-y-0.5">
                      {section.items.map((item, itemIdx) => {
                        const Icon = item.icon;
                        return (
                          <Link
                            key={itemIdx}
                            to={createPageUrl(item.page)}
                            onClick={onClose}
                            className="flex items-center gap-2.5 px-2 py-2 text-sm font-medium text-slate-700 hover:text-navy-900 hover:bg-navy-50 rounded-lg transition-colors group"
                          >
                            <div className="h-6 w-6 rounded-md bg-slate-100 text-slate-500 flex items-center justify-center group-hover:bg-navy-700 group-hover:text-white transition-colors flex-shrink-0">
                              <Icon className="h-3.5 w-3.5" />
                            </div>
                            <span className="truncate">{item.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
