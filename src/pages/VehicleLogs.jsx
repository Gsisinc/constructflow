import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Fuel, Wrench } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';

export default function VehicleLogs() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    vehicle_name: '',
    driver: '',
    starting_mileage: 0,
    ending_mileage: 0,
    purpose: 'job_site',
    fuel_added: 0,
    fuel_cost: 0,
    maintenance_performed: '',
    maintenance_cost: 0,
    notes: ''
  });

  const { data: logs = [] } = useQuery({
    queryKey: ['vehicleLogs'],
    queryFn: () => base44.entities.VehicleLog.list('-log_date', 50)
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.VehicleLog.create({
      ...data,
      log_date: format(new Date(), 'yyyy-MM-dd'),
      total_miles: data.ending_mileage - data.starting_mileage
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicleLogs'] });
      setFormData({
        vehicle_name: '',
        driver: '',
        starting_mileage: 0,
        ending_mileage: 0,
        purpose: 'job_site',
        fuel_added: 0,
        fuel_cost: 0,
        maintenance_performed: '',
        maintenance_cost: 0,
        notes: ''
      });
      setShowForm(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.VehicleLog.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vehicleLogs'] })
  });

  const handleSubmit = () => {
    createMutation.mutate(formData);
  };

  const totalMiles = logs.reduce((sum, log) => sum + (log.total_miles || 0), 0);
  const totalFuelCost = logs.reduce((sum, log) => sum + (log.fuel_cost || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-slate-900">Vehicle Logs</h1>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" /> New Log Entry
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Vehicle Log Entry</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Vehicle Name"
                value={formData.vehicle_name}
                onChange={(e) => setFormData({ ...formData, vehicle_name: e.target.value })}
              />
              <Input
                placeholder="Driver Name"
                value={formData.driver}
                onChange={(e) => setFormData({ ...formData, driver: e.target.value })}
              />
              <Input
                type="number"
                placeholder="Starting Mileage"
                value={formData.starting_mileage}
                onChange={(e) => setFormData({ ...formData, starting_mileage: parseFloat(e.target.value) })}
              />
              <Input
                type="number"
                placeholder="Ending Mileage"
                value={formData.ending_mileage}
                onChange={(e) => setFormData({ ...formData, ending_mileage: parseFloat(e.target.value) })}
              />
              <select
                value={formData.purpose}
                onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                className="w-full p-2 border rounded-lg"
              >
                <option value="job_site">Job Site</option>
                <option value="material_pickup">Material Pickup</option>
                <option value="client_meeting">Client Meeting</option>
                <option value="office">Office</option>
                <option value="other">Other</option>
              </select>
              <Input
                type="number"
                placeholder="Fuel Added (gallons)"
                value={formData.fuel_added}
                onChange={(e) => setFormData({ ...formData, fuel_added: parseFloat(e.target.value) })}
              />
              <Input
                type="number"
                placeholder="Fuel Cost ($)"
                value={formData.fuel_cost}
                onChange={(e) => setFormData({ ...formData, fuel_cost: parseFloat(e.target.value) })}
              />
              <Textarea
                placeholder="Maintenance Performed"
                value={formData.maintenance_performed}
                onChange={(e) => setFormData({ ...formData, maintenance_performed: e.target.value })}
              />
              <Input
                type="number"
                placeholder="Maintenance Cost ($)"
                value={formData.maintenance_cost}
                onChange={(e) => setFormData({ ...formData, maintenance_cost: parseFloat(e.target.value) })}
              />
              <Textarea
                placeholder="Notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
              <Button onClick={handleSubmit} className="w-full bg-blue-600 hover:bg-blue-700">
                Save Entry
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-600">Total Miles</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-600">{totalMiles.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-600">Total Fuel Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">${totalFuelCost.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-600">Entries</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-slate-600">{logs.length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4">
        {logs.map(log => (
          <Card key={log.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{log.vehicle_name}</CardTitle>
                  <p className="text-sm text-slate-600">{log.driver} • {format(new Date(log.log_date), 'MMM d, yyyy')}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteMutation.mutate(log.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-600">Mileage</p>
                  <p className="font-semibold">{log.starting_mileage} → {log.ending_mileage} ({log.total_miles} mi)</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Purpose</p>
                  <Badge variant="outline">{log.purpose.replace('_', ' ')}</Badge>
                </div>
              </div>
              {log.fuel_added > 0 && (
                <div className="flex items-center gap-2">
                  <Fuel className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">{log.fuel_added} gal • ${log.fuel_cost.toFixed(2)}</span>
                </div>
              )}
              {log.maintenance_performed && (
                <div className="flex items-start gap-2">
                  <Wrench className="h-4 w-4 text-orange-600 mt-0.5" />
                  <div className="text-sm">
                    <p>{log.maintenance_performed}</p>
                    <p className="text-slate-600">${log.maintenance_cost.toFixed(2)}</p>
                  </div>
                </div>
              )}
              {log.notes && <p className="text-sm text-slate-600">{log.notes}</p>}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}