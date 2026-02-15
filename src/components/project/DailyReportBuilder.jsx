import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Trash2, Cloud, FileText } from 'lucide-react';
import { toast } from 'sonner';

export default function DailyReportBuilder({ projectId = null, onSave = null }) {
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [weather, setWeather] = useState({
    temperature: '',
    condition: 'Clear',
    precipitation: 'None',
    windSpeed: ''
  });

  const [crewMembers, setCrewMembers] = useState([]);
  const [newCrewMember, setNewCrewMember] = useState({ name: '', hours: '', role: '' });

  const [activitiesCompleted, setActivitiesCompleted] = useState([]);
  const [newActivity, setNewActivity] = useState({ description: '', hours: '', status: 'completed' });

  const [materialsUsed, setMaterialsUsed] = useState([]);
  const [newMaterial, setNewMaterial] = useState({ item: '', quantity: '', unit: '' });

  const [equipmentUsed, setEquipmentUsed] = useState([]);
  const [newEquipment, setNewEquipment] = useState({ equipment: '', hours: '', status: 'working' });

  const [safetyNotes, setSafetyNotes] = useState('');
  const [issues, setIssues] = useState('');
  const [nextDayPlan, setNextDayPlan] = useState('');
  const [photos, setPhotos] = useState([]);

  const weatherConditions = ['Clear', 'Cloudy', 'Rainy', 'Snowy', 'Foggy', 'Windy'];
  const precipitations = ['None', 'Light', 'Moderate', 'Heavy'];

  const addCrewMember = () => {
    if (!newCrewMember.name) {
      toast.error('Please enter crew member name');
      return;
    }
    setCrewMembers([...crewMembers, { ...newCrewMember, id: Date.now() }]);
    setNewCrewMember({ name: '', hours: '', role: '' });
    toast.success('Crew member added');
  };

  const addActivity = () => {
    if (!newActivity.description) {
      toast.error('Please enter activity description');
      return;
    }
    setActivitiesCompleted([...activitiesCompleted, { ...newActivity, id: Date.now() }]);
    setNewActivity({ description: '', hours: '', status: 'completed' });
    toast.success('Activity added');
  };

  const addMaterial = () => {
    if (!newMaterial.item) {
      toast.error('Please enter material item');
      return;
    }
    setMaterialsUsed([...materialsUsed, { ...newMaterial, id: Date.now() }]);
    setNewMaterial({ item: '', quantity: '', unit: '' });
    toast.success('Material added');
  };

  const addEquipment = () => {
    if (!newEquipment.equipment) {
      toast.error('Please enter equipment name');
      return;
    }
    setEquipmentUsed([...equipmentUsed, { ...newEquipment, id: Date.now() }]);
    setNewEquipment({ equipment: '', hours: '', status: 'working' });
    toast.success('Equipment added');
  };

  const removeCrewMember = (id) => {
    setCrewMembers(crewMembers.filter(m => m.id !== id));
  };

  const removeActivity = (id) => {
    setActivitiesCompleted(activitiesCompleted.filter(a => a.id !== id));
  };

  const removeMaterial = (id) => {
    setMaterialsUsed(materialsUsed.filter(m => m.id !== id));
  };

  const removeEquipment = (id) => {
    setEquipmentUsed(equipmentUsed.filter(e => e.id !== id));
  };

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhotos([...photos, {
          id: Date.now(),
          data: event.target.result,
          name: file.name
        }]);
      };
      reader.readAsDataURL(file);
    });
    toast.success(`${files.length} photo(s) added`);
  };

  const handleSaveReport = async () => {
    const reportData = {
      date: reportDate,
      projectId,
      weather,
      crewMembers,
      activitiesCompleted,
      materialsUsed,
      equipmentUsed,
      safetyNotes,
      issues,
      nextDayPlan,
      photos: photos.map(p => ({ name: p.name, thumbnail: p.data })),
      createdAt: new Date().toISOString()
    };

    if (onSave) {
      await onSave(reportData);
    } else {
      console.log('Daily Report:', reportData);
      toast.success('Daily report saved');
    }
  };

  const totalCrewHours = crewMembers.reduce((sum, m) => sum + (parseFloat(m.hours) || 0), 0);

  return (
    <div className="space-y-4">
      {/* Report Header */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Site Report</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Report Date</label>
              <Input
                type="date"
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <div className="text-sm text-slate-600">
                {crewMembers.length} crew members • {totalCrewHours} hours
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Weather */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <Cloud className="h-5 w-5" />
          <CardTitle>Weather Conditions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Condition</label>
              <select
                className="w-full border rounded px-3 py-2"
                value={weather.condition}
                onChange={(e) => setWeather({ ...weather, condition: e.target.value })}
              >
                {weatherConditions.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Precipitation</label>
              <select
                className="w-full border rounded px-3 py-2"
                value={weather.precipitation}
                onChange={(e) => setWeather({ ...weather, precipitation: e.target.value })}
              >
                {precipitations.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Temperature (°F)</label>
              <Input
                type="number"
                placeholder="72"
                value={weather.temperature}
                onChange={(e) => setWeather({ ...weather, temperature: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Wind Speed (mph)</label>
              <Input
                type="number"
                placeholder="0"
                value={weather.windSpeed}
                onChange={(e) => setWeather({ ...weather, windSpeed: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Crew Members */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Crew Members</CardTitle>
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Crew Member</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Name"
                  value={newCrewMember.name}
                  onChange={(e) => setNewCrewMember({ ...newCrewMember, name: e.target.value })}
                />
                <Input
                  placeholder="Role (Foreman, Laborer, etc.)"
                  value={newCrewMember.role}
                  onChange={(e) => setNewCrewMember({ ...newCrewMember, role: e.target.value })}
                />
                <Input
                  type="number"
                  placeholder="Hours worked"
                  value={newCrewMember.hours}
                  onChange={(e) => setNewCrewMember({ ...newCrewMember, hours: e.target.value })}
                />
                <Button onClick={addCrewMember} className="w-full">Add</Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {crewMembers.length === 0 ? (
            <div className="text-center py-4 text-slate-500 text-sm">
              No crew members added yet
            </div>
          ) : (
            <div className="space-y-2">
              {crewMembers.map(member => (
                <div key={member.id} className="flex items-center justify-between p-3 bg-slate-50 rounded">
                  <div>
                    <p className="font-medium">{member.name}</p>
                    <p className="text-sm text-slate-600">{member.role} • {member.hours} hrs</p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeCrewMember(member.id)}
                    className="text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activities Completed */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Activities Completed</CardTitle>
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Activity
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Activity</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Textarea
                  placeholder="Description of work completed"
                  value={newActivity.description}
                  onChange={(e) => setNewActivity({ ...newActivity, description: e.target.value })}
                />
                <Input
                  type="number"
                  placeholder="Hours spent"
                  value={newActivity.hours}
                  onChange={(e) => setNewActivity({ ...newActivity, hours: e.target.value })}
                />
                <select
                  className="w-full border rounded px-3 py-2"
                  value={newActivity.status}
                  onChange={(e) => setNewActivity({ ...newActivity, status: e.target.value })}
                >
                  <option value="completed">Completed</option>
                  <option value="in-progress">In Progress</option>
                  <option value="pending">Pending</option>
                </select>
                <Button onClick={addActivity} className="w-full">Add</Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {activitiesCompleted.length === 0 ? (
            <div className="text-center py-4 text-slate-500 text-sm">
              No activities added yet
            </div>
          ) : (
            <div className="space-y-2">
              {activitiesCompleted.map(activity => (
                <div key={activity.id} className="flex items-start justify-between p-3 bg-slate-50 rounded">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{activity.description}</p>
                    <p className="text-xs text-slate-600 mt-1">
                      {activity.hours} hrs • {activity.status}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeActivity(activity.id)}
                    className="text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Materials Used */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Materials Used</CardTitle>
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Material
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Material</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Material item"
                  value={newMaterial.item}
                  onChange={(e) => setNewMaterial({ ...newMaterial, item: e.target.value })}
                />
                <Input
                  type="number"
                  placeholder="Quantity"
                  value={newMaterial.quantity}
                  onChange={(e) => setNewMaterial({ ...newMaterial, quantity: e.target.value })}
                />
                <Input
                  placeholder="Unit (ea, sq ft, etc.)"
                  value={newMaterial.unit}
                  onChange={(e) => setNewMaterial({ ...newMaterial, unit: e.target.value })}
                />
                <Button onClick={addMaterial} className="w-full">Add</Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {materialsUsed.length === 0 ? (
            <div className="text-center py-4 text-slate-500 text-sm">
              No materials logged yet
            </div>
          ) : (
            <div className="space-y-2">
              {materialsUsed.map(material => (
                <div key={material.id} className="flex items-center justify-between p-3 bg-slate-50 rounded">
                  <div>
                    <p className="font-medium text-sm">{material.item}</p>
                    <p className="text-xs text-slate-600">{material.quantity} {material.unit}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeMaterial(material.id)}
                    className="text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Equipment Used */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Equipment Used</CardTitle>
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Equipment
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Equipment</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Equipment name"
                  value={newEquipment.equipment}
                  onChange={(e) => setNewEquipment({ ...newEquipment, equipment: e.target.value })}
                />
                <Input
                  type="number"
                  placeholder="Hours used"
                  value={newEquipment.hours}
                  onChange={(e) => setNewEquipment({ ...newEquipment, hours: e.target.value })}
                />
                <select
                  className="w-full border rounded px-3 py-2"
                  value={newEquipment.status}
                  onChange={(e) => setNewEquipment({ ...newEquipment, status: e.target.value })}
                >
                  <option value="working">Working</option>
                  <option value="breakdown">Breakdown</option>
                  <option value="maintenance">Maintenance</option>
                </select>
                <Button onClick={addEquipment} className="w-full">Add</Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {equipmentUsed.length === 0 ? (
            <div className="text-center py-4 text-slate-500 text-sm">
              No equipment logged yet
            </div>
          ) : (
            <div className="space-y-2">
              {equipmentUsed.map(eq => (
                <div key={eq.id} className="flex items-center justify-between p-3 bg-slate-50 rounded">
                  <div>
                    <p className="font-medium text-sm">{eq.equipment}</p>
                    <p className="text-xs text-slate-600">{eq.hours} hrs • {eq.status}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeEquipment(eq.id)}
                    className="text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Safety & Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Safety Notes & Issues</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Safety Notes</label>
            <Textarea
              placeholder="Any safety concerns or incidents..."
              value={safetyNotes}
              onChange={(e) => setSafetyNotes(e.target.value)}
              className="min-h-[80px]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Issues/Delays</label>
            <Textarea
              placeholder="Any issues encountered, delays, or blockers..."
              value={issues}
              onChange={(e) => setIssues(e.target.value)}
              className="min-h-[80px]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Next Day Plan</label>
            <Textarea
              placeholder="What's planned for tomorrow..."
              value={nextDayPlan}
              onChange={(e) => setNextDayPlan(e.target.value)}
              className="min-h-[80px]"
            />
          </div>
        </CardContent>
      </Card>

      {/* Photos */}
      <Card>
        <CardHeader>
          <CardTitle>Site Photos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handlePhotoUpload}
            className="block w-full text-sm text-slate-500"
          />
          {photos.length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {photos.map(photo => (
                <div key={photo.id} className="relative">
                  <img src={photo.data} alt={photo.name} className="w-full h-20 object-cover rounded" />
                  <button
                    onClick={() => setPhotos(photos.filter(p => p.id !== photo.id))}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex gap-2 justify-end">
        <Button variant="outline">Discard</Button>
        <Button onClick={handleSaveReport} className="gap-2">
          <FileText className="h-4 w-4" />
          Save Daily Report
        </Button>
      </div>
    </div>
  );
}
