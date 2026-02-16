import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Camera,
  Plus,
  Download,
  Trash2,
  Edit2,
  Save,
  X,
  Pen,
  Type,
  Circle,
  Square,
  ArrowRight,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Share2
} from 'lucide-react';

export default function PhotoDocumentation() {
  const [photos, setPhotos] = useState([
    {
      id: 'PHOTO-001',
      url: 'https://via.placeholder.com/400x300?text=Foundation+Work',
      title: 'Foundation Excavation',
      project: 'Project A',
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      location: 'Site 1 - Foundation Area',
      category: 'Progress',
      uploadedBy: 'John Smith',
      markup: [],
      notes: 'Excavation completed as per plan',
      tags: ['excavation', 'foundation', 'progress']
    },
    {
      id: 'PHOTO-002',
      url: 'https://via.placeholder.com/400x300?text=Steel+Installation',
      title: 'Steel Frame Installation',
      project: 'Project B',
      date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      location: 'Building 5 - Main Frame',
      category: 'Progress',
      uploadedBy: 'Mike Johnson',
      markup: [],
      notes: 'Steel beams installed on schedule',
      tags: ['steel', 'framing', 'progress']
    }
  ]);

  const [showUploadForm, setShowUploadForm] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [editingMarkup, setEditingMarkup] = useState(false);
  const [markupTool, setMarkupTool] = useState('pen');
  const [markupColor, setMarkupColor] = useState('#FF0000');
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  const [newPhoto, setNewPhoto] = useState({
    title: '',
    project: '',
    location: '',
    category: 'Progress',
    notes: '',
    tags: ''
  });

  const categories = ['Progress', 'Issue', 'Safety', 'Quality', 'Inspection', 'Completion'];
  const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#000000', '#FFFFFF'];

  const handleAddPhoto = () => {
    if (newPhoto.title && newPhoto.project) {
      const photo = {
        id: `PHOTO-${String(photos.length + 1).padStart(3, '0')}`,
        url: 'https://via.placeholder.com/400x300?text=' + encodeURIComponent(newPhoto.title),
        ...newPhoto,
        date: new Date(),
        uploadedBy: 'Current User',
        markup: [],
        tags: newPhoto.tags.split(',').map(t => t.trim()).filter(t => t)
      };
      setPhotos([...photos, photo]);
      setNewPhoto({
        title: '',
        project: '',
        location: '',
        category: 'Progress',
        notes: '',
        tags: ''
      });
      setShowUploadForm(false);
    }
  };

  const handleStartMarkup = (photo) => {
    setSelectedPhoto(photo);
    setEditingMarkup(true);
  };

  const handleSaveMarkup = () => {
    // In a real app, save the canvas drawing
    setEditingMarkup(false);
  };

  const handleDeletePhoto = (photoId) => {
    setPhotos(photos.filter(p => p.id !== photoId));
    if (selectedPhoto?.id === photoId) {
      setSelectedPhoto(null);
    }
  };

  const handleDownloadPhoto = (photo) => {
    // In a real app, trigger download
    console.log('Downloading:', photo.title);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Camera className="w-8 h-8 text-purple-600" />
            Photo Documentation
          </h1>
          <p className="text-slate-600 mt-1">Capture and annotate site photos with markup tools</p>
        </div>
        <Button onClick={() => setShowUploadForm(!showUploadForm)} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Photo
        </Button>
      </div>

      {/* Upload Form */}
      {showUploadForm && (
        <Card className="border-2 border-purple-200 bg-purple-50">
          <CardHeader>
            <CardTitle>Upload Photo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Photo Title</label>
                <Input
                  placeholder="e.g., Foundation Excavation"
                  value={newPhoto.title}
                  onChange={(e) => setNewPhoto({ ...newPhoto, title: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Project</label>
                <Input
                  placeholder="e.g., Project A"
                  value={newPhoto.project}
                  onChange={(e) => setNewPhoto({ ...newPhoto, project: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Location</label>
                <Input
                  placeholder="e.g., Site 1 - Foundation Area"
                  value={newPhoto.location}
                  onChange={(e) => setNewPhoto({ ...newPhoto, location: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Category</label>
                <Select value={newPhoto.category} onValueChange={(value) => setNewPhoto({ ...newPhoto, category: value })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Notes</label>
              <textarea
                placeholder="Add notes about this photo..."
                value={newPhoto.notes}
                onChange={(e) => setNewPhoto({ ...newPhoto, notes: e.target.value })}
                className="w-full mt-1 p-2 border rounded-lg text-sm"
                rows="2"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Tags (comma-separated)</label>
              <Input
                placeholder="e.g., excavation, foundation, progress"
                value={newPhoto.tags}
                onChange={(e) => setNewPhoto({ ...newPhoto, tags: e.target.value })}
                className="mt-1"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowUploadForm(false)}>Cancel</Button>
              <Button onClick={handleAddPhoto}>Add Photo</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Photo Editor Modal */}
      {editingMarkup && selectedPhoto && (
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Edit Photo - {selectedPhoto.title}</CardTitle>
              <Button variant="outline" size="sm" onClick={() => setEditingMarkup(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-4 gap-2 mb-4">
              <div>
                <label className="text-xs font-medium mb-1 block">Tool</label>
                <Select value={markupTool} onValueChange={setMarkupTool}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pen">Pen</SelectItem>
                    <SelectItem value="arrow">Arrow</SelectItem>
                    <SelectItem value="circle">Circle</SelectItem>
                    <SelectItem value="rectangle">Rectangle</SelectItem>
                    <SelectItem value="text">Text</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">Color</label>
                <div className="flex gap-1 flex-wrap">
                  {colors.map(color => (
                    <button
                      key={color}
                      className="w-8 h-8 rounded border-2"
                      style={{
                        backgroundColor: color,
                        borderColor: markupColor === color ? '#000' : '#ccc'
                      }}
                      onClick={() => setMarkupColor(color)}
                    />
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">Zoom</label>
                <div className="flex gap-1">
                  <Button variant="outline" size="sm"><ZoomIn className="w-4 h-4" /></Button>
                  <Button variant="outline" size="sm"><ZoomOut className="w-4 h-4" /></Button>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">Actions</label>
                <Button variant="outline" size="sm"><RotateCw className="w-4 h-4" /></Button>
              </div>
            </div>

            <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 bg-white">
              <img
                src={selectedPhoto.url}
                alt={selectedPhoto.title}
                className="w-full h-auto rounded"
              />
              <canvas
                ref={canvasRef}
                className="absolute top-0 left-0 cursor-crosshair"
                style={{ display: 'none' }}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setEditingMarkup(false)}>Cancel</Button>
              <Button onClick={handleSaveMarkup} className="gap-2">
                <Save className="w-4 h-4" />
                Save Markup
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Photos Grid */}
      <div className="grid grid-cols-3 gap-4">
        {photos.map(photo => (
          <Card key={photo.id} className="hover:shadow-lg transition-shadow overflow-hidden">
            <div className="relative">
              <img
                src={photo.url}
                alt={photo.title}
                className="w-full h-48 object-cover"
              />
              <div className="absolute top-2 right-2 flex gap-1">
                <Badge className="bg-purple-100 text-purple-800">{photo.category}</Badge>
              </div>
            </div>
            <CardContent className="pt-4">
              <h3 className="font-bold text-sm mb-1">{photo.title}</h3>
              <p className="text-xs text-slate-600 mb-2">{photo.project} • {photo.location}</p>
              <p className="text-xs text-slate-600 mb-3">{photo.date.toLocaleDateString()} • {photo.uploadedBy}</p>

              {photo.notes && (
                <p className="text-xs text-slate-700 mb-3 p-2 bg-slate-50 rounded">{photo.notes}</p>
              )}

              {photo.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {photo.tags.map(tag => (
                    <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 gap-1"
                  onClick={() => handleStartMarkup(photo)}
                >
                  <Edit2 className="w-3 h-3" />
                  Markup
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 gap-1"
                  onClick={() => handleDownloadPhoto(photo)}
                >
                  <Download className="w-3 h-3" />
                  Download
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeletePhoto(photo.id)}
                  className="text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {photos.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="pt-12 pb-12 text-center">
            <Camera className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600">No photos yet. Upload your first photo to get started.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
