import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Trash2, Edit2, DollarSign, TrendingUp, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

// Material Inventory Management
export function MaterialInventory() {
  const [materials, setMaterials] = useState([]);
  const [showAddMaterial, setShowAddMaterial] = useState(false);
  const [newMaterial, setNewMaterial] = useState({
    name: '',
    category: 'Lumber',
    unit: 'sq ft',
    unitCost: 0,
    quantity: 0,
    minStock: 10,
    location: ''
  });

  const categories = ['Lumber', 'Concrete', 'Steel', 'Electrical', 'Plumbing', 'HVAC', 'Fasteners', 'Paint', 'Safety'];
  const units = ['sq ft', 'linear ft', 'piece', 'box', 'bag', 'gallon', 'ton', 'bundle'];

  const addMaterial = () => {
    if (!newMaterial.name) {
      toast.error('Please enter material name');
      return;
    }

    setMaterials([...materials, {
      ...newMaterial,
      id: Date.now(),
      totalValue: newMaterial.quantity * newMaterial.unitCost,
      lastRestocked: new Date().toISOString().split('T')[0]
    }]);

    setNewMaterial({
      name: '',
      category: 'Lumber',
      unit: 'sq ft',
      unitCost: 0,
      quantity: 0,
      minStock: 10,
      location: ''
    });
    setShowAddMaterial(false);
    toast.success('Material added');
  };

  const updateMaterial = (id, field, value) => {
    setMaterials(materials.map(m => {
      if (m.id === id) {
        const updated = { ...m, [field]: value };
        if (field === 'quantity' || field === 'unitCost') {
          updated.totalValue = updated.quantity * updated.unitCost;
        }
        return updated;
      }
      return m;
    }));
  };

  const deleteMaterial = (id) => {
    setMaterials(materials.filter(m => m.id !== id));
    toast.success('Material deleted');
  };

  const totalInventoryValue = materials.reduce((sum, m) => sum + m.totalValue, 0);
  const lowStockItems = materials.filter(m => m.quantity <= m.minStock);

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Items</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{materials.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Inventory Value</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              ${totalInventoryValue.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Low Stock Items</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{lowStockItems.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Material List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Material Inventory</CardTitle>
          <Dialog open={showAddMaterial} onOpenChange={setShowAddMaterial}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Material
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add Material</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Material name"
                  value={newMaterial.name}
                  onChange={(e) => setNewMaterial({ ...newMaterial, name: e.target.value })}
                />
                <select
                  className="w-full border rounded px-3 py-2"
                  value={newMaterial.category}
                  onChange={(e) => setNewMaterial({ ...newMaterial, category: e.target.value })}
                >
                  {categories.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <select
                  className="w-full border rounded px-3 py-2"
                  value={newMaterial.unit}
                  onChange={(e) => setNewMaterial({ ...newMaterial, unit: e.target.value })}
                >
                  {units.map(u => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    type="number"
                    placeholder="Unit cost"
                    value={newMaterial.unitCost}
                    onChange={(e) => setNewMaterial({ ...newMaterial, unitCost: parseFloat(e.target.value) || 0 })}
                  />
                  <Input
                    type="number"
                    placeholder="Quantity"
                    value={newMaterial.quantity}
                    onChange={(e) => setNewMaterial({ ...newMaterial, quantity: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <Input
                  type="number"
                  placeholder="Minimum stock level"
                  value={newMaterial.minStock}
                  onChange={(e) => setNewMaterial({ ...newMaterial, minStock: parseFloat(e.target.value) || 0 })}
                />
                <Input
                  placeholder="Storage location"
                  value={newMaterial.location}
                  onChange={(e) => setNewMaterial({ ...newMaterial, location: e.target.value })}
                />
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setShowAddMaterial(false)}>Cancel</Button>
                  <Button onClick={addMaterial}>Add Material</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>

        <CardContent>
          {materials.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              No materials yet. Add items to track inventory.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2">Material</th>
                    <th className="text-left py-2 px-2">Category</th>
                    <th className="text-right py-2 px-2">Qty</th>
                    <th className="text-right py-2 px-2">Unit Cost</th>
                    <th className="text-right py-2 px-2">Value</th>
                    <th className="text-left py-2 px-2">Status</th>
                    <th className="text-right py-2 px-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {materials.map(material => {
                    const isLowStock = material.quantity <= material.minStock;
                    return (
                      <tr key={material.id} className={`border-b ${isLowStock ? 'bg-red-50' : ''}`}>
                        <td className="py-2 px-2 font-medium">{material.name}</td>
                        <td className="py-2 px-2">{material.category}</td>
                        <td className="text-right py-2 px-2">
                          {material.quantity} {material.unit}
                        </td>
                        <td className="text-right py-2 px-2">${material.unitCost.toFixed(2)}</td>
                        <td className="text-right py-2 px-2">${material.totalValue.toLocaleString()}</td>
                        <td className="py-2 px-2">
                          {isLowStock ? (
                            <span className="flex items-center gap-1 text-red-600 text-xs">
                              <AlertCircle className="h-3 w-3" />
                              Low Stock
                            </span>
                          ) : (
                            <span className="text-green-600 text-xs">OK</span>
                          )}
                        </td>
                        <td className="text-right py-2 px-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteMaterial(material.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Vendor Management
export function VendorManagement() {
  const [vendors, setVendors] = useState([]);
  const [showAddVendor, setShowAddVendor] = useState(false);
  const [newVendor, setNewVendor] = useState({
    name: '',
    contact: '',
    phone: '',
    email: '',
    address: '',
    category: 'General',
    paymentTerms: 'Net 30',
    performance: 'Not Rated'
  });

  const categories = ['General', 'Lumber', 'Concrete', 'Electrical', 'Plumbing', 'HVAC', 'Equipment Rental'];
  const paymentTerms = ['Net 15', 'Net 30', 'Net 45', 'Net 60', 'COD', 'Credit Card'];
  const performanceRatings = ['Not Rated', 'Poor', 'Fair', 'Good', 'Excellent'];

  const addVendor = () => {
    if (!newVendor.name || !newVendor.email) {
      toast.error('Please fill in required fields');
      return;
    }

    setVendors([...vendors, {
      ...newVendor,
      id: Date.now(),
      totalSpent: 0,
      lastOrder: null,
      ordersCount: 0
    }]);

    setNewVendor({
      name: '',
      contact: '',
      phone: '',
      email: '',
      address: '',
      category: 'General',
      paymentTerms: 'Net 30',
      performance: 'Not Rated'
    });
    setShowAddVendor(false);
    toast.success('Vendor added');
  };

  const deleteVendor = (id) => {
    setVendors(vendors.filter(v => v.id !== id));
    toast.success('Vendor deleted');
  };

  const getPerformanceColor = (rating) => {
    const colors = {
      'Excellent': 'bg-green-100 text-green-800',
      'Good': 'bg-blue-100 text-blue-800',
      'Fair': 'bg-yellow-100 text-yellow-800',
      'Poor': 'bg-red-100 text-red-800',
      'Not Rated': 'bg-slate-100 text-slate-800'
    };
    return colors[rating] || 'bg-slate-100';
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Vendor Management</CardTitle>
        <Dialog open={showAddVendor} onOpenChange={setShowAddVendor}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Vendor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Vendor</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Vendor name"
                value={newVendor.name}
                onChange={(e) => setNewVendor({ ...newVendor, name: e.target.value })}
              />
              <Input
                placeholder="Contact person"
                value={newVendor.contact}
                onChange={(e) => setNewVendor({ ...newVendor, contact: e.target.value })}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  type="tel"
                  placeholder="Phone"
                  value={newVendor.phone}
                  onChange={(e) => setNewVendor({ ...newVendor, phone: e.target.value })}
                />
                <Input
                  type="email"
                  placeholder="Email"
                  value={newVendor.email}
                  onChange={(e) => setNewVendor({ ...newVendor, email: e.target.value })}
                />
              </div>
              <Input
                placeholder="Address"
                value={newVendor.address}
                onChange={(e) => setNewVendor({ ...newVendor, address: e.target.value })}
              />
              <select
                className="w-full border rounded px-3 py-2"
                value={newVendor.category}
                onChange={(e) => setNewVendor({ ...newVendor, category: e.target.value })}
              >
                {categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <select
                className="w-full border rounded px-3 py-2"
                value={newVendor.paymentTerms}
                onChange={(e) => setNewVendor({ ...newVendor, paymentTerms: e.target.value })}
              >
                {paymentTerms.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowAddVendor(false)}>Cancel</Button>
                <Button onClick={addVendor}>Add Vendor</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>

      <CardContent>
        {vendors.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            No vendors yet. Add suppliers to manage relationships.
          </div>
        ) : (
          <div className="space-y-3">
            {vendors.map(vendor => (
              <div key={vendor.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-bold text-sm">{vendor.name}</h3>
                    <p className="text-xs text-slate-600">
                      {vendor.category} • {vendor.contact}
                    </p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${getPerformanceColor(vendor.performance)}`}>
                    {vendor.performance}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs mb-3">
                  <div>
                    <p className="text-slate-600">Email</p>
                    <p className="font-medium">{vendor.email}</p>
                  </div>
                  <div>
                    <p className="text-slate-600">Phone</p>
                    <p className="font-medium">{vendor.phone}</p>
                  </div>
                  <div>
                    <p className="text-slate-600">Terms</p>
                    <p className="font-medium">{vendor.paymentTerms}</p>
                  </div>
                  <div>
                    <p className="text-slate-600">Total Spent</p>
                    <p className="font-medium">${vendor.totalSpent.toLocaleString()}</p>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => deleteVendor(vendor.id)}
                  className="text-red-600"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Remove
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Purchase Order Management
export function PurchaseOrderManagement() {
  const [orders, setOrders] = useState([]);
  const [showAddOrder, setShowAddOrder] = useState(false);
  const [newOrder, setNewOrder] = useState({
    poNumber: '',
    vendor: '',
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    items: [],
    total: 0,
    status: 'pending'
  });

  const statuses = ['pending', 'sent', 'confirmed', 'received', 'invoiced'];

  const addOrder = () => {
    if (!newOrder.poNumber || !newOrder.vendor) {
      toast.error('Please fill in required fields');
      return;
    }

    setOrders([...orders, {
      ...newOrder,
      id: Date.now()
    }]);

    setNewOrder({
      poNumber: '',
      vendor: '',
      date: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      items: [],
      total: 0,
      status: 'pending'
    });
    setShowAddOrder(false);
    toast.success('Purchase order created');
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'bg-slate-100 text-slate-800',
      'sent': 'bg-blue-100 text-blue-800',
      'confirmed': 'bg-yellow-100 text-yellow-800',
      'received': 'bg-green-100 text-green-800',
      'invoiced': 'bg-purple-100 text-purple-800'
    };
    return colors[status] || 'bg-slate-100';
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Purchase Orders</CardTitle>
        <Dialog open={showAddOrder} onOpenChange={setShowAddOrder}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New PO
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Purchase Order</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="PO Number"
                value={newOrder.poNumber}
                onChange={(e) => setNewOrder({ ...newOrder, poNumber: e.target.value })}
              />
              <Input
                placeholder="Vendor name"
                value={newOrder.vendor}
                onChange={(e) => setNewOrder({ ...newOrder, vendor: e.target.value })}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  type="date"
                  value={newOrder.date}
                  onChange={(e) => setNewOrder({ ...newOrder, date: e.target.value })}
                />
                <Input
                  type="date"
                  value={newOrder.dueDate}
                  onChange={(e) => setNewOrder({ ...newOrder, dueDate: e.target.value })}
                />
              </div>
              <select
                className="w-full border rounded px-3 py-2"
                value={newOrder.status}
                onChange={(e) => setNewOrder({ ...newOrder, status: e.target.value })}
              >
                {statuses.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowAddOrder(false)}>Cancel</Button>
                <Button onClick={addOrder}>Create PO</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>

      <CardContent>
        {orders.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            No purchase orders yet. Create one to manage procurement.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2">PO Number</th>
                  <th className="text-left py-2 px-2">Vendor</th>
                  <th className="text-right py-2 px-2">Amount</th>
                  <th className="text-left py-2 px-2">Due Date</th>
                  <th className="text-left py-2 px-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order.id} className="border-b hover:bg-slate-50">
                    <td className="py-2 px-2 font-medium">{order.poNumber}</td>
                    <td className="py-2 px-2">{order.vendor}</td>
                    <td className="text-right py-2 px-2">${order.total.toLocaleString()}</td>
                    <td className="py-2 px-2">{order.dueDate}</td>
                    <td className="py-2 px-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
