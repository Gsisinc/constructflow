import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Package,
  Plus,
  Check,
  X,
  AlertCircle,
  Clock,
  CheckCircle2,
  TrendingUp,
  Download,
  QrCode,
  Camera
} from 'lucide-react';

export default function MaterialReceiving() {
  const [materials, setMaterials] = useState([
    {
      id: 'MAT-001',
      poNumber: 'PO-2024-156',
      vendor: 'Steel Suppliers Inc',
      material: 'Structural Steel Beams',
      quantity: 50,
      unit: 'units',
      expectedDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      receivedDate: null,
      receivedQuantity: 0,
      status: 'pending',
      location: 'Project A - Storage',
      unitCost: 450,
      totalCost: 22500,
      notes: 'Grade A, 12m length',
      receivedBy: null,
      inspectionStatus: 'pending',
      qualityIssues: []
    },
    {
      id: 'MAT-002',
      poNumber: 'PO-2024-157',
      vendor: 'Concrete Suppliers LLC',
      material: 'Ready Mix Concrete',
      quantity: 100,
      unit: 'cubic yards',
      expectedDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      receivedDate: new Date(),
      receivedQuantity: 98,
      status: 'received',
      location: 'Project B - Foundation',
      unitCost: 150,
      totalCost: 15000,
      notes: '3000 PSI strength',
      receivedBy: 'Mike Johnson',
      inspectionStatus: 'passed',
      qualityIssues: []
    },
    {
      id: 'MAT-003',
      poNumber: 'PO-2024-158',
      vendor: 'Electrical Distributors',
      material: 'Copper Wire 10 AWG',
      quantity: 1000,
      unit: 'feet',
      expectedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      receivedDate: null,
      receivedQuantity: 0,
      status: 'overdue',
      location: 'Project C - Electrical',
      unitCost: 2.50,
      totalCost: 2500,
      notes: 'THHN insulation',
      receivedBy: null,
      inspectionStatus: 'pending',
      qualityIssues: []
    }
  ]);

  const [showReceiveForm, setShowReceiveForm] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [receiveData, setReceiveData] = useState({
    quantity: 0,
    location: '',
    notes: '',
    qualityIssues: []
  });

  const statusOptions = [
    { value: 'pending', label: 'Pending', color: 'bg-blue-100 text-blue-800' },
    { value: 'received', label: 'Received', color: 'bg-green-100 text-green-800' },
    { value: 'overdue', label: 'Overdue', color: 'bg-red-100 text-red-800' },
    { value: 'partial', label: 'Partial', color: 'bg-yellow-100 text-yellow-800' }
  ];

  const inspectionOptions = [
    { value: 'pending', label: 'Pending', color: 'text-slate-600' },
    { value: 'passed', label: 'Passed', color: 'text-green-600' },
    { value: 'failed', label: 'Failed', color: 'text-red-600' },
    { value: 'partial', label: 'Partial', color: 'text-yellow-600' }
  ];

  const handleReceiveMaterial = () => {
    if (selectedMaterial && receiveData.quantity > 0) {
      setMaterials(materials.map(mat => {
        if (mat.id === selectedMaterial.id) {
          const newReceivedQty = mat.receivedQuantity + receiveData.quantity;
          const newStatus = newReceivedQty >= mat.quantity ? 'received' : 'partial';

          return {
            ...mat,
            receivedQuantity: newReceivedQty,
            status: newStatus,
            receivedDate: new Date(),
            location: receiveData.location || mat.location,
            notes: receiveData.notes || mat.notes,
            receivedBy: 'Current User',
            inspectionStatus: 'pending'
          };
        }
        return mat;
      }));

      setReceiveData({ quantity: 0, location: '', notes: '', qualityIssues: [] });
      setShowReceiveForm(false);
      setSelectedMaterial(null);
    }
  };

  const handleInspectionPass = (materialId) => {
    setMaterials(materials.map(mat =>
      mat.id === materialId
        ? { ...mat, inspectionStatus: 'passed' }
        : mat
    ));
  };

  const handleInspectionFail = (materialId) => {
    setMaterials(materials.map(mat =>
      mat.id === materialId
        ? { ...mat, inspectionStatus: 'failed', qualityIssues: ['Quality issue detected'] }
        : mat
    ));
  };

  const stats = {
    total: materials.length,
    pending: materials.filter(m => m.status === 'pending').length,
    received: materials.filter(m => m.status === 'received').length,
    overdue: materials.filter(m => m.status === 'overdue').length,
    totalValue: materials.reduce((sum, m) => sum + m.totalCost, 0)
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Package className="w-8 h-8 text-blue-600" />
            Material Receiving Workflow
          </h1>
          <p className="text-slate-600 mt-1">Digitally receive and log materials on site</p>
        </div>
        <Button className="gap-2">
          <Download className="w-4 h-4" />
          Export Report
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <CardTitle className="text-sm font-medium">Total POs</CardTitle>
            <div className="text-2xl font-bold mt-2">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <div className="text-2xl font-bold mt-2 text-blue-600">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <CardTitle className="text-sm font-medium">Received</CardTitle>
            <div className="text-2xl font-bold mt-2 text-green-600">{stats.received}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <div className="text-2xl font-bold mt-2 text-red-600">{stats.overdue}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <div className="text-2xl font-bold mt-2">${(stats.totalValue / 1000).toFixed(0)}K</div>
          </CardContent>
        </Card>
      </div>

      {/* Receive Material Form */}
      {showReceiveForm && selectedMaterial && (
        <Card className="border-2 border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle>Receive Material</CardTitle>
            <CardDescription>{selectedMaterial.material}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Quantity Received</label>
                <Input
                  type="number"
                  value={receiveData.quantity}
                  onChange={(e) => setReceiveData({ ...receiveData, quantity: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                  className="mt-1"
                />
                <p className="text-xs text-slate-600 mt-1">Expected: {selectedMaterial.quantity} {selectedMaterial.unit}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Storage Location</label>
                <Input
                  value={receiveData.location}
                  onChange={(e) => setReceiveData({ ...receiveData, location: e.target.value })}
                  placeholder={selectedMaterial.location}
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Receiving Notes</label>
              <textarea
                value={receiveData.notes}
                onChange={(e) => setReceiveData({ ...receiveData, notes: e.target.value })}
                placeholder="Any notes about the received material..."
                className="w-full mt-1 p-2 border rounded-lg text-sm"
                rows="3"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => { setShowReceiveForm(false); setSelectedMaterial(null); }}>
                Cancel
              </Button>
              <Button onClick={handleReceiveMaterial} className="gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Confirm Receipt
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Materials List */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All ({materials.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({stats.pending})</TabsTrigger>
          <TabsTrigger value="received">Received ({stats.received})</TabsTrigger>
          <TabsTrigger value="overdue">Overdue ({stats.overdue})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {materials.map(material => (
            <MaterialCard
              key={material.id}
              material={material}
              statusOptions={statusOptions}
              inspectionOptions={inspectionOptions}
              onReceive={() => {
                setSelectedMaterial(material);
                setShowReceiveForm(true);
              }}
              onInspectionPass={() => handleInspectionPass(material.id)}
              onInspectionFail={() => handleInspectionFail(material.id)}
            />
          ))}
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          {materials.filter(m => m.status === 'pending').map(material => (
            <MaterialCard
              key={material.id}
              material={material}
              statusOptions={statusOptions}
              inspectionOptions={inspectionOptions}
              onReceive={() => {
                setSelectedMaterial(material);
                setShowReceiveForm(true);
              }}
              onInspectionPass={() => handleInspectionPass(material.id)}
              onInspectionFail={() => handleInspectionFail(material.id)}
            />
          ))}
        </TabsContent>

        <TabsContent value="received" className="space-y-4">
          {materials.filter(m => m.status === 'received').map(material => (
            <MaterialCard
              key={material.id}
              material={material}
              statusOptions={statusOptions}
              inspectionOptions={inspectionOptions}
              onReceive={() => {
                setSelectedMaterial(material);
                setShowReceiveForm(true);
              }}
              onInspectionPass={() => handleInspectionPass(material.id)}
              onInspectionFail={() => handleInspectionFail(material.id)}
            />
          ))}
        </TabsContent>

        <TabsContent value="overdue" className="space-y-4">
          {materials.filter(m => m.status === 'overdue').map(material => (
            <MaterialCard
              key={material.id}
              material={material}
              statusOptions={statusOptions}
              inspectionOptions={inspectionOptions}
              onReceive={() => {
                setSelectedMaterial(material);
                setShowReceiveForm(true);
              }}
              onInspectionPass={() => handleInspectionPass(material.id)}
              onInspectionFail={() => handleInspectionFail(material.id)}
            />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function MaterialCard({ material, statusOptions, inspectionOptions, onReceive, onInspectionPass, onInspectionFail }) {
  const statusOption = statusOptions.find(s => s.value === material.status);
  const inspectionOption = inspectionOptions.find(i => i.value === material.inspectionStatus);
  const daysUntilExpected = Math.ceil((material.expectedDate - new Date()) / (1000 * 60 * 60 * 24));

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-bold text-lg">{material.material}</h3>
                <p className="text-sm text-slate-600">{material.poNumber} • {material.vendor}</p>
              </div>
            </div>

            <div className="grid grid-cols-5 gap-4 mt-4">
              <div>
                <p className="text-xs text-slate-600 mb-1">Status</p>
                <Badge className={statusOption?.color || 'bg-slate-100'}>
                  {statusOption?.label || material.status}
                </Badge>
              </div>

              <div>
                <p className="text-xs text-slate-600 mb-1">Expected</p>
                <p className="font-medium text-sm">{material.expectedDate.toLocaleDateString()}</p>
                {daysUntilExpected < 0 && (
                  <p className="text-xs text-red-600 mt-1">{Math.abs(daysUntilExpected)} days overdue</p>
                )}
              </div>

              <div>
                <p className="text-xs text-slate-600 mb-1">Quantity</p>
                <p className="font-medium">{material.receivedQuantity} / {material.quantity} {material.unit}</p>
                {material.receivedQuantity > 0 && (
                  <div className="w-full bg-slate-200 rounded-full h-1.5 mt-1">
                    <div
                      className="bg-green-600 h-1.5 rounded-full"
                      style={{ width: `${(material.receivedQuantity / material.quantity) * 100}%` }}
                    />
                  </div>
                )}
              </div>

              <div>
                <p className="text-xs text-slate-600 mb-1">Inspection</p>
                <p className={`font-medium text-sm ${inspectionOption?.color}`}>
                  {material.inspectionStatus.charAt(0).toUpperCase() + material.inspectionStatus.slice(1)}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-600 mb-1">Total Cost</p>
                <p className="font-medium">${material.totalCost.toLocaleString()}</p>
              </div>
            </div>

            {material.notes && (
              <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-600 mb-1">Notes</p>
                <p className="text-sm">{material.notes}</p>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 ml-4">
            {material.status === 'pending' && (
              <Button onClick={onReceive} className="gap-2">
                <Check className="w-4 h-4" />
                Receive
              </Button>
            )}

            {material.status === 'received' && material.inspectionStatus === 'pending' && (
              <>
                <Button onClick={onInspectionPass} variant="outline" className="gap-2 text-green-600">
                  <CheckCircle2 className="w-4 h-4" />
                  Pass
                </Button>
                <Button onClick={onInspectionFail} variant="outline" className="gap-2 text-red-600">
                  <X className="w-4 h-4" />
                  Fail
                </Button>
              </>
            )}

            <Button variant="outline" size="sm" className="gap-2">
              <Camera className="w-4 h-4" />
              Photo
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
