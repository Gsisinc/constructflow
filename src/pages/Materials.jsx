import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import EmptyState from '../components/ui/EmptyState';
import { TableSkeleton } from '@/components/skeleton/SkeletonComponents';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  Plus,
  Search,
  Package,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

const CATEGORIES = [
  { value: 'concrete', label: 'Concrete' },
  { value: 'steel', label: 'Steel' },
  { value: 'lumber', label: 'Lumber' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'plumbing', label: 'Plumbing' },
  { value: 'hvac', label: 'HVAC' },
  { value: 'finishing', label: 'Finishing' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'safety', label: 'Safety' },
  { value: 'other', label: 'Other' },
];

const categoryColors = {
  concrete: 'bg-slate-100 text-slate-700',
  steel: 'bg-zinc-100 text-zinc-700',
  lumber: 'bg-amber-100 text-amber-700',
  electrical: 'bg-yellow-100 text-yellow-700',
  plumbing: 'bg-blue-100 text-blue-700',
  hvac: 'bg-cyan-100 text-cyan-700',
  finishing: 'bg-purple-100 text-purple-700',
  equipment: 'bg-orange-100 text-orange-700',
  safety: 'bg-red-100 text-red-700',
  other: 'bg-gray-100 text-gray-700',
};

export default function Materials() {
  const [showForm, setShowForm] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const queryClient = useQueryClient();

  const { data: materials = [], isLoading } = useQuery({
    queryKey: ['materials'],
    queryFn: () => base44.entities.Material.list('-created_date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Material.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      setShowForm(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Material.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      setShowForm(false);
      setEditingMaterial(null);
    },
  });

  const filteredMaterials = materials.filter((material) => {
    const matchesSearch = material.name?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || material.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const lowStockItems = materials.filter(m => m.quantity_in_stock <= m.minimum_stock);
  const totalValue = materials.reduce((sum, m) => sum + ((m.quantity_in_stock || 0) * (m.unit_price || 0)), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Materials</h1>
          <p className="text-slate-500 mt-1">Track inventory and material costs</p>
        </div>
        <Button onClick={() => { setEditingMaterial(null); setShowForm(true); }} className="bg-slate-900 hover:bg-slate-800">
          <Plus className="h-4 w-4 mr-2" />
          Add Material
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Total Items</p>
              <p className="text-2xl font-semibold mt-1">{materials.length}</p>
            </div>
            <div className="p-3 rounded-xl bg-blue-100">
              <Package className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Inventory Value</p>
              <p className="text-2xl font-semibold mt-1">${totalValue.toLocaleString()}</p>
            </div>
            <div className="p-3 rounded-xl bg-green-100">
              <Package className="h-5 w-5 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Low Stock Alerts</p>
              <p className={cn(
                "text-2xl font-semibold mt-1",
                lowStockItems.length > 0 ? "text-red-600" : "text-slate-900"
              )}>
                {lowStockItems.length}
              </p>
            </div>
            <div className={cn(
              "p-3 rounded-xl",
              lowStockItems.length > 0 ? "bg-red-100" : "bg-slate-100"
            )}>
              <AlertCircle className={cn(
                "h-5 w-5",
                lowStockItems.length > 0 ? "text-red-600" : "text-slate-400"
              )} />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search materials..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.map(c => (
              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Materials Table */}
      <>{
isLoading ? <TableSkeleton />:
        <div className="space-y-4">
          {Array(5).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : filteredMaterials.length === 0 ? (
        <EmptyState
          icon={Package}
          title={search || categoryFilter !== 'all' ? 'No materials found' : 'No materials yet'}
          description="Start tracking your inventory"
          actionLabel={!search && categoryFilter === 'all' ? 'Add Material' : null}
          onAction={() => setShowForm(true)}
        />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Material</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Unit Price</TableHead>
                <TableHead>In Stock</TableHead>
                <TableHead>Min Stock</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Supplier</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMaterials.map((material) => {
                const isLowStock = material.quantity_in_stock <= material.minimum_stock;
                const value = (material.quantity_in_stock || 0) * (material.unit_price || 0);
                return (
                  <TableRow
                    key={material.id}
                    className="cursor-pointer hover:bg-slate-50"
                    onClick={() => { setEditingMaterial(material); setShowForm(true); }}
                  >
                    <TableCell>
                      <div>
                        <p className="font-medium">{material.name}</p>
                        <p className="text-xs text-slate-500">{material.unit}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={categoryColors[material.category]}>
                        {material.category}
                      </Badge>
                    </TableCell>
                    <TableCell>${(material.unit_price || 0).toFixed(2)}</TableCell>
                    <TableCell>
                      <span className={cn(isLowStock && "text-red-600 font-medium")}>
                        {material.quantity_in_stock || 0}
                      </span>
                    </TableCell>
                    <TableCell>{material.minimum_stock || 0}</TableCell>
                    <TableCell>${value.toLocaleString()}</TableCell>
                    <TableCell className="text-slate-500">{material.supplier || '-'}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Material Form Dialog */}
      <MaterialFormDialog
        open={showForm}
        onOpenChange={(open) => { setShowForm(open); if (!open) setEditingMaterial(null); }}
        material={editingMaterial}
        onSubmit={(data) => {
          if (editingMaterial) {
            updateMutation.mutate({ id: editingMaterial.id, data });
          } else {
            createMutation.mutate(data);
          }
        }}
        loading={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}

function MaterialFormDialog({ open, onOpenChange, material, onSubmit, loading }) {
  const [formData, setFormData] = useState(material || {
    name: '',
    category: 'other',
    unit: '',
    unit_price: '',
    quantity_in_stock: '',
    minimum_stock: '',
    supplier: '',
  });

  React.useEffect(() => {
    if (material) {
      setFormData(material);
    } else {
      setFormData({
        name: '',
        category: 'other',
        unit: '',
        unit_price: '',
        quantity_in_stock: '',
        minimum_stock: '',
        supplier: '',
      });
    }
  }, [material]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      unit_price: formData.unit_price ? parseFloat(formData.unit_price) : null,
      quantity_in_stock: formData.quantity_in_stock ? parseFloat(formData.quantity_in_stock) : 0,
      minimum_stock: formData.minimum_stock ? parseFloat(formData.minimum_stock) : 0,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{material ? 'Edit Material' : 'Add Material'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Material Name *</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter material name"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Unit *</Label>
              <Input
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                placeholder="e.g., cubic yards, tons"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Unit Price ($)</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.unit_price}
                onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label>In Stock</Label>
              <Input
                type="number"
                value={formData.quantity_in_stock}
                onChange={(e) => setFormData({ ...formData, quantity_in_stock: e.target.value })}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label>Min Stock</Label>
              <Input
                type="number"
                value={formData.minimum_stock}
                onChange={(e) => setFormData({ ...formData, minimum_stock: e.target.value })}
                placeholder="0"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Supplier</Label>
            <Input
              value={formData.supplier}
              onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
              placeholder="Supplier name"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-slate-900 hover:bg-slate-800">
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {material ? 'Update' : 'Add'} Material
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}