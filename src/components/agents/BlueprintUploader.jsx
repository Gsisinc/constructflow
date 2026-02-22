import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Loader2, ImagePlus, X, FileImage, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export default function BlueprintUploader({ onAnalysis, disabled }) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const fileInputRef = useRef(null);

  const handleFile = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      toast.error('Please upload an image (PNG, JPG, TIFF) or PDF');
      return;
    }

    setUploading(true);
    try {
      // Show local preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => setPreview(e.target.result);
        reader.readAsDataURL(file);
      }

      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setImageUrl(file_url);
      toast.success('Blueprint uploaded — ready to analyze');
    } catch (err) {
      toast.error('Upload failed: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleAnalyze = () => {
    if (imageUrl) onAnalysis(imageUrl);
  };

  const handleClear = () => {
    setPreview(null);
    setImageUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-2">
      {!imageUrl ? (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => !uploading && fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-200 rounded-lg p-4 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
        >
          {uploading ? (
            <div className="flex items-center justify-center gap-2 text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-xs">Uploading blueprint...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 text-slate-400">
              <ImagePlus className="h-4 w-4" />
              <span className="text-xs">Drop blueprint / drawing here or click to upload</span>
            </div>
          )}
        </div>
      ) : (
        <div className="relative rounded-lg overflow-hidden border border-slate-200">
          {preview && (
            <img src={preview} alt="Blueprint preview" className="w-full max-h-40 object-contain bg-slate-50" />
          )}
          {!preview && (
            <div className="flex items-center gap-2 p-3 bg-slate-50">
              <FileImage className="h-5 w-5 text-blue-500" />
              <span className="text-xs text-slate-600 truncate">Blueprint uploaded</span>
            </div>
          )}
          <button
            onClick={handleClear}
            className="absolute top-1 right-1 bg-white rounded-full p-0.5 shadow hover:bg-red-50"
          >
            <X className="h-3 w-3 text-slate-500" />
          </button>
        </div>
      )}

      {imageUrl && (
        <Button
          onClick={handleAnalyze}
          disabled={disabled}
          size="sm"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-2"
        >
          <Sparkles className="h-4 w-4" />
          Analyze Blueprint & Generate Estimate
        </Button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </div>
  );
}