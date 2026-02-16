import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
// PAGES will be passed as a prop or handled via a different mechanism to avoid circular dependency
// For now, we'll assume the pages are available or use a safer way to access them
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
  Wrench
} from 'lucide-react';

const menuSections = [
  {
    title: 'Project Management',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', page: 'Dashboard' },
      { icon: FileText, label: 'Daily Log', page: 'DailyLog' },
      { icon: Clock, label: 'Time Cards', page: 'TimeCards' },
      { icon: AlertTriangle, label: 'Issues', page: 'Issues' },
      { icon: Shield, label: 'Safety', page: 'Safety' },
      { icon: Smartphone, label: 'Vehicles', page: 'VehicleLogs' },
      { icon: Package, label: 'Materials', page: 'Materials' },
      { icon: FileStack, label: 'Documents', page: 'Documents' },
    ]
  },
  {
    title: 'Financials',
    items: [
      { icon: DollarSign, label: 'Overview', page: 'Budget' },
      { icon: FileText, label: 'Estimates', page: 'Estimates' },
      { icon: Package, label: 'Purchase Orders', page: 'PurchaseOrders' },
      { icon: FileText, label: 'Invoices', page: 'Invoices' },
      { icon: TrendingUp, label: 'Financial Projections', page: 'Budget' },
      { icon: FileStack, label: 'Change Orders', page: 'Budget' },
    ]
  },
  {
    title: 'People',
    items: [
      { icon: Users, label: 'Directory', page: 'Directory' },
      { icon: Search, label: 'Opportunities', page: 'BidDiscovery' },
      { icon: Users, label: 'Technicians', page: 'Directory' },
      { icon: Calendar, label: 'Calendar', page: 'Calendar' },
      { icon: Smartphone, label: 'Vehicles', page: 'VehicleLogs' },
      { icon: FileStack, label: 'Documents', page: 'Documents' },
    ]
  },
  {
    title: 'Bid Management',
    items: [
      { icon: FileText, label: 'Add Bid Manually', page: 'AddBid' },
      { icon: Search, label: 'Bid Discovery', page: 'BidDiscovery' },
      { icon: FileStack, label: 'Active Bids', page: 'Bids' },
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
      { icon: Radio, label: "What's New", page: 'Dashboard' },
      { icon: MessageSquare, label: 'Make a Suggestion', page: 'Settings' },
      { icon: Bot, label: 'AI Agents', page: 'AIAgents' },
      { icon: Settings, label: 'Role Permissions', page: 'RolePermissions' },
      { icon: FileStack, label: 'Audit Trail', page: 'AuditTrail' },
      { icon: Wrench, label: 'Service Desk', page: 'ServiceDesk' },
      { icon: TrendingUp, label: 'Bid Leveling & Forecasts', page: 'Phase2Operations' },
      { icon: Building2, label: 'Enterprise Integrations', page: 'Phase3Operations' },
      { icon: Bot, label: 'AI Governance & Automation', page: 'Phase4AIAutomation' },
      { icon: Building2, label: 'Platform & Tenant Control', page: 'Phase5PlatformScale' },
      { icon: Wrench, label: 'Reliability & Support Ops', page: 'Phase6ReliabilityOps' },
    ]
  },
  {
    title: 'Resources',
    items: [
      { icon: Video, label: 'Training & Support', page: 'PMSetupGuide' },
      { icon: Book, label: 'Knowledge Base', page: 'PMSetupGuide' },
      { icon: Building2, label: "Who's Behind It", page: 'Home' },
    ]
  }
];


export default function MegaMenu({ isOpen, onClose }) {
  useEffect(() => {
    if (!isOpen) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 z-40 bg-black/20"
        aria-hidden="true"
        onClick={onClose}
      />
      
      {/* Mega Menu */}
      <div className="fixed left-4 right-4 top-20 z-50 bg-gold-sidebar/95 backdrop-blur-xl border border-black/10 rounded-3xl shadow-2xl lg:left-80 max-h-[calc(100vh-120px)] overflow-y-auto no-scrollbar animate-slide-up" role="dialog" aria-modal="true" aria-label="Quick access navigation">
        <div className="p-8 sm:p-10">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Quick Access</h2>
              <p className="text-sm text-slate-800 font-bold opacity-70">Navigate through all ConstructFlow Pro modules</p>
            </div>
            <button onClick={onClose} className="h-10 w-10 rounded-full bg-black/10 flex items-center justify-center text-slate-900 hover:bg-black/20 transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-10 gap-y-12">
            {menuSections.map((section, idx) => (
              <div key={idx} className="min-w-0">
                <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-900" />
                  {section.title}
                </h3>
                <ul className="space-y-1">
                  {section.items.map((item, itemIdx) => {
                    const Icon = item.icon;
                    return (
                      <li key={itemIdx}>
                        <Link
                          to={createPageUrl(item.page)}
                          onClick={onClose}
                          className="flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-slate-800 hover:text-slate-950 hover:bg-black/5 rounded-xl transition-all group"
                        >
                          <div className="h-8 w-8 rounded-lg bg-black/5 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-amber-400 transition-colors">
                            <Icon className="h-4 w-4" />
                          </div>
                          <span className="truncate">{item.label}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}