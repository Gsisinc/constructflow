import React, { useEffect } from 'react';
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
  X
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
    title: 'Project Management',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', page: 'Dashboard' },
      { icon: FileText, label: 'Daily Log', page: 'DailyLog' },
      { icon: Clock, label: 'Time Cards', page: 'TimeCards' },
      { icon: Calendar, label: 'Schedules', page: 'Calendar' },
      { icon: Bot, label: 'Scheduling AI', page: 'SchedulingAI' },
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
      { icon: FileText, label: 'AIA Billing (G702/G703)', page: 'AIABilling' },
      { icon: FileText, label: 'Bill Approvals', page: 'BillApprovals' },
      { icon: TrendingUp, label: 'Financial Projections', page: 'Budget' },
      { icon: FileStack, label: 'Change Orders', page: 'Budget' },
    ]
  },
  {
    title: 'Estimating & Proposals',
    items: [
      { icon: FileText, label: 'Cost Library', page: 'CostLibrary' },
      { icon: FileText, label: 'AI Estimate Generator', page: 'EstimateGenerator' },
      { icon: MessageSquare, label: 'Send Text Messages', page: 'TextMessages' },
      { icon: FileText, label: 'E-signatures', page: 'ESignatures' },
    ]
  },
  {
    title: 'Financial Management',
    items: [
      { icon: FileText, label: 'Invoices', page: 'Invoices' },
      { icon: DollarSign, label: 'Bill Approvals', page: 'BillApprovals' },
      { icon: TrendingUp, label: 'Job Costing (WIP)', page: 'JobCosting' },
      { icon: FileText, label: 'AIA Billing (G702/G703)', page: 'AIABilling' },
      { icon: FileStack, label: 'Cost Plus Invoicing', page: 'CostPlusInvoicing' },
      { icon: Building2, label: 'QuickBooks Sync', page: 'QuickBooksSync' },
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
      { icon: MessageSquare, label: 'Support Channels', page: 'SupportChannels' },
      { icon: Radio, label: "What's New", page: 'Dashboard' },
      { icon: MessageSquare, label: 'Make a Suggestion', page: 'Settings' },
      { icon: Bot, label: 'AI Agents', page: 'AIAgents' },
      { icon: Settings, label: 'Role Permissions', page: 'RolePermissions' },
      { icon: FileStack, label: 'Audit Trail', page: 'AuditTrail' },
      { icon: Wrench, label: 'Service Desk', page: 'ServiceDesk' },
      { icon: Building2, label: 'Implementation', page: 'Implementation' },
      { icon: Video, label: 'Ongoing Training', page: 'OngoingTraining' },
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

export default function MegaMenu({ isOpen, onClose, userRole }) {
  useEffect(() => {
    if (!isOpen) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Base44 only has user/admin: we map to technician | client | admin. Default to tech menu when role not yet loaded.
  const sections = userRole === 'admin' ? menuSections : userRole === 'client' ? clientMenuSections : technicianMenuSections;
  const subtitle = userRole === 'admin' ? 'Navigate to any feature across the platform' : userRole === 'client' ? 'Projects and support' : 'Your tools, schedule, and support';

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 z-40 bg-black/50"
        aria-hidden="true"
        onClick={onClose}
      />
      
      {/* Mega Menu - Professional Design */}
      <div className="fixed left-0 right-0 top-14 sm:top-16 lg:left-64 lg:right-0 z-50 bg-white border-b border-slate-200 max-h-[calc(100vh-3.5rem)] sm:max-h-[calc(100vh-4rem)] overflow-y-auto shadow-2xl" role="dialog" aria-modal="true" aria-label="Quick access navigation">
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Quick Access</h2>
              <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
            </div>
            <button 
              onClick={onClose} 
              className="h-10 w-10 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all active:scale-95"
              title="Close menu"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          
          {/* Menu Grid - Professional card layout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {sections.map((section, idx) => (
              <div key={idx} className="bg-slate-50 rounded-lg p-3 border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all">
                <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">{section.title}</h3>
                <div className="space-y-1">
                  {section.items.map((item, itemIdx) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={itemIdx}
                        to={createPageUrl(item.page)}
                        onClick={onClose}
                        className="flex items-center gap-2 px-2 py-1.5 text-xs font-medium text-slate-700 hover:text-blue-600 hover:bg-white rounded-md transition-all group"
                      >
                        <div className="h-5 w-5 rounded-md bg-slate-200 flex items-center justify-center group-hover:bg-blue-200 group-hover:text-blue-600 transition-colors flex-shrink-0">
                          <Icon className="h-3 w-3" />
                        </div>
                        <span className="truncate">{item.label}</span>
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
