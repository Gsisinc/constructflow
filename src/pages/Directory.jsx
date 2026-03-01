import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Search, UserPlus, Users, Star, Trash2, Plus, X } from 'lucide-react';

export default function Directory() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [newCategoryName, setNewCategoryName] = useState('');
  
  // Local state for categories and workers
  const [categories, setCategories] = useState([
    { id: 1, name: 'Employees' },
    { id: 2, name: 'Contractors' },
    { id: 3, name: 'Suppliers' }
  ]);
  
  const [workers, setWorkers] = useState([
    { id: 1, name: 'John Smith', email: 'john@example.com', phone: '(555) 123-4567', company: 'GSIS', category: 'Employees' },
    { id: 2, name: 'Jane Doe', email: 'jane@example.com', phone: '(555) 234-5678', company: 'Tech Solutions', category: 'Contractors' }
  ]);
  
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', company: '', category: 'Employees' });

  // Add visual indicator for selected category
  const isAllSelected = selectedCategory === 'all';

  // Filter workers
  const filteredWorkers = workers.filter(w => {
    const matchesCategory = selectedCategory === 'all' || w.category === selectedCategory;
    
    // If no search term, show all contacts in the selected category
    if (!searchTerm.trim()) {
      return matchesCategory;
    }
    
    // If search term exists, filter by both category and search
    const matchesSearch = w.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.company?.toLowerCase().includes(searchTerm.toLowerCase());
    
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
    
    const newWorker = {
      id: Date.now(),
      ...formData
    };
    
    setWorkers([...workers, newWorker]);
    setShowAddDialog(false);
    setFormData({ name: '', email: '', phone: '', company: '', category: 'Employees' });
    alert('Contact added successfully!');
  };

  const handleDeleteContact = async (worker) => {
    if (!window.confirm(`Delete contact ${worker.name || 'this contact'}?`)) return;
    setWorkers(workers.filter(w => w.id !== worker.id));
    alert('Contact deleted successfully!');
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) {
      alert('Please enter a category name');
      return;
    }
    
    // Check if category already exists
    if (categories.some(c => c.name.toLowerCase() === newCategoryName.toLowerCase())) {
      alert('This category already exists');
      return;
    }
    
    const newCategory = {
      id: Date.now(),
      name: newCategoryName
    };
    
    setCategories([...categories, newCategory]);
    setNewCategoryName('');
    setShowCategoryDialog(false);
    alert('Category created successfully!');
  };

  const handleDeleteCategory = async (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    if (!window.confirm(`Delete category "${category.name}"?`)) return;
    
    // Check if category has workers
    const hasWorkers = workers.some(w => w.category === category.name);
    if (hasWorkers) {
      alert('Cannot delete category with assigned contacts. Please reassign contacts first.');
      return;
    }
    
    setCategories(categories.filter(c => c.id !== categoryId));
    alert('Category deleted successfully!');
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
              <Button type="submit" className="w-full sm:w-auto">
                Add Contact
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
                  <Button type="submit" className="w-full sm:w-auto">
                    Create Category
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent className="space-y-2">
            <div 
              className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-2 rounded cursor-pointer ${
                isAllSelected ? 'bg-accent text-white' : 'hover:bg-slate-100'
              }`}
              onClick={() => setSelectedCategory('all')}
            >
              <span className="text-sm font-medium">All Contacts</span>
              <Badge variant={isAllSelected ? 'default' : 'outline'}>{workers.length}</Badge>
            </div>
            {categories.map(cat => (
              <div 
                key={cat.id}
                className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-2 rounded hover:bg-slate-100 group"
              >
                <div 
                  className={`flex-1 cursor-pointer p-2 rounded ${
                    selectedCategory === cat.name ? 'bg-accent text-white' : ''
                  }`}
                  onClick={() => setSelectedCategory(cat.name)}
                >
                  <span className="text-sm font-medium">{cat.name}</span>
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
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-red-600" onClick={() => handleDeleteContact(worker)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <div className="text-xs text-slate-600 flex gap-2">
                    <span className="flex-1 truncate">{worker.phone || '-'}</span>
                    <span className="flex-1 truncate">{worker.email}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-400">
                <p>No contacts found</p>
              </div>
            )}
          </div>

          {/* Desktop View */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-slate-700">Name</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-700">Email</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-700">Phone</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-700">Company</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-700">Category</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-700">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredWorkers.length > 0 ? (
                  filteredWorkers.map((worker) => (
                    <tr key={worker.id} className="border-b border-slate-200 hover:bg-slate-50">
                      <td className="px-4 py-3">{worker.name}</td>
                      <td className="px-4 py-3">{worker.email}</td>
                      <td className="px-4 py-3">{worker.phone || '-'}</td>
                      <td className="px-4 py-3">{worker.company || '-'}</td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary">{worker.category}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600" onClick={() => handleDeleteContact(worker)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-4 py-8 text-center text-slate-400">
                      No contacts found
                    </td>
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
