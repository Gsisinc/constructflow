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
      { icon: Building2, label: 'Projects', page: 'Projects' },
      { icon: CheckSquare, label: 'Tasks', page: 'Tasks' },
      { icon: AlertTriangle, label: 'Issues', page: 'Issues' },
      { icon: Clock, label: 'Time Cards', page: 'TimeCards' },
      { icon: Calendar, label: 'Calendar', page: 'Calendar' },
      { icon: Users, label: 'Team', page: 'Team' },
    ]
  },
  {
    title: 'Business Development',
    items: [
      { icon: Search, label: 'Bid Discovery', page: 'BidDiscovery' },
      { icon: FileText, label: 'Bid Opportunities', page: 'BidOpportunities' },
      { icon: TrendingUp, label: 'Bids & Proposals', page: 'Bids' },
      { icon: DollarSign, label: 'Estimates', page: 'Estimates' },
      { icon: Bot, label: 'AI Agents', page: 'AIAgents' },
    ]
  },
  {
    title: 'Financials',
    items: [
      { icon: DollarSign, label: 'Budget', page: 'Budget' },
      { icon: FileStack, label: 'Change Orders', page: 'ChangeOrders' },
      { icon: Package, label: 'Purchase Orders', page: 'PurchaseOrders' },
      { icon: Package, label: 'Materials', page: 'Materials' },
      { icon: TrendingUp, label: 'Forecasts', page: 'Budget' },
    ]
  },
  {
    title: 'People & Resources',
    items: [
      { icon: Users, label: 'Directory', page: 'Directory' },
      { icon: Clock, label: 'Time Cards', page: 'TimeCards' },
      { icon: Package, label: 'Equipment', page: 'EquipmentLogs' },
      { icon: Users, label: 'Team Management', page: 'Team' },
    ]
  },
  {
    title: 'Settings',
    items: [
      { icon: Settings, label: 'Settings', page: 'Settings' },
      { icon: Building2, label: 'Organization', page: 'Settings' },
      { icon: Bot, label: 'AI Agents', page: 'AIAgents' },
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