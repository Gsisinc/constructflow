import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Upload, Send, FileText, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function AdminClientManager({ projectId }) {
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const queryClient = useQueryClient();

  const { data: updates = [] } = useQuery({
    queryKey: ['clientUpdates', projectId],
    queryFn: () => base44.entities.ClientUpdate.filter({ project_id: projectId }, '-created_date'),
    enabled: !!projectId
  });

  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => base44.entities.Project.filter({ id: projectId }).then(p => p[0]),
    enabled: !!projectId
  });

  const createUpdateMutation = useMutation({
    mutationFn: (data) => base44.entities.ClientUpdate.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientUpdates'] });
      setShowUpdateDialog(false);
      setUpdateForm({ update_type: 'progress', message: '', milestone_name: '', photo_urls: [] });
      toast.success('Update sent to client');
    }
  });

  const deleteUpdateMutation = useMutation({
    mutationFn: (id) => base44.entities.ClientUpdate.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientUpdates'] });
      toast.success('Update deleted');
    }
  });

  const [updateForm, setUpdateForm] = useState({
    update_type: 'progress',
    message: '',
    milestone_name: '',
    photo_urls: []
  });

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingPhoto(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setUpdateForm({ ...updateForm, photo_urls: [...updateForm.photo_urls, file_url] });
      toast.success('Photo uploaded');
    } catch (error) {
      toast.error('Upload failed');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const removePhoto = (index) => {
    const newPhotos = [...updateForm.photo_urls];
    newPhotos.splice(index, 1);
    setUpdateForm({ ...updateForm, photo_urls: newPhotos });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Client Portal Updates</CardTitle>
              <p className="text-sm text-slate-500 mt-1">
                Share progress with {project?.client_name}
              </p>
            </div>
            <Dialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Send Update
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Send Client Update</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Update Type</Label>
                    <Select value={updateForm.update_type} onValueChange={(value) => setUpdateForm({ ...updateForm, update_type: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="progress">Progress Update</SelectItem>
                        <SelectItem value="milestone">Milestone Achieved</SelectItem>
                        <SelectItem value="issue">Issue Alert</SelectItem>
                        <SelectItem value="schedule">Schedule Update</SelectItem>
                        <SelectItem value="comment">General Comment</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {updateForm.update_type === 'milestone' && (
                    <div>
                      <Label>Milestone Name</Label>
                      <Input
                        value={updateForm.milestone_name}
                        onChange={(e) => setUpdateForm({ ...updateForm, milestone_name: e.target.value })}
                        placeholder="e.g., Foundation Complete"
                      />
                    </div>
                  )}

                  <div>
                    <Label>Message</Label>
                    <Textarea
                      value={updateForm.message}
                      onChange={(e) => setUpdateForm({ ...updateForm, message: e.target.value })}
                      placeholder="Share project updates, progress, or important information..."
                      rows={5}
                    />
                  </div>

                  <div>
                    <Label>Photos / 3D Models</Label>
                    <div className="space-y-3">
                      <label className="block">
                        <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 transition-colors">
                          {uploadingPhoto ? (
                            <div className="py-4">
                              <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-2" />
                              <p className="text-sm text-slate-500">Uploading...</p>
                            </div>
                          ) : (
                            <>
                              <Upload className="h-8 w-8 mx-auto mb-2 text-slate-400" />
                              <p className="text-sm text-slate-600">Click to upload photos or 3D models</p>
                              <p className="text-xs text-slate-400 mt-1">PNG, JPG, JPEG, GLB, OBJ</p>
                            </>
                          )}
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          onChange={handlePhotoUpload}
                          accept="image/*,.glb,.obj"
                          disabled={uploadingPhoto}
                        />
                      </label>

                      {updateForm.photo_urls.length > 0 && (
                        <div className="grid grid-cols-4 gap-3">
                          {updateForm.photo_urls.map((url, index) => (
                            <div key={index} className="relative group">
                              <img src={url} alt="Upload" className="w-full h-24 object-cover rounded-lg" />
                              <button
                                onClick={() => removePhoto(index)}
                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <Button
                    onClick={() => createUpdateMutation.mutate({
                      project_id: projectId,
                      ...updateForm,
                      sent_by: 'admin'
                    })}
                    className="w-full"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Send to Client
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {updates.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <FileText className="h-12 w-12 mx-auto mb-3 text-slate-300" />
              <p>No updates sent yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {updates.map(update => (
                <div key={update.id} className="border rounded-lg p-4 hover:bg-slate-50">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={update.update_type === 'milestone' ? 'default' : 'outline'}>
                        {update.update_type}
                      </Badge>
                      {update.milestone_name && (
                        <span className="font-semibold">{update.milestone_name}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-500">
                        {format(new Date(update.created_date), 'MMM dd, yyyy')}
                      </span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-red-600 hover:bg-red-50"
                        onClick={() => {
                          if (confirm('Delete this update?')) {
                            deleteUpdateMutation.mutate(update.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-slate-700 mb-2">{update.message}</p>
                  {update.photo_urls && update.photo_urls.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      {update.photo_urls.map((url, idx) => (
                        <img key={idx} src={url} alt="Update" className="w-20 h-20 object-cover rounded-lg" />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}