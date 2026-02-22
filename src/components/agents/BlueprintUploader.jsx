import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, ImagePlus, X, FileImage, Sparkles, ListChecks, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';

const CAPABILITIES = [
  'Architectural, Structural, Electrical, Plumbing, MEP, Low Voltage',
  'Counts all elements and extracts dimensions',
  'Full quantity takeoff table with unit costs',
  'Applies current US market pricing',
  'Supports multi-page PDFs and multi-image uploads',
];

// Convert a PDF page (via canvas) to base64 PNG data URL using PDF.js
async function loadPdfPages(file) {
  // Dynamically import pdfjs from CDN
  const pdfjsLib = await import('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.min.mjs');
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.mjs';

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pages = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2.0 }); // 2x scale for detail
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');
    await page.render({ canvasContext: ctx, viewport }).promise;
    pages.push(canvas.toDataURL('image/png'));
  }

  return pages;
}

export default function BlueprintUploader({ onAnalysis, disabled }) {
  const [loading, setLoading] = useState(false);
  const [pages, setPages] = useState([]); // array of data URLs
  const [selectedPages, setSelectedPages] = useState([]); // indices of pages to analyze
  const [previewIdx, setPreviewIdx] = useState(0);
  const fileInputRef = useRef(null);

  const handleFile = async (file) => {
    if (!file) return;
    const isImage = file.type.startsWith('image/');
    const isPdf = file.type === 'application/pdf';
    if (!isImage && !isPdf) {
      toast.error('Please upload an image (PNG, JPG, TIFF) or PDF');
      return;
    }

    setLoading(true);
    try {
      if (isPdf) {
        toast.info('Converting PDF pages... this may take a moment');
        const pdfPages = await loadPdfPages(file);
        setPages(pdfPages);
        setSelectedPages(pdfPages.map((_, i) => i)); // all selected by default
        setPreviewIdx(0);
        toast.success(`PDF loaded: ${pdfPages.length} page(s) ready for analysis`);
      } else {
        // Image file - upload to get a public URL (better for API)
        const reader = new FileReader();
        const dataUrl = await new Promise((resolve, reject) => {
          reader.onload = (e) => resolve(e.target.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        setPages([dataUrl]);
        setSelectedPages([0]);
        setPreviewIdx(0);
        toast.success('Blueprint loaded — click Analyze to run vision');
      }
    } catch (err) {
      console.error(err);
      toast.error('Could not read file: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleAnalyze = () => {
    if (!pages.length) return;
    const imageUrls = selectedPages.map(i => pages[i]);
    // Pass multi-page data to parent
    onAnalysis(imageUrls[0], { imageUrls, previewDataUrl: pages[previewIdx] });
  };

  const handleClear = () => {
    setPages([]);
    setSelectedPages([]);
    setPreviewIdx(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const togglePage = (idx) => {
    setSelectedPages(prev =>
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx].sort((a, b) => a - b)
    );
  };

  return (
    <div className="space-y-2">
      <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-3 text-left">
        <p className="flex items-center gap-1.5 text-xs font-medium text-slate-700 mb-2">
          <ListChecks className="h-3.5 w-3.5" />
          Blueprint Vision Analyzer (Claude / GPT-4o)
        </p>
        <ul className="text-xs text-slate-500 space-y-0.5 list-disc list-inside">
          {CAPABILITIES.map((cap, i) => (
            <li key={i}>{cap}</li>
          ))}
        </ul>
      </div>

      {pages.length === 0 ? (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => !loading && fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-200 rounded-lg p-4 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2 text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-xs">Processing file...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-1 text-slate-400">
              <ImagePlus className="h-5 w-5" />
              <span className="text-xs font-medium">Drop blueprint / PDF here or click to upload</span>
              <span className="text-xs text-slate-300">PNG, JPG, TIFF, PDF — multi-page supported</span>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {/* Preview with navigation */}
          <div className="relative rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
            <img
              src={pages[previewIdx]}
              alt={`Page ${previewIdx + 1}`}
              className="w-full max-h-48 object-contain"
            />
            {pages.length > 1 && (
              <div className="absolute inset-x-0 bottom-1 flex items-center justify-center gap-2">
                <button
                  onClick={() => setPreviewIdx(i => Math.max(0, i - 1))}
                  disabled={previewIdx === 0}
                  className="bg-white/90 rounded-full p-1 shadow disabled:opacity-30"
                >
                  <ChevronLeft className="h-3 w-3" />
                </button>
                <span className="bg-white/90 text-xs px-2 py-0.5 rounded-full shadow font-medium">
                  {previewIdx + 1} / {pages.length}
                </span>
                <button
                  onClick={() => setPreviewIdx(i => Math.min(pages.length - 1, i + 1))}
                  disabled={previewIdx === pages.length - 1}
                  className="bg-white/90 rounded-full p-1 shadow disabled:opacity-30"
                >
                  <ChevronRight className="h-3 w-3" />
                </button>
              </div>
            )}
            <button
              onClick={handleClear}
              className="absolute top-1 right-1 bg-white rounded-full p-0.5 shadow hover:bg-red-50"
            >
              <X className="h-3 w-3 text-slate-500" />
            </button>
          </div>

          {/* Page selector for multi-page PDFs */}
          {pages.length > 1 && (
            <div className="space-y-1">
              <p className="text-xs text-slate-500 font-medium">Select pages to analyze:</p>
              <div className="flex flex-wrap gap-1">
                {pages.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => togglePage(i)}
                    className={`text-xs px-2 py-0.5 rounded border transition-colors ${
                      selectedPages.includes(i)
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-slate-600 border-slate-300 hover:border-blue-400'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => setSelectedPages(pages.map((_, i) => i))}
                  className="text-xs px-2 py-0.5 rounded border border-slate-300 hover:border-blue-400 text-slate-500"
                >
                  All
                </button>
              </div>
              <p className="text-xs text-slate-400">{selectedPages.length} of {pages.length} page(s) selected</p>
            </div>
          )}
        </div>
      )}

      {pages.length > 0 && (
        <Button
          onClick={handleAnalyze}
          disabled={disabled || loading || selectedPages.length === 0}
          size="sm"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-2"
        >
          <Sparkles className="h-4 w-4" />
          Analyze {selectedPages.length > 1 ? `${selectedPages.length} Pages` : 'Blueprint'} & Generate Estimate
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