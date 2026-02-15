import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Trash2, Edit2, Phone, Mail, MapPin, Star, DollarSign, Package, Truck } from 'lucide-react';
import { toast } from 'sonner';

// Vendor Management Component
export function VendorManagement() {
  const [vendors, setVendors] = useState([
    {
      id: 1,
      name: 'ABC Electric Supply',
      contact: 'John Davis',
      email: 'john@abcelectric.com',
      phone: '(555) 123-4567',
      address: '123 Main St, Springfield',
      rating: 4.8,
      reviews: 12,
      specialties: ['Electrical', 'Low Voltage'],
      paymentTerms: 'Net 30',
      volume: '$250,000'
    }
  ]);

  const [showAddVendor, setShowAddVendor] = useState(false);
  const [newVendor, setNewVendor] = useState({
    name: '',
    contact: '',
    email: '',
    phone: '',
    address: '',
    specialties: '',
    paymentTerms: 'Net 30'
  });

  const addVendor = () => {
    if (!newVendor.name || !newVendor.contact) {
      toast.error('Please fill in required fields');
      return;
    }
    setVendors([...vendors, {
      ...newVendor,
      id: Date.now(),
      rating: 5.0,
      reviews: 0,
      volume: '$0'
    }]);
    setNewVendor({
      name: '',
      contact: '',
      email: '',
      phone: '',
      address: '',
      specialties: '',
      paymentTerms: 'Net 30'
    });
    setShowAddVendor(false);
    toast.success('Vendor added');
  };

  const deleteVendor = (id) => {
    setVendors(vendors.filter(v => v.id !== id));
    toast.success('Vendor deleted');
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
              <DialogTitle>Add New Vendor</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
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
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  placeholder="Email"
                  type="email"
                  value={newVendor.email}
                  onChange={(e) => setNewVendor({ ...newVendor, email: e.target.value })}
                />
                <Input
                  placeholder="Phone"
                  value={newVendor.phone}
                  onChange={(e) => setNewVendor({ ...newVendor, phone: e.target.value })}
                />
              </div>

              <Input
                placeholder="Address"
                value={newVendor.address}
                onChange={(e) => setNewVendor({ ...newVendor, address: e.target.value })}
              />

              <Input
                placeholder="Specialties (comma-separated)"
                value={newVendor.specialties}
                onChange={(e) => setNewVendor({ ...newVendor, specialties: e.target.value })}
              />

              <select
                className="w-full border rounded px-3 py-2"
                value={newVendor.paymentTerms}
                onChange={(e) => setNewVendor({ ...newVendor, paymentTerms: e.target.value })}
              >
                <option value="Net 15">Net 15</option>
                <option value="Net 30">Net 30</option>
                <option value="Net 45">Net 45</option>
                <option value="COD">COD</option>
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
        <div className="space-y-3">
          {vendors.map(vendor => (
            <div key={vendor.id} className="border rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold">{vendor.name}</h3>
                  <p className="text-sm text-slate-600">{vendor.contact}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  <span className="font-medium text-sm">{vendor.rating}</span>
                  <span className="text-xs text-slate-600">({vendor.reviews})</span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm mb-3">
                <div className="flex items-center gap-1 text-slate-600">
                  <Mail className="h-4 w-4" />
                  <a href={`mailto:${vendor.email}`} className="hover:text-blue-600">{vendor.email}</a>
                </div>
                <div className="flex items-center gap-1 text-slate-600">
                  <Phone className="h-4 w-4" />
                  <a href={`tel:${vendor.phone}`} className="hover:text-blue-600">{vendor.phone}</a>
                </div>
                <div className="flex items-center gap-1 text-slate-600">
                  <MapPin className="h-4 w-4" />
                  {vendor.address}
                </div>
                <div className="flex items-center gap-1 text-slate-600">
                  <DollarSign className="h-4 w-4" />
                  {vendor.volume}
                </div>
              </div>

              <div className="flex gap-2 flex-wrap mb-3">
                {vendor.specialties.split(',').map((spec, idx) => (
                  <span key={idx} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                    {spec.trim()}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between text-sm">
                <p className="text-slate-600">Payment Terms: <span className="font-medium">{vendor.paymentTerms}</span></p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => deleteVendor(vendor.id)}
                  className="text-red-600"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Material Management Component
export function MaterialManagement() {
  const [materials, setMaterials] = useState([
    {
      id: 1,
      name: 'Electrical Conduit (EMT)',
      category: 'Electrical',
      quantity: 500,
      unit: 'feet',
      unitPrice: 2.50,
      supplier: 'ABC Electric Supply',
      status: 'in-stock'
    },
    {
      id: 2,
      name: 'Copper Wire #12 AWG',
      category: 'Electrical',
      quantity: 50,
      unit: 'rolls',
      unitPrice: 45.00,
      supplier: 'ABC Electric Supply',
      status: 'low-stock'
    }
  ]);

  const [showAddMaterial, setShowAddMaterial] = useState(false);
  const [newMaterial, setNewMaterial] = useState({
    name: '',
    category: 'Electrical',
    quantity: 0,
    unit: '',
    unitPrice: 0,
    supplier: ''
  });

  const addMaterial = () => {
    if (!newMaterial.name) {
      toast.error('Please enter material name');
      return;
    }
    setMaterials([...materials, {
      ...newMaterial,
      id: Date.now(),
      status: 'in-stock'
    }]);
    setNewMaterial({
      name: '',
      category: 'Electrical',
      quantity: 0,
      unit: '',
      unitPrice: 0,
      supplier: ''
    });
    setShowAddMaterial(false);
    toast.success('Material added to inventory');
  };

  const updateQuantity = (id, newQty) => {
    setMaterials(materials.map(m =>
      m.id === id
        ? { ...m, quantity: newQty, status: newQty === 0 ? 'out-of-stock' : newQty < 10 ? 'low-stock' : 'in-stock' }
        : m
    ));
  };

  const getStatusColor = (status) => {
    const colors = {
      'in-stock': 'bg-green-100 text-green-800',
      'low-stock': 'bg-yellow-100 text-yellow-800',
      'out-of-stock': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-slate-100';
  };

  return (
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
              <DialogTitle>Add Material to Inventory</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Material name"
                value={newMaterial.name}
                onChange={(e) => setNewMaterial({ ...newMaterial, name: e.target.value })}
              />

              <div className="grid grid-cols-2 gap-4">
                <select
                  className="border rounded px-3 py-2"
                  value={newMaterial.category}
                  onChange={(e) => setNewMaterial({ ...newMaterial, category: e.target.value })}
                >
                  <option value="Electrical">Electrical</option>
                  <option value="Mechanical">Mechanical</option>
                  <option value="Plumbing">Plumbing</option>
                  <option value="Safety">Safety</option>
                  <option value="Other">Other</option>
                </select>

                <Input
                  placeholder="Unit (feet, rolls, boxes, etc.)"
                  value={newMaterial.unit}
                  onChange={(e) => setNewMaterial({ ...newMaterial, unit: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  type="number"
                  placeholder="Quantity"
                  value={newMaterial.quantity}
                  onChange={(e) => setNewMaterial({ ...newMaterial, quantity: parseFloat(e.target.value) || 0 })}
                />

                <Input
                  type="number"
                  placeholder="Unit price"
                  value={newMaterial.unitPrice}
                  onChange={(e) => setNewMaterial({ ...newMaterial, unitPrice: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <Input
                placeholder="Supplier"
                value={newMaterial.supplier}
                onChange={(e) => setNewMaterial({ ...newMaterial, supplier: e.target.value })}
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
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-2">Material</th>
                <th className="text-left py-2 px-2">Category</th>
                <th className="text-right py-2 px-2">Qty</th>
                <th className="text-right py-2 px-2">Unit Price</th>
                <th className="text-right py-2 px-2">Total</th>
                <th className="text-left py-2 px-2">Status</th>
                <th className="text-left py-2 px-2">Supplier</th>
              </tr>
            </thead>
            <tbody>
              {materials.map(material => (
                <tr key={material.id} className="border-b hover:bg-slate-50">
                  <td className="py-2 px-2 font-medium">{material.name}</td>
                  <td className="py-2 px-2">{material.category}</td>
                  <td className="text-right py-2 px-2">
                    <Input
                      type="number"
                      value={material.quantity}
                      onChange={(e) => updateQuantity(material.id, parseFloat(e.target.value) || 0)}
                      className="w-16 text-right"
                      size="sm"
                    />
                    {material.unit}
                  </td>
                  <td className="text-right py-2 px-2">${material.unitPrice.toFixed(2)}</td>
                  <td className="text-right py-2 px-2 font-bold">
                    ${(material.quantity * material.unitPrice).toLocaleString()}
                  </td>
                  <td className="py-2 px-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(material.status)}`}>
                      {material.status}
                    </span>
                  </td>
                  <td className="py-2 px-2">{material.supplier}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// Subcontractor Management Component
export function SubcontractorCoordination() {
  const [subcontractors, setSubcontractors] = useState([
    {
      id: 1,
      name: 'Elite Electrical Services',
      contact: 'Tom Wilson',
      email: 'tom@eliteelectric.com',
      phone: '(555) 987-6543',
      specialty: 'Electrical',
      status: 'active',
      projects: ['School Retrofit'],
      schedule: {
        start: '2026-02-15',
        end: '2026-03-15',
        status: 'on-track'
      }
    }
  ]);

  const [showAddSub, setShowAddSub] = useState(false);
  const [newSub, setNewSub] = useState({
    name: '',
    contact: '',
    email: '',
    phone: '',
    specialty: '',
    projects: ''
  });

  const addSubcontractor = () => {
    if (!newSub.name || !newSub.specialty) {
      toast.error('Please fill in required fields');
      return;
    }
    setSubcontractors([...subcontractors, {
      ...newSub,
      id: Date.now(),
      status: 'active',
      projects: newSub.projects.split(',').map(p => p.trim()),
      schedule: {
        start: new Date().toISOString().split('T')[0],
        end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'pending'
      }
    }]);
    setNewSub({
      name: '',
      contact: '',
      email: '',
      phone: '',
      specialty: '',
      projects: ''
    });
    setShowAddSub(false);
    toast.success('Subcontractor added');
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Subcontractor Coordination</CardTitle>
        <Dialog open={showAddSub} onOpenChange={setShowAddSub}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Subcontractor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Subcontractor</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Company name"
                value={newSub.name}
                onChange={(e) => setNewSub({ ...newSub, name: e.target.value })}
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  placeholder="Contact person"
                  value={newSub.contact}
                  onChange={(e) => setNewSub({ ...newSub, contact: e.target.value })}
                />
                <Input
                  placeholder="Specialty"
                  value={newSub.specialty}
                  onChange={(e) => setNewSub({ ...newSub, specialty: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  placeholder="Email"
                  type="email"
                  value={newSub.email}
                  onChange={(e) => setNewSub({ ...newSub, email: e.target.value })}
                />
                <Input
                  placeholder="Phone"
                  value={newSub.phone}
                  onChange={(e) => setNewSub({ ...newSub, phone: e.target.value })}
                />
              </div>

              <Input
                placeholder="Assigned projects (comma-separated)"
                value={newSub.projects}
                onChange={(e) => setNewSub({ ...newSub, projects: e.target.value })}
              />

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowAddSub(false)}>Cancel</Button>
                <Button onClick={addSubcontractor}>Add Subcontractor</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {subcontractors.map(sub => (
            <div key={sub.id} className="border rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-bold">{sub.name}</h3>
                  <p className="text-sm text-slate-600">{sub.contact}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  sub.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'
                }`}>
                  {sub.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                <div>
                  <p className="text-slate-600">Specialty: <span className="font-medium">{sub.specialty}</span></p>
                  <p className="text-slate-600 mt-1">Contact: <a href={`mailto:${sub.email}`} className="text-blue-600">{sub.email}</a></p>
                </div>
                <div>
                  <p className="text-slate-600">Schedule: {sub.schedule.start} to {sub.schedule.end}</p>
                  <p className="text-slate-600 mt-1">Status: 
                    <span className={`ml-1 font-medium ${sub.schedule.status === 'on-track' ? 'text-green-600' : 'text-yellow-600'}`}>
                      {sub.schedule.status}
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex gap-2 flex-wrap">
                {sub.projects.map((proj, idx) => (
                  <span key={idx} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                    {proj}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
