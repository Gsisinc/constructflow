import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  FileText,
  Download,
  Lock,
  Eye,
  Share2,
  Trash2,
  Upload,
  Search,
  Filter,
  Calendar,
  User,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function ClientDocumentAccess() {
  const [documents] = useState([
    {
      id: 'DOC-001',
      name: 'Project Charter.pdf',
      category: 'Project Documentation',
      uploadedBy: 'John Smith',
      uploadedDate: new Date('2024-01-15'),
      size: '2.4 MB',
      status: 'approved',
      accessLevel: 'view',
      description: 'Initial project charter and scope document'
    },
    {
      id: 'DOC-002',
      name: 'Design Plans - Phase 1.pdf',
      category: 'Design Documents',
      uploadedBy: 'Sarah Johnson',
      uploadedDate: new Date('2024-02-01'),
      size: '8.7 MB',
      status: 'approved',
      accessLevel: 'view',
      description: 'Architectural and engineering design plans for Phase 1'
    },
    {
      id: 'DOC-003',
      name: 'Budget Breakdown.xlsx',
      category: 'Financial Documents',
      uploadedBy: 'Mike Davis',
      uploadedDate: new Date('2024-01-20'),
      size: '1.2 MB',
      status: 'approved',
      accessLevel: 'view',
      description: 'Detailed project budget breakdown by category'
    },
    {
      id: 'DOC-004',
      name: 'Change Order #1.pdf',
      category: 'Change Orders',
      uploadedBy: 'John Smith',
      uploadedDate: new Date('2024-03-10'),
      size: '0.8 MB',
      status: 'pending-approval',
      accessLevel: 'view',
      description: 'Change order for scope modification'
    },
    {
      id: 'DOC-005',
      name: 'Monthly Progress Report - March.pdf',
      category: 'Reports',
      uploadedBy: 'Sarah Johnson',
      uploadedDate: new Date('2024-04-01'),
      size: '3.1 MB',
      status: 'approved',
      accessLevel: 'view',
      description: 'Monthly progress report for March 2024'
    },
    {
      id: 'DOC-006',
      name: 'Safety Plan.pdf',
      category: 'Safety Documents',
      uploadedBy: 'Mike Davis',
      uploadedDate: new Date('2024-01-10'),
      size: '1.9 MB',
      status: 'approved',
      accessLevel: 'view',
      description: 'Site safety plan and procedures'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const categories = ['Project Documentation', 'Design Documents', 'Financial Documents', 'Change Orders', 'Reports', 'Safety Documents'];

  const statusOptions = [
    { value: 'approved', label: 'Approved', color: 'bg-green-100 text-green-800' },
    { value: 'pending-approval', label: 'Pending Approval', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'draft', label: 'Draft', color: 'bg-slate-100 text-slate-800' }
  ];

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || doc.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || doc.status === filterStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getStatusBadge = (status) => {
    const option = statusOptions.find(s => s.value === status);
    return option || { label: status, color: 'bg-slate-100 text-slate-800' };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileText className="w-8 h-8 text-blue-600" />
            Project Documents
          </h1>
          <p className="text-slate-600 mt-1">Secure access to all project files and documentation</p>
        </div>
        <Button className="gap-2">
          <Lock className="w-4 h-4" />
          Security Info
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search documents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="gap-2"
                  prefix={<Search className="w-4 h-4" />}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Category</label>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Status</label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    {statusOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button variant="outline" className="w-full gap-2">
                  <Filter className="w-4 h-4" />
                  More Filters
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents List */}
      <div className="space-y-3">
        {filteredDocuments.map((doc) => {
          const statusBadge = getStatusBadge(doc.status);
          return (
            <Card key={doc.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg">{doc.name}</h3>
                        <Badge className={statusBadge.color}>
                          {statusBadge.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600 mb-2">{doc.description}</p>
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {doc.uploadedBy}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {doc.uploadedDate.toLocaleDateString()}
                        </span>
                        <span>{doc.size}</span>
                        <span className="bg-slate-100 px-2 py-1 rounded">{doc.category}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Button variant="outline" size="sm" className="gap-2">
                      <Eye className="w-4 h-4" />
                      View
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Download className="w-4 h-4" />
                      Download
                    </Button>
                    {doc.status === 'pending-approval' && (
                      <Button size="sm" className="gap-2 bg-green-600 hover:bg-green-700">
                        <CheckCircle2 className="w-4 h-4" />
                        Approve
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredDocuments.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="pt-12 pb-12 text-center">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600">No documents found matching your filters</p>
          </CardContent>
        </Card>
      )}

      {/* Security Information */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-blue-600" />
            Document Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>✓ All documents are encrypted in transit and at rest</p>
          <p>✓ Access is logged and tracked for audit purposes</p>
          <p>✓ Downloads are watermarked with your user information</p>
          <p>✓ Documents expire after 90 days unless renewed</p>
        </CardContent>
      </Card>
    </div>
  );
}
