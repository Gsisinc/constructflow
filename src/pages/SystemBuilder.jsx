import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import constructflowClient from '@/api/constructflowClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Flame,
  Camera,
  Lock,
  Shield,
  Zap,
  Tv,
  Plus,
  Trash2,
  ChevronRight,
  DollarSign,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Download,
  Share2,
  Edit2,
  Eye,
  EyeOff,
  Save,
  X,
} from 'lucide-react';
import systemDesigns from '@/data/systemDesigns.json';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const systemIcons = {
  fire_alarm: Flame,
  cctv: Camera,
  access_control: Lock,
  security_systems: Shield,
  structured_cabling: Zap,
  av_conference: Tv,
};

export default function SystemBuilder() {
  const navigate = useNavigate();
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [showProjectForm, setShowProjectForm] = useState(false);

  // Get current user and organization
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => constructflowClient.getCurrentUser()
  });

  const { data: organization } = useQuery({
    queryKey: ['currentOrganization'],
    queryFn: async () => {
      const orgs = await base44.entities.Organization.list();
      return orgs?.[0];
    }
  });

  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: async (projectData) => {
      const newProject = await constructflowClient.createProject(projectData);
      return newProject;
    },
    onSuccess: (newProject) => {
      toast.success('Project created successfully!');
      setTimeout(() => {
        navigate(`/ProjectDetail?id=${newProject.id}`);
      }, 1000);
    },
    onError: (error) => {
      toast.error('Failed to create project: ' + error.message);
    }
  });

  // Create materials mutation
  const createMaterialsMutation = useMutation({
    mutationFn: async ({ projectId, materialsData }) => {
      const createdMaterials = [];
      for (const material of materialsData) {
        const created = await constructflowClient.createProjectMaterial({
          ...material,
          project_id: projectId,
          organization_id: organization?.id,
          created_by: user?.id
        });
        createdMaterials.push(created);
      }
      return createdMaterials;
    }
  });
  const [selectedSystem, setSelectedSystem] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [currentStep, setCurrentStep] = useState('systems');
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [editingValues, setEditingValues] = useState({});
  const [customMaterials, setCustomMaterials] = useState([]);
  const [checkedRequirements, setCheckedRequirements] = useState({});
  const [showMaterialDialog, setShowMaterialDialog] = useState(false);
  const [newMaterialForm, setNewMaterialForm] = useState({
    part: '',
    description: '',
    quantity: 1,
    unit: 'EA',
    unitCost: 0,
  });
  const [showPreview, setShowPreview] = useState(false);
  const [isCreatingProject, setIsCreatingProject] = useState(false);

  const system = selectedSystem ? systemDesigns.systems.find(s => s.id === selectedSystem) : null;
  const size = selectedSize && system ? system.sizes.find(sz => sz.id === selectedSize) : null;
  const materials = size?.materials || [];
  const phases = size?.phases || [];
  const requirements = size?.requirements || [];

  // Calculate total cost with editable values
  const calculateTotalCost = () => {
    let total = 0;
    materials.forEach((cat, catIdx) => {
      cat.items.forEach((item, itemIdx) => {
        const key = `${catIdx}-${itemIdx}`;
        const qty = editingValues[`${key}-qty`] !== undefined ? parseFloat(editingValues[`${key}-qty`]) : item.quantity;
        const price = editingValues[`${key}-price`] !== undefined ? parseFloat(editingValues[`${key}-price`]) : item.unitCost;
        total += qty * price;
      });
    });
    customMaterials.forEach(mat => {
      total += (mat.quantity || 0) * (mat.unitCost || 0);
    });
    return total;
  };

  const totalMaterialCost = calculateTotalCost();

  const handleSystemSelect = (systemId) => {
    setSelectedSystem(systemId);
    setSelectedSize(null);
    setCurrentStep('sizes');
  };

  const handleSizeSelect = (sizeId) => {
    setSelectedSize(sizeId);
    setCurrentStep('builder');
    setCheckedRequirements({});
    setEditingValues({});
  };

  const handleEditMaterial = (catIdx, itemIdx) => {
    const key = `${catIdx}-${itemIdx}`;
    setEditingMaterial(key);
    const item = materials[catIdx].items[itemIdx];
    setEditingValues(prev => ({
      ...prev,
      [`${key}-qty`]: editingValues[`${key}-qty`] !== undefined ? editingValues[`${key}-qty`] : item.quantity,
      [`${key}-price`]: editingValues[`${key}-price`] !== undefined ? editingValues[`${key}-price`] : item.unitCost,
    }));
  };

  const handleSaveEdit = () => {
    setEditingMaterial(null);
    toast.success('Material updated');
  };

  const handleAddMaterial = () => {
    if (!newMaterialForm.part || !newMaterialForm.description) {
      toast.error('Please fill in all fields');
      return;
    }
    setCustomMaterials([...customMaterials, { ...newMaterialForm, id: Date.now() }]);
    setNewMaterialForm({ part: '', description: '', quantity: 1, unit: 'EA', unitCost: 0 });
    setShowMaterialDialog(false);
    toast.success('Material added to list');
  };

  const handleRemoveMaterial = (materialId) => {
    setCustomMaterials(customMaterials.filter(m => m.id !== materialId));
    toast.success('Material removed');
  };

  const toggleRequirement = (category, index) => {
    const key = `${category}-${index}`;
    setCheckedRequirements(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleCreateProject = () => {
    if (!selectedSystem || !selectedSize) {
      toast.error('Please select a system and size');
      return;
    }
    setShowProjectForm(true);
  };

  const handleConfirmCreateProject = async () => {
    if (!projectName.trim()) {
      toast.error('Please enter a project name');
      return;
    }

    setIsCreatingProject(true);
    try {
      // Prepare materials data from current system
      const materialsData = [];
      materials.forEach((category, catIdx) => {
        category.items.forEach((item, itemIdx) => {
          const key = `${catIdx}-${itemIdx}`;
          const qty = editingValues[`${key}-qty`] !== undefined ? editingValues[`${key}-qty`] : item.quantity;
          const price = editingValues[`${key}-price`] !== undefined ? editingValues[`${key}-price`] : item.unitCost;
          materialsData.push({
            name: item.part,
            description: item.description,
            category: category.category,
            quantity: qty,
            unit: item.unit,
            unit_cost: price,
            supplier: item.manufacturer,
            notes: item.notes || `Part #: ${item.partNumber}`
          });
        });
      });

      // Add custom materials
      customMaterials.forEach(mat => {
        materialsData.push({
          name: mat.part,
          description: mat.description,
          category: 'Custom',
          quantity: mat.quantity,
          unit: mat.unit,
          unit_cost: mat.unitCost,
          supplier: '',
          notes: 'Added from System Builder'
        });
      });

      // Create project
      const projectData = {
        name: projectName,
        description: projectDescription || `${system.name} - ${size.name}`,
        client_name: organization?.name || 'New Client',
        organization_id: organization?.id,
        status: 'planning',
        budget: totalMaterialCost,
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        progress: 0,
        current_phase: 'preconstruction',
        project_manager: user?.name || 'Project Manager',
        system_type: system.id,
        system_size: size.id
      };

      const newProject = await createProjectMutation.mutateAsync(projectData);
      
      // Create materials for the project
      await createMaterialsMutation.mutateAsync({
        projectId: newProject.id,
        materialsData
      });

      setShowProjectForm(false);
      setProjectName('');
      setProjectDescription('');
      
    } catch (error) {
      toast.error('Failed to create project: ' + error.message);
    } finally {
      setIsCreatingProject(false);
    }
  };

  // Step 1: System Selection
    if (currentStep === 'systems') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-slate-900 mb-2">System Builder</h1>
            <p className="text-lg text-slate-600">
              Design professional systems with accurate pricing, editable materials, and auto-generated phases
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {systemDesigns.systems.map(sys => {
              const IconComponent = systemIcons[sys.id];
              return (
                <Card
                  key={sys.id}
                  className="cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-105 border-2 hover:border-accent"
                  onClick={() => handleSystemSelect(sys.id)}
                >
                  <CardHeader>
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${sys.color} flex items-center justify-center mb-3`}>
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle className="text-xl">{sys.name}</CardTitle>
                    <CardDescription>{sys.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-600">
                        {sys.sizes.length} size options
                      </span>
                      <ChevronRight className="w-5 h-5 text-accent" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Size Selection
  if (currentStep === 'sizes' && system) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => {
                setCurrentStep('systems');
                setSelectedSystem(null);
              }}
              className="mb-4"
            >
              ← Back to Systems
            </Button>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">{system.name}</h1>
            <p className="text-lg text-slate-600">{system.description}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {system.sizes.map(size => (
              <Card
                key={size.id}
                className="cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-105 border-2 hover:border-accent"
                onClick={() => handleSizeSelect(size.id)}
              >
                <CardHeader>
                  <CardTitle className="text-2xl">{size.name}</CardTitle>
                  <CardDescription className="text-base">
                    {size.sqft || size.cameras || size.doors || size.zones}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-slate-600 mb-2">Applications:</p>
                    <div className="flex flex-wrap gap-1">
                      {(size.applications || []).slice(0, 2).map((app, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {app}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-3 border-t">
                    <div>
                      <p className="text-xs text-slate-600">Cost Range</p>
                      <p className="font-bold text-accent">{size.costRange}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600">Timeline</p>
                      <p className="font-bold text-accent">{size.timeline}</p>
                    </div>
                  </div>

                  <Button className="w-full mt-4 gap-2">
                    Select <ChevronRight className="w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Step 3: System Builder
  if (currentStep === 'builder' && system && size) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setCurrentStep('sizes');
                    setSelectedSize(null);
                  }}
                >
                  ← Back
                </Button>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">{system.name}</h1>
                  <p className="text-sm text-slate-600">{size.name}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={handleCreateProject}
                disabled={isCreatingProject}
                className="gap-2 bg-accent hover:bg-accent/90"
              >
                <Zap className="w-4 h-4" />
                {isCreatingProject ? 'Creating...' : 'Create Project'}
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          <Tabs defaultValue="materials" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="materials">Materials</TabsTrigger>
              <TabsTrigger value="phases">Phases</TabsTrigger>
              <TabsTrigger value="requirements">Requirements</TabsTrigger>
              <TabsTrigger value="summary">Summary</TabsTrigger>
            </TabsList>

            {/* Materials Tab */}
            <TabsContent value="materials" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Material List */}
                <div className="lg:col-span-2 space-y-4">
                  {materials.map((category, catIdx) => (
                    <Card key={catIdx}>
                      <CardHeader>
                        <CardTitle className="text-lg">{category.category}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {category.items.map((item, itemIdx) => {
                            const key = `${catIdx}-${itemIdx}`;
                            const isEditing = editingMaterial === key;
                            const qty = editingValues[`${key}-qty`] !== undefined ? editingValues[`${key}-qty`] : item.quantity;
                            const price = editingValues[`${key}-price`] !== undefined ? editingValues[`${key}-price`] : item.unitCost;
                            const total = qty * price;

                            return (
                              <div key={itemIdx} className="p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-slate-900">{item.part}</p>
                                    <p className="text-sm text-slate-600">{item.description}</p>
                                    <p className="text-xs text-slate-500 mt-1">
                                      {item.manufacturer} • {item.partNumber}
                                    </p>
                                    {item.notes && (
                                      <p className="text-xs text-slate-500 italic mt-1">{item.notes}</p>
                                    )}
                                  </div>

                                  {isEditing ? (
                                    <div className="flex-shrink-0 flex gap-2">
                                      <div className="flex flex-col gap-1">
                                        <input
                                          type="number"
                                          min="0"
                                          step="0.1"
                                          value={qty}
                                          onChange={(e) => setEditingValues(prev => ({
                                            ...prev,
                                            [`${key}-qty`]: parseFloat(e.target.value) || 0
                                          }))}
                                          className="w-16 px-2 py-1 text-sm border border-slate-300 rounded"
                                          placeholder="Qty"
                                        />
                                        <input
                                          type="number"
                                          min="0"
                                          step="0.01"
                                          value={price}
                                          onChange={(e) => setEditingValues(prev => ({
                                            ...prev,
                                            [`${key}-price`]: parseFloat(e.target.value) || 0
                                          }))}
                                          className="w-16 px-2 py-1 text-sm border border-slate-300 rounded"
                                          placeholder="Price"
                                        />
                                      </div>
                                      <div className="flex gap-1">
                                        <Button
                                          size="sm"
                                          variant="default"
                                          onClick={handleSaveEdit}
                                          className="bg-green-600 hover:bg-green-700"
                                        >
                                          <Save className="w-3 h-3" />
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => setEditingMaterial(null)}
                                        >
                                          <X className="w-3 h-3" />
                                        </Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="text-right ml-4 flex-shrink-0">
                                      <p className="text-sm font-medium text-slate-900">
                                        {qty} {item.unit}
                                      </p>
                                      <p className="text-sm text-slate-600">
                                        ${price.toFixed(2)} ea
                                      </p>
                                      <p className="text-sm text-accent font-bold">
                                        ${total.toFixed(2)}
                                      </p>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleEditMaterial(catIdx, itemIdx)}
                                        className="mt-2"
                                      >
                                        <Edit2 className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {/* Custom Materials */}
                  {customMaterials.length > 0 && (
                    <Card className="border-2 border-accent/50">
                      <CardHeader>
                        <CardTitle className="text-lg">Custom Materials</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {customMaterials.map(material => (
                          <div
                            key={material.id}
                            className="flex items-start justify-between p-3 bg-accent/10 rounded-lg"
                          >
                            <div className="flex-1">
                              <p className="font-medium text-slate-900">{material.part}</p>
                              <p className="text-sm text-slate-600">{material.description}</p>
                            </div>
                            <div className="text-right ml-4">
                              <p className="text-sm font-medium text-slate-900">
                                {material.quantity} {material.unit}
                              </p>
                              <p className="text-sm text-accent font-bold">
                                ${(material.quantity * material.unitCost).toFixed(2)}
                              </p>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleRemoveMaterial(material.id)}
                                className="mt-2"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}

                  <Button
                    onClick={() => setShowMaterialDialog(true)}
                    variant="outline"
                    className="w-full gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Custom Material
                  </Button>
                </div>

                {/* Cost Summary */}
                <div className="space-y-4">
                  <Card className="border-2 border-accent/50 bg-gradient-to-br from-accent/10 to-accent/5">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <DollarSign className="w-5 h-5" />
                        Cost Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {materials.map((cat, idx) => {
                          const catCost = cat.items.reduce((sum, item, itemIdx) => {
                            const key = `${idx}-${itemIdx}`;
                            const qty = editingValues[`${key}-qty`] !== undefined ? editingValues[`${key}-qty`] : item.quantity;
                            const price = editingValues[`${key}-price`] !== undefined ? editingValues[`${key}-price`] : item.unitCost;
                            return sum + (qty * price);
                          }, 0);
                          return (
                            <div key={idx} className="flex justify-between text-sm">
                              <span className="text-slate-600">{cat.category}</span>
                              <span className="font-medium">${catCost.toFixed(2)}</span>
                            </div>
                          );
                        })}
                      </div>
                      <div className="border-t pt-3">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-lg">Total Materials</span>
                          <span className="text-2xl font-bold text-accent">
                            ${totalMaterialCost.toFixed(2)}
                          </span>
                        </div>
                      </div>
                      <div className="bg-white rounded-lg p-3 text-sm text-slate-600">
                        <p className="font-medium mb-1">Estimated Project Cost:</p>
                        <p className="text-lg font-bold text-slate-900">{size.costRange}</p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Timeline */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="w-5 h-5" />
                        Timeline
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-accent">{size.timeline}</p>
                      <p className="text-sm text-slate-600 mt-2">Estimated project duration</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* Phases Tab */}
            <TabsContent value="phases">
              <div className="space-y-4">
                {phases.map((phase, idx) => (
                  <Card key={idx} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <Badge className="bg-accent">{`Phase ${phase.phase}`}</Badge>
                            <CardTitle className="text-lg">{phase.name}</CardTitle>
                          </div>
                          <CardDescription>{phase.description}</CardDescription>
                        </div>
                        <Badge variant="outline">{phase.duration}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {phase.tasks.map((task, taskIdx) => (
                          <li key={taskIdx} className="flex items-start gap-3">
                            <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                            <span className="text-slate-700">{task}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Requirements Tab */}
            <TabsContent value="requirements">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {requirements.map((reqGroup, groupIdx) => (
                  <Card key={groupIdx}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-accent" />
                        {reqGroup.category}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3">
                        {reqGroup.items.map((item, itemIdx) => {
                          const key = `${groupIdx}-${itemIdx}`;
                          const isChecked = checkedRequirements[key];
                          return (
                            <li
                              key={itemIdx}
                              className="flex items-start gap-3 cursor-pointer p-2 rounded-lg hover:bg-slate-50 transition-colors"
                              onClick={() => toggleRequirement(groupIdx, itemIdx)}
                            >
                              <div
                                className={`w-5 h-5 rounded border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-all ${
                                  isChecked
                                    ? 'bg-accent border-accent'
                                    : 'border-slate-300 hover:border-accent'
                                }`}
                              >
                                {isChecked && <CheckCircle2 className="w-4 h-4 text-white" />}
                              </div>
                              <span
                                className={`text-slate-700 ${isChecked ? 'line-through text-slate-400' : ''}`}
                              >
                                {item}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Summary Tab */}
            <TabsContent value="summary">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
                  <CardHeader>
                    <CardTitle className="text-lg">System Type</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-blue-600">{system.name}</p>
                    <p className="text-sm text-slate-600 mt-2">{size.name}</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-50 to-green-100">
                  <CardHeader>
                    <CardTitle className="text-lg">Total Cost</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-green-600">
                      ${totalMaterialCost.toFixed(2)}
                    </p>
                    <p className="text-sm text-slate-600 mt-2">{size.costRange}</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
                  <CardHeader>
                    <CardTitle className="text-lg">Timeline</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-purple-600">{size.timeline}</p>
                    <p className="text-sm text-slate-600 mt-2">{phases.length} phases</p>
                  </CardContent>
                </Card>
              </div>

              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Ready to Create Project?</CardTitle>
                  <CardDescription>
                    This will create a new project with all materials, phases, and requirements
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex gap-3">
                  <Button
                    onClick={handleCreateProject}
                    disabled={isCreatingProject}
                    className="gap-2 bg-accent hover:bg-accent/90"
                  >
                    <Zap className="w-4 h-4" />
                    {isCreatingProject ? 'Creating...' : 'Create Project'}
                  </Button>
                  <Button variant="outline" className="gap-2">
                    <Download className="w-4 h-4" />
                    Export PDF
                  </Button>
                  <Button variant="outline" className="gap-2">
                    <Share2 className="w-4 h-4" />
                    Share Design
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Add Material Dialog */}
        <Dialog open={showMaterialDialog} onOpenChange={setShowMaterialDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Custom Material</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Material Name"
                value={newMaterialForm.part}
                onChange={(e) => setNewMaterialForm(prev => ({ ...prev, part: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
              <input
                type="text"
                placeholder="Description"
                value={newMaterialForm.description}
                onChange={(e) => setNewMaterialForm(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  placeholder="Quantity"
                  min="0"
                  step="0.1"
                  value={newMaterialForm.quantity}
                  onChange={(e) => setNewMaterialForm(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))}
                  className="px-3 py-2 border border-slate-300 rounded-lg"
                />
                <input
                  type="text"
                  placeholder="Unit (EA, FT, etc.)"
                  value={newMaterialForm.unit}
                  onChange={(e) => setNewMaterialForm(prev => ({ ...prev, unit: e.target.value }))}
                  className="px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <input
                type="number"
                placeholder="Unit Cost ($)"
                min="0"
                step="0.01"
                value={newMaterialForm.unitCost}
                onChange={(e) => setNewMaterialForm(prev => ({ ...prev, unitCost: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowMaterialDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddMaterial}>
                Add Material
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create Project Dialog */}
        <Dialog open={showProjectForm} onOpenChange={setShowProjectForm}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create Project from System Design</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Project Name *</label>
                <input
                  type="text"
                  placeholder="e.g., Downtown Office Fire Alarm"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <textarea
                  placeholder="Project description (optional)"
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg mt-1 h-24"
                />
              </div>
              <div className="bg-slate-50 p-3 rounded-lg">
                <p className="text-sm font-medium text-slate-900">System Details:</p>
                <p className="text-sm text-slate-600 mt-1">{system?.name} - {size?.name}</p>
                <p className="text-sm text-slate-600">Materials: {materials.reduce((sum, cat) => sum + cat.items.length, 0) + customMaterials.length}</p>
                <p className="text-sm font-bold text-accent mt-2">Total Cost: ${totalMaterialCost.toFixed(2)}</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowProjectForm(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleConfirmCreateProject}
                disabled={isCreatingProject}
                className="bg-accent hover:bg-accent/90"
              >
                {isCreatingProject ? 'Creating...' : 'Create Project'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return null;
}
