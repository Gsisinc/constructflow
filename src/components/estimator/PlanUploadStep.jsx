import React, { useState } from 'react';
import { Upload, FileText, AlertCircle, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';

export default function PlanUploadStep({ data, onComplete }) {
  const [planFile, setPlanFile] = useState(data.planFile || null);
  const [specFiles, setSpecFiles] = useState(data.specFiles || []);
  const [manualScale, setManualScale] = useState(data.planScale || '');
  const [uploading, setUploading] = useState(false);

  const handlePlanUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['application/pdf', 'image/jpeg', 'image/png'].includes(file.type) && !file.name.endsWith('.dwg')) {
      toast.error('Only PDF, DWG, JPEG, and PNG files accepted');
      return;
    }

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setPlanFile({ name: file.name, url: file_url, type: file.type });
      toast.success('Plan uploaded');
    } catch (error) {
      toast.error(`Upload failed: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleSpecUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setUploading(true);
    try {
      for (const file of files) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        setSpecFiles(prev => [...prev, { name: file.name, url: file_url, type: file.type }]);
      }
      toast.success(`${files.length} spec document(s) uploaded`);
    } catch (error) {
      toast.error(`Upload failed: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleNext = () => {
    if (!planFile) {
      toast.error('Please upload a plan document');
      return;
    }
    if (!manualScale) {
      toast.error('Please enter the drawing scale');
      return;
    }

    onComplete({
      planFile,
      planScale: manualScale,
      specFiles,
    });
  };

  return (
    <div className="space-y-8">
      {/* Plan Upload */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 mb-1">Construction Plans *</h3>
          <p className="text-sm text-slate-500">Upload PDF, DWG, or image of the construction plans</p>
        </div>

        {planFile ? (
          <div className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-emerald-600" />
              <div>
                <p className="font-medium text-slate-900">{planFile.name}</p>
                <p className="text-xs text-slate-500">Ready to process</p>
              </div>
            </div>
            <button
              onClick={() => setPlanFile(null)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <label className="relative block border-2 border-dashed border-blue-300 rounded-lg p-8 hover:border-blue-500 hover:bg-blue-50 transition cursor-pointer">
            <div className="flex flex-col items-center justify-center gap-3">
              {uploading ? (
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              ) : (
                <Upload className="w-8 h-8 text-blue-600" />
              )}
              <div className="text-center">
                <p className="font-semibold text-slate-900">Drop your plan here</p>
                <p className="text-sm text-slate-500 mt-1">PDF, DWG, JPEG, or PNG</p>
              </div>
            </div>
            <input
              type="file"
              onChange={handlePlanUpload}
              accept=".pdf,.dwg,.jpg,.jpeg,.png"
              className="hidden"
              disabled={uploading}
            />
          </label>
        )}
      </div>

      {/* Drawing Scale */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 mb-1">Drawing Scale *</h3>
          <p className="text-sm text-slate-500">Enter scale as shown on plan (e.g., &quot;1/4&quot; or &quot;1:100&quot;)</p>
        </div>
        <Input
          value={manualScale}
          onChange={(e) => setManualScale(e.target.value)}
          placeholder='e.g., 1/4 = 1\'-0" or 1:100'
          className="text-lg"
        />
        <p className="text-xs text-slate-500 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          Scale is required. If not found on plan, measure a known dimension (e.g., door width) and compare to print.
        </p>
      </div>

      {/* Optional Specs */}
      <div className="space-y-4 pt-6 border-t border-slate-200">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 mb-1">Spec Documents (Optional)</h3>
          <p className="text-sm text-slate-500">Upload Division 27/28 specs, equipment schedules, or project manuals</p>
        </div>

        {specFiles.length > 0 && (
          <div className="space-y-2">
            {specFiles.map((spec, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="w-4 h-4 text-slate-500 flex-shrink-0" />
                  <p className="text-sm text-slate-700 truncate">{spec.name}</p>
                </div>
                <button
                  onClick={() => setSpecFiles(prev => prev.filter((_, i) => i !== idx))}
                  className="text-slate-400 hover:text-slate-600 flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        <label className="relative block border-2 border-dashed border-slate-300 rounded-lg p-6 hover:border-slate-400 hover:bg-slate-50 transition cursor-pointer">
          <div className="flex flex-col items-center justify-center gap-2">
            {uploading ? (
              <Loader2 className="w-6 h-6 text-slate-600 animate-spin" />
            ) : (
              <FileText className="w-6 h-6 text-slate-400" />
            )}
            <div className="text-center">
              <p className="font-medium text-slate-700 text-sm">Add spec documents</p>
              <p className="text-xs text-slate-500 mt-0.5">Optional but recommended</p>
            </div>
          </div>
          <input
            type="file"
            onChange={handleSpecUpload}
            accept=".pdf,.doc,.docx"
            multiple
            className="hidden"
            disabled={uploading}
          />
        </label>
      </div>

      {/* Action Button */}
      <Button onClick={handleNext} className="w-full mt-8" disabled={!planFile || !manualScale || uploading}>
        Review Plan & Symbols
      </Button>
    </div>
  );
}