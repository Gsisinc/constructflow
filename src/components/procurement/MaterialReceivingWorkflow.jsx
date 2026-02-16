import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Check, Clock, Truck, BoxIcon, CheckCircle2, XCircle } from 'lucide-react';

export default function MaterialReceivingWorkflow() {
  const [deliveries, setDeliveries] = useState([
    {
      id: 1,
      poNumber: 'PO-2026-001',
      supplier: 'ABC Building Materials',
      items: [
        { description: 'Concrete Mix (50 bags)', quantity: 50, unit: 'bags', expectedQty: 50, receivedQty: 50 },
        { description: 'Rebar #4 (1/2")', quantity: 100, unit: 'lbs', expectedQty: 100, receivedQty: 100 },
      ],
      expectedDate: '2026-02-14',
      actualDate: '2026-02-14',
      status: 'received',
      receivedBy: 'John Smith',
      notes: 'All items received in good condition',
    },
    {
      id: 2,
      poNumber: 'PO-2026-002',
      supplier: 'XYZ Equipment Rental',
      items: [
        { description: 'Scaffolding Frames', quantity: 20, unit: 'units', expectedQty: 20, receivedQty: 18 },
        { description: 'Cross Braces', quantity: 40, unit: 'units', expectedQty: 40, receivedQty: 40 },
      ],
      expectedDate: '2026-02-15',
      actualDate: '2026-02-15',
      status: 'partial',
      receivedBy: 'Sarah Johnson',
      notes: '2 frames damaged during shipping',
    },
    {
      id: 3,
      poNumber: 'PO-2026-003',
      supplier: 'Electrical Supply Co',
      items: [
        { description: '1/2" EMT Conduit', quantity: 500, unit: 'ft', expectedQty: 500, receivedQty: 0 },
        { description: 'Wire Connectors', quantity: 200, unit: 'units', expectedQty: 200, receivedQty: 0 },
      ],
      expectedDate: '2026-02-16',
      actualDate: null,
      status: 'pending',
      receivedBy: null,
      notes: 'In transit',
    },
  ]);

  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [showReceiveForm, setShowReceiveForm] = useState(false);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'received':
        return <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
          <Check size={14} /> Received
        </Badge>;
      case 'partial':
        return <Badge className="bg-yellow-100 text-yellow-800 flex items-center gap-1">
          <AlertCircle size={14} /> Partial
        </Badge>;
      case 'pending':
        return <Badge className="bg-blue-100 text-blue-800 flex items-center gap-1">
          <Clock size={14} /> Pending
        </Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getQualityStatus = (item) => {
    if (item.receivedQty === 0) return 'not-received';
    if (item.receivedQty === item.expectedQty) return 'good';
    if (item.receivedQty < item.expectedQty) return 'short';
    return 'over';
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Material Receiving Workflow</h1>
          <p className="text-gray-600 mt-2">
            Digitally receive, inspect, and log materials on site.
          </p>
        </div>
        <Button size="lg">
          <Truck size={18} className="mr-2" />
          New Delivery
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total POs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{deliveries.length}</div>
            <p className="text-xs text-gray-600 mt-2">Active purchase orders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Received</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {deliveries.filter(d => d.status === 'received').length}
            </div>
            <p className="text-xs text-gray-600 mt-2">Complete deliveries</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Partial</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {deliveries.filter(d => d.status === 'partial').length}
            </div>
            <p className="text-xs text-gray-600 mt-2">Requiring attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {deliveries.filter(d => d.status === 'pending').length}
            </div>
            <p className="text-xs text-gray-600 mt-2">In transit</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All Deliveries</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="issues">Issues</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6">
          <div className="space-y-4">
            {deliveries.map((delivery) => (
              <Card
                key={delivery.id}
                className={`cursor-pointer transition ${
                  selectedDelivery?.id === delivery.id ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => setSelectedDelivery(delivery)}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{delivery.poNumber}</h3>
                        {getStatusBadge(delivery.status)}
                      </div>
                      <p className="text-sm text-gray-600">{delivery.supplier}</p>
                    </div>
                    <div className="text-right text-sm">
                      <p className="font-medium">Expected: {delivery.expectedDate}</p>
                      {delivery.actualDate && (
                        <p className="text-gray-600">Received: {delivery.actualDate}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    {delivery.items.map((item, idx) => {
                      const quality = getQualityStatus(item);
                      const match = item.receivedQty === item.expectedQty;

                      return (
                        <div key={idx} className="flex items-center justify-between text-sm">
                          <span>{item.description}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-600">
                              Expected: {item.expectedQty} {item.unit}
                            </span>
                            <span className="font-medium">
                              Received: {item.receivedQty} {item.unit}
                            </span>
                            {match && quality === 'good' ? (
                              <CheckCircle2 className="text-green-600" size={16} />
                            ) : quality === 'short' ? (
                              <AlertCircle className="text-yellow-600" size={16} />
                            ) : (
                              <XCircle className="text-gray-400" size={16} />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {delivery.notes && (
                    <div className="p-3 bg-gray-50 rounded text-sm text-gray-700">
                      <p className="font-medium mb-1">Notes:</p>
                      <p>{delivery.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="pending" className="space-y-6">
          <div className="space-y-4">
            {deliveries
              .filter(d => d.status === 'pending')
              .map((delivery) => (
                <Card key={delivery.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold">{delivery.poNumber}</h3>
                        <p className="text-sm text-gray-600">{delivery.supplier}</p>
                      </div>
                      <div className="text-right">
                        <Badge className="bg-blue-100 text-blue-800 flex items-center gap-1">
                          <Clock size={14} /> Expected {delivery.expectedDate}
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      {delivery.items.map((item, idx) => (
                        <div key={idx} className="text-sm text-gray-600">
                          {item.description}: {item.quantity} {item.unit}
                        </div>
                      ))}
                    </div>

                    <Button variant="outline" className="w-full">
                      <Truck size={14} className="mr-2" />
                      Receive Delivery
                    </Button>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="issues" className="space-y-6">
          {deliveries
            .filter(d => d.status === 'partial')
            .map((delivery) => (
              <Card key={delivery.id} className="border-yellow-300">
                <CardHeader>
                  <CardTitle className="text-yellow-900 flex items-center gap-2">
                    <AlertCircle size={20} />
                    {delivery.poNumber} - {delivery.supplier}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {delivery.items
                    .filter(item => item.receivedQty !== item.expectedQty)
                    .map((item, idx) => (
                      <div key={idx} className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                        <p className="font-semibold text-sm">{item.description}</p>
                        <p className="text-sm text-yellow-800 mt-2">
                          Expected: {item.expectedQty} {item.unit} | Received: {item.receivedQty} {item.unit}
                        </p>
                        <p className="text-sm text-yellow-700 mt-1">
                          Shortage: {item.expectedQty - item.receivedQty} {item.unit}
                        </p>
                      </div>
                    ))}
                  <p className="text-sm text-gray-600 mt-4">Issue: {delivery.notes}</p>
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" className="flex-1">Resolve</Button>
                    <Button size="sm" variant="outline" className="flex-1">Contact Supplier</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Received Deliveries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {deliveries
                  .filter(d => d.status === 'received')
                  .map((delivery) => (
                    <div key={delivery.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-semibold text-sm">{delivery.poNumber}</p>
                        <p className="text-xs text-gray-600 mt-1">
                          {delivery.supplier} • Received by {delivery.receivedBy}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge className="bg-green-100 text-green-800">
                          <Check size={14} className="mr-1" />
                          Complete
                        </Badge>
                        <p className="text-xs text-gray-600 mt-1">{delivery.actualDate}</p>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {selectedDelivery && (
        <Card className="border-2 border-blue-500">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{selectedDelivery.poNumber}</CardTitle>
                <CardDescription>{selectedDelivery.supplier}</CardDescription>
              </div>
              <div>
                {getStatusBadge(selectedDelivery.status)}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Expected Date</label>
                <p className="mt-1 font-semibold">{selectedDelivery.expectedDate}</p>
              </div>
              {selectedDelivery.actualDate && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Received Date</label>
                  <p className="mt-1 font-semibold">{selectedDelivery.actualDate}</p>
                </div>
              )}
              {selectedDelivery.receivedBy && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Received By</label>
                  <p className="mt-1 font-semibold">{selectedDelivery.receivedBy}</p>
                </div>
              )}
            </div>

            <div>
              <h3 className="font-semibold mb-3">Items Detail</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-3">Description</th>
                      <th className="text-center py-2 px-3">Expected</th>
                      <th className="text-center py-2 px-3">Received</th>
                      <th className="text-center py-2 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedDelivery.items.map((item, idx) => (
                      <tr key={idx} className="border-b">
                        <td className="py-2 px-3">{item.description}</td>
                        <td className="text-center py-2 px-3">
                          {item.expectedQty} {item.unit}
                        </td>
                        <td className="text-center py-2 px-3">
                          {item.receivedQty} {item.unit}
                        </td>
                        <td className="text-center py-2 px-3">
                          {item.receivedQty === item.expectedQty ? (
                            <CheckCircle2 className="text-green-600 mx-auto" size={16} />
                          ) : item.receivedQty > 0 ? (
                            <AlertCircle className="text-yellow-600 mx-auto" size={16} />
                          ) : (
                            <Clock className="text-gray-400 mx-auto" size={16} />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {selectedDelivery.notes && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-600 mb-1">Notes</p>
                <p className="text-sm text-gray-700">{selectedDelivery.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
