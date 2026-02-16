import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Image,
  Download,
  Share2,
  Eye,
  Calendar,
  MapPin,
  User,
  ZoomIn,
  ChevronLeft,
  ChevronRight,
  Grid,
  List
} from 'lucide-react';

export default function ProjectPhotoGallery() {
  const [photos] = useState([
    {
      id: 'PHOTO-001',
      url: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=400&h=300&fit=crop',
      title: 'Foundation Excavation',
      category: 'Foundation',
      date: new Date('2024-01-20'),
      location: 'Main Site - East Wing',
      uploadedBy: 'John Smith',
      description: 'Initial foundation excavation and site preparation complete',
      tags: ['excavation', 'foundation', 'phase-1']
    },
    {
      id: 'PHOTO-002',
      url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&h=300&fit=crop',
      title: 'Concrete Foundation Pour',
      category: 'Foundation',
      date: new Date('2024-02-10'),
      location: 'Main Site - East Wing',
      uploadedBy: 'Sarah Johnson',
      description: 'Concrete foundation pour in progress',
      tags: ['concrete', 'foundation', 'phase-1']
    },
    {
      id: 'PHOTO-003',
      url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=400&h=300&fit=crop',
      title: 'Steel Frame Installation',
      category: 'Structural',
      date: new Date('2024-03-15'),
      location: 'Main Site - All Areas',
      uploadedBy: 'Mike Davis',
      description: 'Steel frame installation for main structure',
      tags: ['steel', 'structural', 'phase-2']
    },
    {
      id: 'PHOTO-004',
      url: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=400&h=300&fit=crop',
      title: 'Electrical Rough-In',
      category: 'MEP',
      date: new Date('2024-04-05'),
      location: 'Main Site - East Wing',
      uploadedBy: 'John Smith',
      description: 'Electrical rough-in work in progress',
      tags: ['electrical', 'mep', 'phase-2']
    },
    {
      id: 'PHOTO-005',
      url: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=400&h=300&fit=crop',
      title: 'HVAC Ductwork Installation',
      category: 'MEP',
      date: new Date('2024-04-12'),
      location: 'Main Site - All Areas',
      uploadedBy: 'Sarah Johnson',
      description: 'HVAC ductwork installation throughout building',
      tags: ['hvac', 'mep', 'phase-2']
    },
    {
      id: 'PHOTO-006',
      url: 'https://images.unsplash.com/photo-1503387762-592f081d58eb?w=400&h=300&fit=crop',
      title: 'Drywall Installation',
      category: 'Interior',
      date: new Date('2024-04-20'),
      location: 'Main Site - East Wing',
      uploadedBy: 'Mike Davis',
      description: 'Interior drywall installation beginning',
      tags: ['drywall', 'interior', 'phase-3']
    }
  ]);

  const [filterCategory, setFilterCategory] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  const categories = ['Foundation', 'Structural', 'MEP', 'Interior', 'Exterior', 'Finishes'];

  const filteredPhotos = filterCategory === 'all'
    ? photos
    : photos.filter(p => p.category === filterCategory);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Image className="w-8 h-8 text-blue-600" />
            Project Photo Gallery
          </h1>
          <p className="text-slate-600 mt-1">Track project progress with photos from the field</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-4">
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(cat => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="text-sm text-slate-600 flex items-center">
          {filteredPhotos.length} photos
        </div>
      </div>

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-3 gap-4">
          {filteredPhotos.map((photo) => (
            <Card
              key={photo.id}
              className="cursor-pointer hover:shadow-lg transition-shadow overflow-hidden"
              onClick={() => setSelectedPhoto(photo)}
            >
              <div className="relative overflow-hidden bg-slate-200 h-48">
                <img
                  src={photo.url}
                  alt={photo.title}
                  className="w-full h-full object-cover hover:scale-110 transition-transform"
                />
                <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center">
                  <ZoomIn className="w-8 h-8 text-white opacity-0 hover:opacity-100 transition-opacity" />
                </div>
              </div>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-sm">{photo.title}</h3>
                  <Badge variant="outline" className="text-xs">{photo.category}</Badge>
                </div>
                <p className="text-xs text-slate-600 mb-2">{photo.description}</p>
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
                  <Calendar className="w-3 h-3" />
                  {photo.date.toLocaleDateString()}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1 gap-1">
                    <Eye className="w-3 h-3" />
                    View
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1 gap-1">
                    <Download className="w-3 h-3" />
                    Download
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="space-y-3">
          {filteredPhotos.map((photo) => (
            <Card
              key={photo.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setSelectedPhoto(photo)}
            >
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  <div className="w-32 h-24 flex-shrink-0 bg-slate-200 rounded overflow-hidden">
                    <img
                      src={photo.url}
                      alt={photo.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{photo.title}</h3>
                      <Badge variant="outline">{photo.category}</Badge>
                    </div>
                    <p className="text-sm text-slate-600 mb-3">{photo.description}</p>
                    <div className="grid grid-cols-4 gap-4 text-sm text-slate-600 mb-3">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {photo.date.toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {photo.location}
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {photo.uploadedBy}
                      </div>
                      <div className="flex gap-1">
                        {photo.tags.map(tag => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="gap-2">
                      <Eye className="w-4 h-4" />
                      View
                    </Button>
                    <Button size="sm" variant="outline" className="gap-2">
                      <Download className="w-4 h-4" />
                      Download
                    </Button>
                    <Button size="sm" variant="outline" className="gap-2">
                      <Share2 className="w-4 h-4" />
                      Share
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Photo Viewer Modal */}
      {selectedPhoto && (
        <Card className="border-2 border-blue-500">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{selectedPhoto.title}</CardTitle>
                <CardDescription>{selectedPhoto.description}</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedPhoto(null)}
              >
                Close
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-slate-100 rounded-lg overflow-hidden max-h-96">
                <img
                  src={selectedPhoto.url}
                  alt={selectedPhoto.title}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-600">Category</p>
                  <p className="font-semibold">{selectedPhoto.category}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Date</p>
                  <p className="font-semibold">{selectedPhoto.date.toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Location</p>
                  <p className="font-semibold">{selectedPhoto.location}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Uploaded By</p>
                  <p className="font-semibold">{selectedPhoto.uploadedBy}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-2">Tags</p>
                <div className="flex gap-2 flex-wrap">
                  {selectedPhoto.tags.map(tag => (
                    <Badge key={tag} variant="secondary">{tag}</Badge>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Button className="flex-1 gap-2">
                  <Download className="w-4 h-4" />
                  Download Full Resolution
                </Button>
                <Button variant="outline" className="flex-1 gap-2">
                  <Share2 className="w-4 h-4" />
                  Share
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
