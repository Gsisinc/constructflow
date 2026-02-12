import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { PAGES } from '@/pages.config';
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
      { icon: TrendingUp, label: 'Phase 2 Ops', page: 'Phase2Operations' },
      { icon: Building2, label: 'Phase 3 Hub', page: 'Phase3Operations' },
      { icon: Bot, label: 'Phase 4 AI', page: 'Phase4AIAutomation' },
      { icon: Building2, label: 'Phase 5 Scale', page: 'Phase5PlatformScale' },
      { icon: Wrench, label: 'Phase 6 Ops', page: 'Phase6ReliabilityOps' },
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
      <div className="fixed left-0 right-0 top-16 z-50 bg-white border-b border-slate-200 shadow-xl lg:left-64 max-h-[80vh] overflow-y-auto" role="dialog" aria-modal="true" aria-label="Quick access navigation">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 sm:py-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
            {menuSections.map((section, idx) => (
              <div key={idx} className="min-w-0">
                <h3 className="text-xs sm:text-sm font-semibold text-slate-900 mb-2 pb-1.5 border-b border-amber-400 truncate">
                  {section.title}
                </h3>
                <ul className="space-y-0.5 sm:space-y-1">
                  {section.items.filter((item) => Boolean(PAGES[item.page])).map((item, itemIdx) => {
                    const Icon = item.icon;
                    return (
                      <li key={itemIdx}>
                        <Link
                          to={createPageUrl(item.page)}
                          onClick={onClose}
                          className="flex items-center gap-1.5 sm:gap-2 px-1.5 sm:px-2 py-1 sm:py-1.5 text-xs sm:text-sm text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors group"
                        >
                          <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-400 group-hover:text-amber-600 flex-shrink-0" />
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