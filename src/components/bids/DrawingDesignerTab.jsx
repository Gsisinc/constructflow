import React, { useMemo, useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  DESIGNER_CLASSIFICATIONS,
  createPlacedItem,
  getSymbolLibrary,
  searchSymbols,
  snapPercent,
  summarizeSymbolCounts
} from '@/lib/drawingDesigner';
import {
  Eraser,
  FileImage,
  FileText,
  Grid3X3,
  Move,
  PencilLine,
  Redo2,
  Save,
  Search,
  Undo2
} from 'lucide-react';

const DEFAULT_CANVAS_HEIGHT = 760;
const HISTORY_LIMIT = 100;

function getFileType(file) {
  if (!file) return null;
  if (file.type?.includes('pdf')) return 'pdf';
  return 'image';
}

function nextHistory(history, snapshot) {
  const merged = [...history, snapshot];
  if (merged.length <= HISTORY_LIMIT) return merged;
  return merged.slice(merged.length - HISTORY_LIMIT);
}

export default function DrawingDesignerTab({ bid, onDesignerSaved }) {
  const initialLayout = bid?.ai_analysis?.drawing_designer_layout || null;
  const [classification, setClassification] = useState(initialLayout?.classification || 'low_voltage');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSymbolId, setSelectedSymbolId] = useState(null);
  const [annotationText, setAnnotationText] = useState('');
  const [mode, setMode] = useState('symbol');
  const [placedItems, setPlacedItems] = useState(initialLayout?.items || []);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [dragItemId, setDragItemId] = useState(null);
  const [background, setBackground] = useState(initialLayout?.background || null);
  const [saving, setSaving] = useState(false);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  const designSurfaceRef = useRef(null);

  const symbols = useMemo(() => getSymbolLibrary(classification), [classification]);
  const filteredSymbols = useMemo(() => searchSymbols(symbols, searchTerm), [symbols, searchTerm]);
  const selectedSymbol = useMemo(
    () => symbols.find((symbol) => symbol.id === selectedSymbolId) || null,
    [symbols, selectedSymbolId]
  );

  const symbolSummary = useMemo(() => summarizeSymbolCounts(placedItems), [placedItems]);

  const pushHistoryAndSetItems = (nextItems) => {
    setUndoStack((prev) => nextHistory(prev, placedItems));
    setRedoStack([]);
    setPlacedItems(nextItems);
  };

  const handleUndo = () => {
    if (!undoStack.length) return;
    const previous = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, prev.length - 1));
    setRedoStack((prev) => nextHistory(prev, placedItems));
    setPlacedItems(previous);
    setSelectedItemId(null);
  };

  const handleRedo = () => {
    if (!redoStack.length) return;
    const next = redoStack[redoStack.length - 1];
    setRedoStack((prev) => prev.slice(0, prev.length - 1));
    setUndoStack((prev) => nextHistory(prev, placedItems));
    setPlacedItems(next);
    setSelectedItemId(null);
  };

  const handleBackgroundUpload = async (file) => {
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setBackground({
        file_url,
        file_type: getFileType(file),
        file_name: file.name
      });
      toast.success('Drawing uploaded. You can now place symbols and annotations.');
    } catch (error) {
      console.error(error);
      toast.error('Could not upload drawing. Try again.');
    }
  };

  const toLocalPosition = (event) => {
    const surface = designSurfaceRef.current;
    if (!surface) return null;
    const rect = surface.getBoundingClientRect();
    const rawX = Math.max(0, Math.min(100, ((event.clientX - rect.left) / rect.width) * 100));
    const rawY = Math.max(0, Math.min(100, ((event.clientY - rect.top) / rect.height) * 100));
    return {
      x: snapPercent(rawX, snapToGrid),
      y: snapPercent(rawY, snapToGrid)
    };
  };

  const placeSymbolOrText = (event) => {
    if (!background) {
      toast.error('Upload a drawing first.');
      return;
    }

    const point = toLocalPosition(event);
    if (!point) return;

    if (mode === 'annotation') {
      if (!annotationText.trim()) {
        toast.error('Enter annotation text first.');
        return;
      }

      const item = createPlacedItem({
        symbol: null,
        x: point.x,
        y: point.y,
        type: 'annotation',
        text: annotationText.trim()
      });

      const nextItems = [...placedItems, item];
      pushHistoryAndSetItems(nextItems);
      setSelectedItemId(item.id);
      return;
    }

    if (!selectedSymbol) {
      toast.error('Select a symbol from the library first.');
      return;
    }

    const item = createPlacedItem({
      symbol: selectedSymbol,
      x: point.x,
      y: point.y,
      type: 'symbol'
    });

    const nextItems = [...placedItems, item];
    pushHistoryAndSetItems(nextItems);
    setSelectedItemId(item.id);
  };

  const handleDragStart = (event, itemId) => {
    event.stopPropagation();
    setDragItemId(itemId);
    setUndoStack((prev) => nextHistory(prev, placedItems));
    setRedoStack([]);
  };

  const handleDragMove = (event) => {
    if (!dragItemId) return;
    const point = toLocalPosition(event);
    if (!point) return;

    setPlacedItems((prev) =>
      prev.map((item) => (item.id === dragItemId ? { ...item, x: point.x, y: point.y } : item))
    );
  };

  const clearSelectedItem = () => {
    if (!selectedItemId) return;
    const nextItems = placedItems.filter((item) => item.id !== selectedItemId);
    pushHistoryAndSetItems(nextItems);
    setSelectedItemId(null);
  };

  const clearAll = () => {
    if (!placedItems.length) return;
    pushHistoryAndSetItems([]);
    setSelectedItemId(null);
  };

  const saveLayout = async () => {
    try {
      setSaving(true);
      const nextAiAnalysis = {
        ...(bid.ai_analysis || {}),
        drawing_designer_layout: {
          classification,
          background,
          items: placedItems,
          snap_to_grid: snapToGrid,
          symbol_summary: symbolSummary,
          updated_at: new Date().toISOString()
        }
      };

      await base44.entities.BidOpportunity.update(bid.id, {
        ai_analysis: nextAiAnalysis
      });

      toast.success('Designer layout saved to this bid.');
      onDesignerSaved?.();
    } catch (error) {
      console.error(error);
      toast.error('Could not save designer layout.');
    } finally {
      setSaving(false);
    }
  };

  const exportAsImage = async () => {
    if (!designSurfaceRef.current || !background) {
      toast.error('Upload and annotate a drawing before exporting.');
      return;
    }

    const canvas = await html2canvas(designSurfaceRef.current, {
      useCORS: true,
      backgroundColor: '#ffffff',
      scale: 2
    });

    const link = document.createElement('a');
    link.download = `${bid.title || 'drawing'}-annotated.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const exportAsPdf = async () => {
    if (!designSurfaceRef.current || !background) {
      toast.error('Upload and annotate a drawing before exporting.');
      return;
    }

    const canvas = await html2canvas(designSurfaceRef.current, {
      useCORS: true,
      backgroundColor: '#ffffff',
      scale: 2
    });

    const imageData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const ratio = Math.min(pageWidth / canvas.width, pageHeight / canvas.height);
    const renderWidth = canvas.width * ratio;
    const renderHeight = canvas.height * ratio;

    pdf.addImage(
      imageData,
      'PNG',
      (pageWidth - renderWidth) / 2,
      (pageHeight - renderHeight) / 2,
      renderWidth,
      renderHeight
    );
    pdf.save(`${bid.title || 'drawing'}-annotated.pdf`);
  };

  const renderBackground = () => {
    if (!background) {
      return (
        <div className="h-[760px] w-full rounded border-2 border-dashed border-slate-300 bg-slate-50 flex items-center justify-center p-6 text-center text-sm text-slate-500">
          Upload a blank plan image/PDF to start designing.
        </div>
      );
    }

    if (background.file_type === 'pdf') {
      return <iframe title="Drawing PDF" src={background.file_url} className="h-[760px] w-full rounded border" />;
    }

    return (
      <img
        src={background.file_url}
        alt="Drawing background"
        className="h-auto w-full rounded border object-contain"
      />
    );
  };

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[360px_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Designer Controls</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-500">Classification</label>
            <select
              className="mt-1 w-full rounded border p-2 text-sm"
              value={classification}
              onChange={(event) => {
                setClassification(event.target.value);
                setSelectedSymbolId(null);
              }}
            >
              {DESIGNER_CLASSIFICATIONS.map((option) => (
                <option key={option} value={option}>
                  {option.replaceAll('_', ' ')}
                </option>
              ))}
            </select>
          </div>

          <label className="block">
            <div className="cursor-pointer rounded border-2 border-dashed border-blue-300 p-4 text-center text-sm text-slate-600 hover:bg-blue-50">
              Upload blank drawing / blueprint
              <input
                type="file"
                className="hidden"
                accept=".png,.jpg,.jpeg,.webp,.pdf"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) handleBackgroundUpload(file);
                  event.target.value = '';
                }}
              />
            </div>
          </label>

          <div className="grid grid-cols-2 gap-2">
            <Button variant={mode === 'symbol' ? 'default' : 'outline'} size="sm" onClick={() => setMode('symbol')}>
              <Move className="mr-2 h-4 w-4" /> Symbol
            </Button>
            <Button variant={mode === 'annotation' ? 'default' : 'outline'} size="sm" onClick={() => setMode('annotation')}>
              <PencilLine className="mr-2 h-4 w-4" /> Note
            </Button>
            <Button variant="outline" size="sm" onClick={handleUndo} disabled={!undoStack.length}>
              <Undo2 className="mr-2 h-4 w-4" /> Undo
            </Button>
            <Button variant="outline" size="sm" onClick={handleRedo} disabled={!redoStack.length}>
              <Redo2 className="mr-2 h-4 w-4" /> Redo
            </Button>
          </div>

          <Button
            variant={snapToGrid ? 'default' : 'outline'}
            size="sm"
            className="w-full"
            onClick={() => setSnapToGrid((value) => !value)}
          >
            <Grid3X3 className="mr-2 h-4 w-4" />
            Snap to grid (2%) {snapToGrid ? 'On' : 'Off'}
          </Button>

          {mode === 'annotation' && (
            <Input
              value={annotationText}
              onChange={(event) => setAnnotationText(event.target.value)}
              placeholder="Type note text, then click on drawing"
            />
          )}

          <div className="space-y-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                className="pl-8"
                placeholder="Search symbols"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
            <div className="max-h-56 space-y-2 overflow-y-auto rounded border p-2">
              {filteredSymbols.map((symbol) => (
                <button
                  key={symbol.id}
                  type="button"
                  className={`w-full rounded border px-2 py-1 text-left text-sm ${
                    symbol.id === selectedSymbolId ? 'border-amber-500 bg-amber-50' : 'hover:bg-slate-50'
                  }`}
                  onClick={() => {
                    setMode('symbol');
                    setSelectedSymbolId(symbol.id);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-800">{symbol.label}</span>
                    <Badge variant="outline" className="text-[10px]">
                      {symbol.glyph}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500">{symbol.category} • CSI {symbol.csi}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded border p-2">
            <p className="text-xs font-semibold text-slate-600">Symbol Count Summary</p>
            {symbolSummary.length === 0 ? (
              <p className="mt-1 text-xs text-slate-400">No symbols placed yet.</p>
            ) : (
              <ul className="mt-1 space-y-1 text-xs text-slate-700">
                {symbolSummary.slice(0, 8).map((row) => (
                  <li key={row.label} className="flex justify-between">
                    <span>{row.label}</span>
                    <span className="font-semibold">× {row.count}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" onClick={clearSelectedItem}>
              <Eraser className="mr-2 h-4 w-4" /> Remove
            </Button>
            <Button variant="outline" size="sm" onClick={clearAll}>Clear all</Button>
            <Button variant="outline" size="sm" onClick={exportAsImage}>
              <FileImage className="mr-2 h-4 w-4" /> PNG
            </Button>
            <Button variant="outline" size="sm" onClick={exportAsPdf}>
              <FileText className="mr-2 h-4 w-4" /> PDF
            </Button>
          </div>

          <Button className="w-full" onClick={saveLayout} disabled={saving}>
            <Save className="mr-2 h-4 w-4" /> {saving ? 'Saving...' : 'Save designer layout'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Drawing Designer Surface</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            ref={designSurfaceRef}
            className="relative select-none overflow-hidden rounded border bg-white"
            style={{ minHeight: `${DEFAULT_CANVAS_HEIGHT}px` }}
            onClick={placeSymbolOrText}
            onMouseMove={handleDragMove}
            onMouseUp={() => setDragItemId(null)}
            onMouseLeave={() => setDragItemId(null)}
          >
            {renderBackground()}

            {placedItems.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`absolute -translate-x-1/2 -translate-y-1/2 rounded px-2 py-1 text-xs font-semibold shadow ${
                  item.id === selectedItemId
                    ? 'border border-amber-500 bg-amber-100 text-amber-900'
                    : item.type === 'annotation'
                      ? 'bg-cyan-100 text-cyan-900'
                      : 'bg-white text-slate-900'
                }`}
                style={{ left: `${item.x}%`, top: `${item.y}%` }}
                onMouseDown={(event) => handleDragStart(event, item.id)}
                onClick={(event) => {
                  event.stopPropagation();
                  setSelectedItemId(item.id);
                }}
              >
                {item.glyph}
              </button>
            ))}
          </div>

          <p className="mt-2 text-xs text-slate-500">
            Tip: select a symbol, then click the drawing to place it. Drag any placed item to reposition.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
