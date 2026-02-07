import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  LayoutDashboard,
  Clock,
  FileText,
  AlertTriangle,
  Package,
  CheckSquare,
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
  CreditCard,
  Smartphone,
  Video,
  Building2,
  Search,
  Bot
} from 'lucide-react';

const menuSections = [
  {
    title: 'Project Management',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', page: 'Dashboard' },
      { icon: FileText, label: 'Daily Log', page: 'DailyLog' },
      { icon: Clock, label: 'Time Cards', page: 'TimeCards' },
      { icon: MessageSquare, label: "RFI's", page: 'RFIs' },
      { icon: Package, label: 'Work Orders', page: 'WorkOrders' },
      { icon: FileStack, label: 'Submittals', page: 'Submittals' },
      { icon: CheckSquare, label: 'To Do Lists', page: 'Tasks' },
      { icon: AlertTriangle, label: 'Issues', page: 'Issues' },
    ]
  },
  {
    title: 'Financials',
    items: [
      { icon: DollarSign, label: 'Overview', page: 'Budget' },
      { icon: FileText, label: 'Estimates', page: 'Estimates' },
      { icon: TrendingUp, label: 'Bids', page: 'Bids' },
      { icon: DollarSign, label: 'Budget', page: 'Budget' },
      { icon: FileStack, label: 'Change Orders', page: 'ChangeOrders' },
      { icon: TrendingUp, label: 'Forecasts', page: 'Budget' },
      { icon: Package, label: 'Purchase Orders', page: 'PurchaseOrders' },
      { icon: FileText, label: 'Invoice', page: 'Invoices' },
    ]
  },
  {
    title: 'People',
    items: [
      { icon: Users, label: 'Directory', page: 'Directory' },
      { icon: Search, label: 'Opportunities', page: 'BidDiscovery' },
      { icon: Clock, label: 'Time Cards', page: 'TimeCards' },
      { icon: Camera, label: 'Photos', page: 'Photos' },
      { icon: Calendar, label: 'Calendar', page: 'Calendar' },
      { icon: Bot, label: 'AI Agents', page: 'AIAgents' },
    ]
  },
  {
    title: 'Documents',
    items: [
      { icon: Camera, label: 'Photos', page: 'Photos' },
      { icon: FolderOpen, label: 'Files', page: 'Documents' },
      { icon: FileImage, label: 'Plans & Drawings', page: 'Drawings' },
      { icon: Book, label: 'Reports', page: 'Reports' },
      { icon: FileStack, label: 'Submittals', page: 'Submittals' },
      { icon: Package, label: 'Equipment Logs', page: 'EquipmentLogs' },
    ]
  },
  {
    title: 'Settings & Support',
    items: [
      { icon: Settings, label: 'Settings', page: 'Settings' },
      { icon: HelpCircle, label: 'Help & Support', page: 'Support' },
      { icon: CreditCard, label: 'Billing/License', page: 'Billing' },
      { icon: Smartphone, label: 'Mobile App', page: 'MobileApp' },
      { icon: Video, label: 'Training Videos', page: 'Training' },
      { icon: Building2, label: 'Organization', page: 'Settings' },
    ]
  }
];

export default function MegaMenu({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 z-40 bg-black/20"
        onClick={onClose}
      />
      
      {/* Mega Menu */}
      <div className="fixed left-0 right-0 top-16 z-50 bg-white border-b border-slate-200 shadow-xl">
        <div className="max-w-7xl mx-auto px-8 py-8">
          <div className="grid grid-cols-5 gap-8">
            {menuSections.map((section, idx) => (
              <div key={idx}>
                <h3 className="text-sm font-semibold text-slate-900 mb-4 pb-2 border-b-2 border-amber-400">
                  {section.title}
                </h3>
                <ul className="space-y-2">
                  {section.items.map((item, itemIdx) => {
                    const Icon = item.icon;
                    return (
                      <li key={itemIdx}>
                        <Link
                          to={createPageUrl(item.page)}
                          onClick={onClose}
                          className="flex items-center gap-2 px-2 py-1.5 text-sm text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors group"
                        >
                          <Icon className="h-4 w-4 text-slate-400 group-hover:text-amber-600" />
                          {item.label}
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