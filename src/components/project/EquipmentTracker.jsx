import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Trash2, Edit2, CheckOut, Wrench } from 'lucide-react';
import { toast } from 'sonner';

export default function EquipmentTracker() {
  const [equipment, setEquipment] = useState([]);
  const [showAddEquipment, setShowAddEquipment] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState(null);
  const [checkoutDialog, setCheckoutDialog] = useState(null);
  const [maintenanceDialog, setMaintenanceDialog] = useState(null);

  const [newEquipment, setNewEquipment] = useState({
    name: '',
    category: 'Power Tools',
    serialNumber: '',
    purchaseDate: '',
    cost: 0,
    status: 'available',
    location: '',
    lastMaintenance: ''
  });

  const [checkoutForm, setCheckoutForm] = useState({
    equipmentId: '',
    checkedOutBy: '',
    checkedOutTo: '',
    project: '',
    expectedReturn: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: ''
  });

  const [maintenanceForm, setMaintenanceForm] = useState({
    equipmentId: '',
    type: 'inspection',
    technician: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    cost: 0,
    nextDue: ''
  });

  const [checkouts, setCheckouts] = useState([]);
  const [maintenance, setMaintenance] = useState([]);

  const categories = ['Power Tools', 'Hand Tools', 'Heavy Equipment', 'Safety Equipment', 'Measuring Tools', 'Other'];
  const maintenanceTypes = ['inspection', 'repair', 'cleaning', 'calibration', 'replacement'];

  const addEquipment = () => {
    if (!newEquipment.name) {
      toast.error('Please enter equipment name');
      return;
    }
    setEquipment([...equipment, { ...newEquipment, id: Date.now() }]);
    setNewEquipment({
      name: '',
      category: 'Power Tools',
      serialNumber: '',
      purchaseDate: '',
      cost: 0,
      status: 'available',
      location: '',
      lastMaintenance: ''
    });
    setShowAddEquipment(false);
    toast.success('Equipment added');
  };

  const updateEquipment = (id, updatedData) => {
    setEquipment(equipment.map(e => e.id === id ? { ...e, ...updatedData } : e));
    setEditingEquipment(null);
    toast.success('Equipment updated');
  };

  const deleteEquipment = (id) => {
    setEquipment(equipment.filter(e => e.id !== id));
    toast.success('Equipment deleted');
  };

  const checkoutEquipment = () => {
    if (!checkoutForm.checkedOutBy || !checkoutForm.checkedOutTo) {
      toast.error('Please fill all checkout fields');
      return;
    }

    const eq = equipment.find(e => e.id === parseInt(checkoutForm.equipmentId));
    setEquipment(equipment.map(e => 
      e.id === eq.id ? { ...e, status: 'checked-out' } : e
    ));

    setCheckouts([...checkouts, {
      ...checkoutForm,
      id: Date.now(),
      checkoutDate: new Date().toISOString().split('T')[0]
    }]);

    setCheckoutForm({
      equipmentId: '',
      checkedOutBy: '',
      checkedOutTo: '',
      project: '',
      expectedReturn: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      notes: ''
    });
    setCheckoutDialog(null);
    toast.success('Equipment checked out');
  };

  const returnEquipment = (checkoutId) => {
    const checkout = checkouts.find(c => c.id === checkoutId);
    const eq = equipment.find(e => e.id === parseInt(checkout.equipmentId));
    
    setEquipment(equipment.map(e => 
      e.id === eq.id ? { ...e, status: 'available' } : e
    ));

    setCheckouts(checkouts.filter(c => c.id !== checkoutId));
    toast.success('Equipment returned');
  };

  const logMaintenance = () => {
    if (!maintenanceForm.technician) {
      toast.error('Please enter technician name');
      return;
    }

    const eq = equipment.find(e => e.id === parseInt(maintenanceForm.equipmentId));
    setEquipment(equipment.map(e => 
      e.id === eq.id ? { 
        ...e, 
        lastMaintenance: maintenanceForm.date,
        status: 'available'
      } : e
    ));

    setMaintenance([...maintenance, {
      ...maintenanceForm,
      id: Date.now()
    }]);

    setMaintenanceForm({
      equipmentId: '',
      type: 'inspection',
      technician: '',
      date: new Date().toISOString().split('T')[0],
      description: '',
      cost: 0,
      nextDue: ''
    });
    setMaintenanceDialog(null);
    toast.success('Maintenance logged');
  };

  const getStatusColor = (status) => {
    const colors = {
      'available': 'bg-green-100 text-green-800',
      'checked-out': 'bg-blue-100 text-blue-800',
      'maintenance': 'bg-yellow-100 text-yellow-800',
      'broken': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-slate-100 text-slate-800';
  };

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Equipment</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{equipment.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Available</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              {equipment.filter(e => e.status === 'available').length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Checked Out</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">
              {equipment.filter(e => e.status === 'checked-out').length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Value</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              ${equipment.reduce((sum, e) => sum + (e.cost || 0), 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Equipment Inventory */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Equipment Inventory</CardTitle>
          <Dialog open={showAddEquipment} onOpenChange={setShowAddEquipment}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Equipment
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add Equipment</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Equipment name"
                  value={newEquipment.name}
                  onChange={(e) => setNewEquipment({ ...newEquipment, name: e.target.value })}
                />
                <select
                  className="w-full border rounded px-3 py-2"
                  value={newEquipment.category}
                  onChange={(e) => setNewEquipment({ ...newEquipment, category: e.target.value })}
                >
                  {categories.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <Input
                  placeholder="Serial number"
                  value={newEquipment.serialNumber}
                  onChange={(e) => setNewEquipment({ ...newEquipment, serialNumber: e.target.value })}
                />
                <Input
                  type="date"
                  value={newEquipment.purchaseDate}
                  onChange={(e) => setNewEquipment({ ...newEquipment, purchaseDate: e.target.value })}
                />
                <Input
                  type="number"
                  placeholder="Cost ($)"
                  value={newEquipment.cost}
                  onChange={(e) => setNewEquipment({ ...newEquipment, cost: parseFloat(e.target.value) || 0 })}
                />
                <Input
                  placeholder="Storage location"
                  value={newEquipment.location}
                  onChange={(e) => setNewEquipment({ ...newEquipment, location: e.target.value })}
                />
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setShowAddEquipment(false)}>Cancel</Button>
                  <Button onClick={addEquipment}>Add Equipment</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>

        <CardContent>
          {equipment.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              No equipment yet. Add your first equipment to get started.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2">Name</th>
                    <th className="text-left py-2 px-2">Category</th>
                    <th className="text-left py-2 px-2">Serial #</th>
                    <th className="text-left py-2 px-2">Status</th>
                    <th className="text-right py-2 px-2">Cost</th>
                    <th className="text-left py-2 px-2">Location</th>
                    <th className="text-right py-2 px-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {equipment.map((eq) => (
                    <tr key={eq.id} className="border-b hover:bg-slate-50">
                      <td className="py-2 px-2 font-medium">{eq.name}</td>
                      <td className="py-2 px-2">{eq.category}</td>
                      <td className="py-2 px-2 text-xs">{eq.serialNumber}</td>
                      <td className="py-2 px-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(eq.status)}`}>
                          {eq.status}
                        </span>
                      </td>
                      <td className="text-right py-2 px-2">${eq.cost?.toLocaleString()}</td>
                      <td className="py-2 px-2 text-sm text-slate-600">{eq.location}</td>
                      <td className="text-right py-2 px-2">
                        <div className="flex gap-1 justify-end">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline">
                                <CheckOut className="h-3 w-3" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Checkout: {eq.name}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <Input
                                  placeholder="Checked out by"
                                  value={checkoutForm.checkedOutBy}
                                  onChange={(e) => setCheckoutForm({ ...checkoutForm, checkedOutBy: e.target.value, equipmentId: eq.id })}
                                />
                                <Input
                                  placeholder="Checked out to (crew member)"
                                  value={checkoutForm.checkedOutTo}
                                  onChange={(e) => setCheckoutForm({ ...checkoutForm, checkedOutTo: e.target.value })}
                                />
                                <Input
                                  placeholder="Project/Job"
                                  value={checkoutForm.project}
                                  onChange={(e) => setCheckoutForm({ ...checkoutForm, project: e.target.value })}
                                />
                                <Input
                                  type="date"
                                  value={checkoutForm.expectedReturn}
                                  onChange={(e) => setCheckoutForm({ ...checkoutForm, expectedReturn: e.target.value })}
                                />
                                <Input
                                  placeholder="Notes"
                                  value={checkoutForm.notes}
                                  onChange={(e) => setCheckoutForm({ ...checkoutForm, notes: e.target.value })}
                                />
                                <Button onClick={checkoutEquipment} className="w-full">Checkout</Button>
                              </div>
                            </DialogContent>
                          </Dialog>

                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline">
                                <Wrench className="h-3 w-3" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Maintenance: {eq.name}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <select
                                  className="w-full border rounded px-3 py-2"
                                  value={maintenanceForm.type}
                                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, type: e.target.value, equipmentId: eq.id })}
                                >
                                  {maintenanceTypes.map(t => (
                                    <option key={t} value={t}>{t}</option>
                                  ))}
                                </select>
                                <Input
                                  placeholder="Technician name"
                                  value={maintenanceForm.technician}
                                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, technician: e.target.value })}
                                />
                                <Input
                                  type="date"
                                  value={maintenanceForm.date}
                                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, date: e.target.value })}
                                />
                                <Input
                                  placeholder="Description"
                                  value={maintenanceForm.description}
                                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, description: e.target.value })}
                                />
                                <Input
                                  type="number"
                                  placeholder="Cost ($)"
                                  value={maintenanceForm.cost}
                                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, cost: parseFloat(e.target.value) || 0 })}
                                />
                                <Input
                                  type="date"
                                  placeholder="Next maintenance due"
                                  value={maintenanceForm.nextDue}
                                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, nextDue: e.target.value })}
                                />
                                <Button onClick={logMaintenance} className="w-full">Log Maintenance</Button>
                              </div>
                            </DialogContent>
                          </Dialog>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteEquipment(eq.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Checkouts */}
      {checkouts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Active Checkouts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {checkouts.map(checkout => {
                const eq = equipment.find(e => e.id === parseInt(checkout.equipmentId));
                return (
                  <div key={checkout.id} className="flex items-center justify-between p-3 bg-blue-50 rounded">
                    <div>
                      <p className="font-medium">{eq?.name}</p>
                      <p className="text-sm text-slate-600">
                        {checkout.checkedOutTo} • {checkout.project} • Due: {checkout.expectedReturn}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => returnEquipment(checkout.id)}
                    >
                      Return
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Maintenance History */}
      {maintenance.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Maintenance History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {maintenance.slice(-10).map(m => {
                const eq = equipment.find(e => e.id === parseInt(m.equipmentId));
                return (
                  <div key={m.id} className="flex items-center justify-between p-3 bg-amber-50 rounded">
                    <div>
                      <p className="font-medium text-sm">{eq?.name}</p>
                      <p className="text-xs text-slate-600">
                        {m.type} by {m.technician} on {m.date}
                        {m.cost > 0 && ` • ${m.cost}`}
                      </p>
                      {m.description && (
                        <p className="text-xs text-slate-600 mt-1">{m.description}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
