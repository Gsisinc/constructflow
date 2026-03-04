import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Upload, FileText } from 'lucide-react';
import { toast } from 'sonner';

export default function PermitUploader({ projectId, phaseName }) {
  const [showDialog, setShowDialog] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    permit_type: 'building',
    description: '',
    phase_name: phaseName || ''
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const queryClient = useQueryClient();

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a file');
      return;
    }

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: selectedFile });
      
      await base44.entities.Permit.create({
        project_id: projectId,
        permit_type: formData.permit_type,
        description: formData.description,
        phase_name: formData.phase_name,
        file_url: file_url,
        status: 'submitted',
        application_date: new Date().toISOString().split('T')[0]
      });

      queryClient.invalidateQueries({ queryKey: ['permits'] });
      setShowDialog(false);
      setSelectedFile(null);
      setFormData({ permit_type: 'building', description: '', phase_name: phaseName || '' });
      toast.success('Permit uploaded');
    } catch (error) {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogTrigger asChild>
        <Button>
          <Upload className="h-4 w-4 mr-2" />
          Upload Permit
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload Permit</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Permit Type</Label>
            <Select value={formData.permit_type} onValueChange={(value) => setFormData({ ...formData, permit_type: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="building">Building</SelectItem>
                <SelectItem value="electrical">Electrical</SelectItem>
                <SelectItem value="plumbing">Plumbing</SelectItem>
                <SelectItem value="mechanical">Mechanical</SelectItem>
                <SelectItem value="fire">Fire</SelectItem>
                <SelectItem value="demolition">Demolition</SelectItem>
                <SelectItem value="environmental">Environmental</SelectItem>
                <SelectItem value="occupancy">Occupancy</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Phase (Optional)</Label>
            <Input
              value={formData.phase_name}
              onChange={(e) => setFormData({ ...formData, phase_name: e.target.value })}
              placeholder="Associated phase"
            />
          </div>

          <div>
            <Label>Description</Label>
            <Input
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description"
            />
          </div>

          <div>
            <Label>Permit File</Label>
            <label className="flex items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-slate-50">
              {selectedFile ? (
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-slate-600" />
                  <span className="text-sm">{selectedFile.name}</span>
                </div>
              ) : (
                <div className="text-center">
                  <Upload className="h-8 w-8 mx-auto text-slate-400 mb-2" />
                  <p className="text-sm text-slate-600">Click to upload permit file</p>
                </div>
              )}
              <input
                type="file"
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setSelectedFile(e.target.files[0])}
              />
            </label>
          </div>

          <Button onClick={handleUpload} disabled={uploading} className="w-full">
            {uploading ? 'Uploading...' : 'Upload Permit'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}