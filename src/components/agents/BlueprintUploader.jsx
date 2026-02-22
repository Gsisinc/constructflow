import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, ImagePlus, X, FileImage, Sparkles, ListChecks } from 'lucide-react';
import { toast } from 'sonner';
import { BLUEPRINT_ANALYZER_CAPABILITIES } from '@/components/services/bidDocumentAnalysisService';

export default function BlueprintUploader({ onAnalysis, disabled }) {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const fileInputRef = useRef(null);

  const handleFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      toast.error('Please upload an image (PNG, JPG, TIFF) or PDF');
      return;
    }

    setLoading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result;
      if (dataUrl) {
        setPreview(dataUrl);
        setImageUrl(dataUrl);
        toast.success('Blueprint loaded — click Analyze to run vision');
      }
      setLoading(false);
    };
    reader.onerror = () => {
      toast.error('Could not read file');
      setLoading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleAnalyze = () => {
    if (imageUrl) onAnalysis(imageUrl, { previewDataUrl: preview || undefined });
  };

  const handleClear = () => {
    setPreview(null);
    setImageUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-2">
      <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-3 text-left">
        <p className="flex items-center gap-1.5 text-xs font-medium text-slate-700 mb-2">
          <ListChecks className="h-3.5 w-3.5" />
          Blueprint analyzer — real vision only, no fake data
        </p>
        <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
          {BLUEPRINT_ANALYZER_CAPABILITIES.map((cap, i) => (
            <li key={i}>{cap}</li>
          ))}
        </ul>
      </div>
      {!imageUrl ? (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => !loading && fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-200 rounded-lg p-4 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2 text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-xs">Loading blueprint...</span>
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