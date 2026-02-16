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
  Wrench,
  X
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
        className="fixed inset-0 z-40 bg-black/50"
        aria-hidden="true"
        onClick={onClose}
      />
      
      {/* Mega Menu - Mobile optimized */}
      <div className="fixed left-0 right-0 top-14 sm:top-16 lg:left-64 lg:right-auto z-50 bg-white border-b lg:border-r border-slate-200 max-h-[calc(100vh-3.5rem)] sm:max-h-[calc(100vh-4rem)] overflow-y-auto" role="dialog" aria-modal="true" aria-label="Quick access navigation">
        <div className="p-2 sm:p-3 lg:p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-2 sm:mb-3 pb-2 sm:pb-3 border-b border-slate-200 lg:mb-4">
            <h2 className="text-sm sm:text-base lg:text-lg font-bold text-slate-900">Quick Access</h2>
            <button onClick={onClose} className="h-8 w-8 lg:hidden rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-600">
              <X className="h-4 w-4" />
            </button>
          </div>
          
          {/* Menu Grid - Responsive columns */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-1 sm:gap-1.5">
            {menuSections.map((section, idx) => (
              <div key={idx} className="min-w-0">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 pl-1 hidden sm:block lg:block">{section.title}</h3>
                <div className="space-y-0.5">
                  {section.items.map((item, itemIdx) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={itemIdx}
                        to={createPageUrl(item.page)}
                        onClick={onClose}
                        className="flex flex-col sm:flex-row lg:flex-row items-center sm:items-center gap-1.5 sm:gap-2 px-1.5 sm:px-2 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all group"
                      >
                        <div className="h-6 w-6 sm:h-7 sm:w-7 rounded-md bg-slate-100 flex items-center justify-center group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors flex-shrink-0">
                          <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </div>
                        <span className="text-center sm:text-left truncate text-xs sm:text-sm">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}