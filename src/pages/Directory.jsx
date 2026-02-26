import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Search, UserPlus, Users, Building2, Star, Trash2, Plus, X } from 'lucide-react';

export default function Directory() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', company: '', category: 'Employees' });
  const queryClient = useQueryClient();

  // Fetch workers
  const { data: workers = [] } = useQuery({
    queryKey: ['workers'],
    queryFn: () => base44.entities.Worker.list('-created_date')
  });

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['contactCategories'],
    queryFn: async () => {
      try {
        const result = await base44.entities.ContactCategory.list();
        return result || [];
      } catch (error) {
        console.error('Error fetching categories:', error);
        return [];
      }
    }
  });

  // Create worker mutation
  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Worker.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workers'] });
      setShowAddDialog(false);
      setFormData({ name: '', email: '', phone: '', company: '', category: 'Employees' });
    }
  });

  // Delete worker mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Worker.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workers'] });
    }
  });

  // Create category mutation
  const createCategoryMutation = useMutation({
    mutationFn: (name) => base44.entities.ContactCategory.create({ name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contactCategories'] });
      setNewCategoryName('');
      setShowCategoryDialog(false);
    }
  });

  // Delete category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: (id) => base44.entities.ContactCategory.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contactCategories'] });
    }
  });

  // Filter workers
  const filteredWorkers = workers.filter(w => {
    const matchesSearch = w.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.company?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || w.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Get category counts
  const getCategoryCount = (categoryName) => {
    return workers.filter(w => w.category === categoryName).length;
  };

  const handleAddContact = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      alert('Please fill in name and email');
      return;
    }
    try {
      await createMutation.mutateAsync(formData);
    } catch (error) {
      alert(error?.message || 'Failed to add contact');
    }
  };

  const handleDeleteContact = async (worker) => {
    if (!window.confirm(`Delete contact ${worker.name || 'this contact'}?`)) return;
    try {
      await deleteMutation.mutateAsync(worker.id);
    } catch (error) {
      console.error(error);
      alert(error?.message || 'Failed to delete contact');
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) {
      alert('Please enter a category name');
      return;
    }
    try {
      await createCategoryMutation.mutateAsync(newCategoryName);
    } catch (error) {
      alert(error?.message || 'Failed to add category');
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!window.confirm('Delete this category?')) return;
    try {
      await deleteCategoryMutation.mutateAsync(categoryId);
    } catch (error) {
      alert(error?.message || 'Failed to delete category');
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-lg sm:text-xl md:text-2xl font-semibold text-slate-900 break-words">Directory</h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5 sm:mt-1">Manage your team and contacts</p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="bg-amber-600 hover:bg-amber-700 min-h-[44px] text-sm select-none">
              <UserPlus className="h-4 w-4 mr-1.5 sm:mr-2" />
              <span className="hidden sm:inline">Add Contact</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Contact</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddContact} className="space-y-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input
                  placeholder="Contact name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input
                  type="email"
                  placeholder="email@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  placeholder="(123) 456-7890"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Company</Label>
                <Input
                  placeholder="Company name"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full sm:w-auto" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Adding...' : 'Add Contact'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 text-sm min-h-[44px]"
          />
        </div>
        <Button variant="outline" className="hidden sm:flex">Filter</Button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-2.5 sm:p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-2">
          <Users className="h-4 sm:h-5 w-4 sm:w-5 text-blue-600 flex-shrink-0" />
          <span className="text-xs sm:text-sm text-blue-900">
            <strong>{workers.length}</strong> Total Contacts | <strong>{categories.length}</strong> Categories
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 md:grid-cols-1 sm:grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Contact Categories</CardTitle>
            <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
              <DialogTrigger asChild>
                <Button size="icon" variant="ghost" className="h-6 w-6">
                  <Plus className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add New Category</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddCategory} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Category Name *</Label>
                    <Input
                      placeholder="e.g., Subcontractors, Suppliers, etc."
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full sm:w-auto" disabled={createCategoryMutation.isPending}>
                    {createCategoryMutation.isPending ? 'Creating...' : 'Create Category'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent className="space-y-2">
            <div 
              className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-2 rounded cursor-pointer hover:bg-slate-100"
              onClick={() => setSelectedCategory('all')}
            >
              <span className="text-sm font-medium">All Contacts</span>
              <Badge variant="outline">{workers.length}</Badge>
            </div>
            {categories.map(cat => (
              <div 
                key={cat.id}
                className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-2 rounded hover:bg-slate-100 group"
              >
                <div 
                  className="flex-1 cursor-pointer"
                  onClick={() => setSelectedCategory(cat.name)}
                >
                  <span className="text-sm">{cat.name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Badge variant="outline" className="text-xs">{getCategoryCount(cat.name)}</Badge>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-5 w-5 text-red-600 opacity-0 group-hover:opacity-100"
                    onClick={() => handleDeleteCategory(cat.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Certificates Expiring (Within 60 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-8 text-slate-400">
              <p>No Records Available</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Upcoming Days Off</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-8 text-slate-400">
              <p>No Records Available</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-amber-100">
        <CardContent className="p-0">
          {/* Mobile View */}
          <div className="sm:hidden space-y-2 p-3">
            {filteredWorkers.length > 0 ? (
              filteredWorkers.map((worker) => (
                <div key={worker.id} className="border-b border-amber-100 pb-2.5 last:border-0">
                  <div className="flex items-start gap-2 mb-1.5">
                    <div className="h-7 w-7 rounded-full bg-amber-200 flex items-center justify-center text-xs font-medium flex-shrink-0">
                      {worker.name?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-xs text-slate-900 truncate">{worker.name}</p>
                      <p className="text-xs text-slate-600 truncate">{worker.company || 'Direct'}</p>
                      <p className="text-xs text-slate-500">{worker.category}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      {worker.productivity_score >= 90 && <Star className="h-3.5 w-3.5 text-yellow-500 flex-shrink-0" />}
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-red-600" onClick={() => handleDeleteContact(worker)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <div className="text-xs text-slate-600 flex gap-2">
                    <span className="flex-1 truncate">{worker.phone || '-'}</span>
                    <Badge variant="outline" className="text-xs flex-shrink-0">{worker.company ? 'Contractor' : 'Employee'}</Badge>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-slate-400">No contacts found</div>
            )}
          </div>

          {/* Desktop View */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full sm:w-auto">
              <thead className="bg-amber-50 border-b border-amber-100">
                <tr>
                  <th className="text-left py-2.5 px-3 text-xs font-medium text-slate-600">Company</th>
                  <th className="text-left py-2.5 px-3 text-xs font-medium text-slate-600">Name</th>
                  <th className="text-left py-2.5 px-3 text-xs font-medium text-slate-600">Phone</th>
                  <th className="text-left py-2.5 px-3 text-xs font-medium text-slate-600">Category</th>
                  <th className="text-center py-2.5 px-3 text-xs font-medium text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredWorkers.length > 0 ? (
                  filteredWorkers.map((worker) => (
                    <tr key={worker.id} className="border-b border-amber-100 hover:bg-amber-50">
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5">
                          {worker.company && <Building2 className="h-3 w-3 text-slate-400" />}
                          <span className="font-medium text-xs">{worker.company || '-'}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-amber-200 flex items-center justify-center text-xs font-medium">
                            {worker.name?.[0]}
                          </div>
                          <span className="text-xs">{worker.name}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-xs text-slate-600">{worker.phone || '-'}</td>
                      <td className="py-2.5 px-3">
                        <Badge variant="outline" className="text-xs">{worker.category || 'Uncategorized'}</Badge>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {worker.productivity_score >= 90 && <Star className="h-3.5 w-3.5 text-yellow-500" />}
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-red-600" onClick={() => handleDeleteContact(worker)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-slate-400">No contacts found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
