import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  FileText, Upload, Sparkles, Loader, AlertCircle, CheckCircle2, 
  Download, Copy, Trash2, Eye, Settings, Plus, X, Grid3x3, Type, Minus, Square as SquareIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { analyzeBidDocument, analyzeDrawing } from '@/services/bidDocumentAnalysisService';
import { CONSTRUCTION_SYMBOLS, SYMBOL_CATEGORIES, getSymbolsByCategory, getCategoryDisplayName, getAllCategories } from '@/data/constructionSymbols';

/**
 * Document Analysis Tab
 */
function DocumentAnalysisTab() {
  const [file, setFile] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setError(null);
    setAnalysis(null);
    
    // Auto-analyze on file select
    await analyzeFile(selectedFile);
  };

  const analyzeFile = async (fileToAnalyze) => {
    setLoading(true);
    try {
      const result = await analyzeBidDocument(fileToAnalyze);
      setAnalysis(result);
      toast.success('Document analyzed successfully');
    } catch (err) {
      const errorMsg = err.message || 'Failed to analyze document';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyAnalysis = () => {
    const text = JSON.stringify(analysis, null, 2);
    navigator.clipboard.writeText(text);
    toast.success('Analysis copied to clipboard');
  };

  const handleDownloadAnalysis = () => {
    const text = JSON.stringify(analysis, null, 2);
    const blob = new Blob([text], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bid-analysis-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <Card className="border-2 border-dashed border-amber-200 hover:border-amber-400 transition-colors">
        <CardContent className="p-8">
          <div className="text-center">
            <Upload className="h-12 w-12 text-amber-600 mx-auto mb-3" />
            <h3 className="font-semibold text-slate-900 mb-2">Upload Bid Document</h3>
            <p className="text-sm text-slate-600 mb-4">
              Upload PDF, images, or text files for AI analysis
            </p>
            <Button
              onClick={() => fileInputRef.current?.click()}
              className="bg-amber-600 hover:bg-amber-700"
            >
              <Upload className="h-4 w-4 mr-2" />
              Select File
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              accept=".pdf,.jpg,.jpeg,.png,.gif,.txt,.doc,.docx"
              className="hidden"
            />
          </div>
        </CardContent>
      </Card>

      {/* File Info */}
      {file && (
        <Card className="border-amber-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-amber-600" />
                <div>
                  <p className="font-medium text-slate-900">{file.name}</p>
                  <p className="text-sm text-slate-500">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFile(null);
                  setAnalysis(null);
                  setError(null);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading && (
        <Card className="border-blue-100">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Loader className="h-5 w-5 text-blue-600 animate-spin" />
              <div>
                <p className="font-medium text-slate-900">Analyzing document...</p>
                <p className="text-sm text-slate-600">
                  Using AI to extract key information
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Card className="border-red-100">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-red-900">Analysis Failed</p>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analysis Results */}
      {analysis && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <h3 className="font-semibold text-slate-900">Analysis Results</h3>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyAnalysis}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadAnalysis}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>

          {/* Display Analysis */}
          {analysis.raw_analysis ? (
            <Card className="border-amber-100">
              <CardContent className="p-4">
                <div className="prose prose-sm max-w-none">
                  <pre className="bg-slate-50 p-4 rounded-lg overflow-x-auto text-xs whitespace-pre-wrap break-words">
                    {analysis.raw_analysis}
                  </pre>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(analysis).map(([key, value]) => (
                <Card key={key} className="border-amber-100">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base capitalize">
                      {key.replace(/_/g, ' ')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">
                      {typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Drawing Measurement Tab
 */
function DrawingMeasurementTab() {
  const [file, setFile] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setError(null);
    setAnalysis(null);
    setSelectedItems([]);
    
    await analyzeDrawing(selectedFile);
  };

  const analyzeDrawing = async (fileToAnalyze) => {
    setLoading(true);
    try {
      const result = await analyzeDrawing(fileToAnalyze);
      setAnalysis(result);
      toast.success('Drawing analyzed successfully');
    } catch (err) {
      const errorMsg = err.message || 'Failed to analyze drawing';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToEstimate = () => {
    if (selectedItems.length === 0) {
      toast.error('Please select items to add');
      return;
    }
    toast.success(`Added ${selectedItems.length} items to estimate`);
    setSelectedItems([]);
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <Card className="border-2 border-dashed border-blue-200 hover:border-blue-400 transition-colors">
        <CardContent className="p-8">
          <div className="text-center">
            <Upload className="h-12 w-12 text-blue-600 mx-auto mb-3" />
            <h3 className="font-semibold text-slate-900 mb-2">Upload Construction Drawing</h3>
            <p className="text-sm text-slate-600 mb-4">
              Upload floor plans, elevations, or detail drawings for measurement analysis
            </p>
            <Button
              onClick={() => fileInputRef.current?.click()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Upload className="h-4 w-4 mr-2" />
              Select Drawing
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              accept=".jpg,.jpeg,.png,.gif,.pdf"
              className="hidden"
            />
          </div>
        </CardContent>
      </Card>

      {/* File Info */}
      {file && (
        <Card className="border-blue-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium text-slate-900">{file.name}</p>
                  <p className="text-sm text-slate-500">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFile(null);
                  setAnalysis(null);
                  setError(null);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading && (
        <Card className="border-blue-100">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Loader className="h-5 w-5 text-blue-600 animate-spin" />
              <div>
                <p className="font-medium text-slate-900">Analyzing drawing...</p>
                <p className="text-sm text-slate-600">
                  Extracting measurements and takeoff items
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Card className="border-red-100">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-red-900">Analysis Failed</p>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analysis Results */}
      {analysis && (
        <div className="space-y-4">
          {/* Measurements */}
          {analysis.measurements && analysis.measurements.length > 0 && (
            <Card className="border-blue-100">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Extracted Measurements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {analysis.measurements.map((m, idx) => (
                    <Badge key={idx} variant="outline" className="bg-blue-50">
                      {m.value}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Takeoff Items */}
          {analysis.takeoff_items && analysis.takeoff_items.length > 0 && (
            <Card className="border-blue-100">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Takeoff Items</CardTitle>
                  <Button
                    size="sm"
                    onClick={handleAddToEstimate}
                    disabled={selectedItems.length === 0}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Selected ({selectedItems.length})
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analysis.takeoff_items.map((item, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedItems.includes(idx)
                          ? 'bg-blue-50 border-blue-300'
                          : 'bg-slate-50 border-slate-200 hover:border-blue-300'
                      }`}
                      onClick={() => {
                        setSelectedItems(prev =>
                          prev.includes(idx)
                            ? prev.filter(i => i !== idx)
                            : [...prev, idx]
                        );
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(idx)}
                          onChange={() => {}}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-slate-900">
                            {item.quantity} {item.unit}
                          </p>
                          <p className="text-sm text-slate-600">{item.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Raw Analysis */}
          {analysis.raw_analysis && (
            <Card className="border-blue-100">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Detailed Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-slate-50 p-4 rounded-lg overflow-x-auto text-xs whitespace-pre-wrap break-words">
                  {analysis.raw_analysis}
                </pre>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Designer Tool Tab with Construction Symbols
 */
function DesignerTab() {
  const canvasRef = useRef(null);
  const [selectedCategory, setSelectedCategory] = useState(SYMBOL_CATEGORIES.ELECTRICAL);
  const [selectedSymbol, setSelectedSymbol] = useState(null);
  const [canvas, setCanvas] = useState(null);
  const [context, setContext] = useState(null);
  const [elements, setElements] = useState([]);
  const [tool, setTool] = useState('select'); // select, draw-line, draw-rect, draw-text
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState(null);
  const [backgroundImage, setBackgroundImage] = useState(null);
  const fileInputRef = useRef(null);

  // Initialize canvas
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const ctx = canvas.getContext('2d');
    setCanvas(canvas);
    setContext(ctx);

    // Draw grid
    drawGrid(ctx, canvas);
  }, []);

  const drawGrid = (ctx, canvas) => {
    const gridSize = 20;
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 0.5;

    for (let x = 0; x < canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }

    for (let y = 0; y < canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
  };

  const redrawCanvas = () => {
    if (!context || !canvas) return;

    context.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background image if exists
    if (backgroundImage) {
      context.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
    }

    // Draw grid
    drawGrid(context, canvas);

    // Draw elements
    elements.forEach(el => {
      if (el.type === 'symbol') {
        const symbol = CONSTRUCTION_SYMBOLS[el.category]?.find(s => s.id === el.symbolId);
        if (symbol) {
          const img = new Image();
          img.src = `data:image/svg+xml;base64,${btoa(symbol.svg)}`;
          img.onload = () => {
            context.drawImage(img, el.x, el.y, el.width, el.height);
          };
        }
      } else if (el.type === 'line') {
        context.strokeStyle = '#000';
        context.lineWidth = 2;
        context.beginPath();
        context.moveTo(el.x1, el.y1);
        context.lineTo(el.x2, el.y2);
        context.stroke();
      } else if (el.type === 'rect') {
        context.strokeStyle = '#000';
        context.lineWidth = 2;
        context.strokeRect(el.x, el.y, el.width, el.height);
      } else if (el.type === 'text') {
        context.fillStyle = '#000';
        context.font = '14px Arial';
        context.fillText(el.text, el.x, el.y);
      }
    });
  };

  const handleCanvasMouseDown = (e) => {
    if (tool === 'select' && selectedSymbol) {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      setElements([...elements, {
        type: 'symbol',
        category: selectedCategory,
        symbolId: selectedSymbol,
        x,
        y,
        width: 40,
        height: 40
      }]);
    } else if (tool === 'draw-line' || tool === 'draw-rect') {
      const rect = canvas.getBoundingClientRect();
      setStartPos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
      setIsDrawing(true);
    }
  };

  const handleCanvasMouseUp = (e) => {
    if (!isDrawing || !startPos) return;

    const rect = canvas.getBoundingClientRect();
    const endX = e.clientX - rect.left;
    const endY = e.clientY - rect.top;

    if (tool === 'draw-line') {
      setElements([...elements, {
        type: 'line',
        x1: startPos.x,
        y1: startPos.y,
        x2: endX,
        y2: endY
      }]);
    } else if (tool === 'draw-rect') {
      setElements([...elements, {
        type: 'rect',
        x: Math.min(startPos.x, endX),
        y: Math.min(startPos.y, endY),
        width: Math.abs(endX - startPos.x),
        height: Math.abs(endY - startPos.y)
      }]);
    }

    setIsDrawing(false);
    setStartPos(null);
  };

  const handleUploadBackground = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        setBackgroundImage(img);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleClearCanvas = () => {
    setElements([]);
    setBackgroundImage(null);
  };

  const handleDownloadDesign = () => {
    if (!canvas) return;
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `design-${Date.now()}.png`;
    link.click();
  };

  React.useEffect(() => {
    redrawCanvas();
  }, [elements, backgroundImage]);

  const symbols = getSymbolsByCategory(selectedCategory);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Left Panel - Symbol Selection */}
        <div className="space-y-4">
          {/* Category Selector */}
          <Card className="border-purple-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Categories</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {getAllCategories().map(category => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setSelectedCategory(category);
                    setSelectedSymbol(null);
                  }}
                  className={selectedCategory === category ? 'bg-purple-600 hover:bg-purple-700 w-full' : 'w-full justify-start'}
                >
                  {getCategoryDisplayName(category)}
                </Button>
              ))}
            </CardContent>
          </Card>

          {/* Tools */}
          <Card className="border-purple-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Tools</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant={tool === 'select' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTool('select')}
                className="w-full justify-start"
              >
                <Grid3x3 className="h-4 w-4 mr-2" />
                Select
              </Button>
              <Button
                variant={tool === 'draw-line' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTool('draw-line')}
                className="w-full justify-start"
              >
                <Minus className="h-4 w-4 mr-2" />
                Line
              </Button>
              <Button
                variant={tool === 'draw-rect' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTool('draw-rect')}
                className="w-full justify-start"
              >
                <SquareIcon className="h-4 w-4 mr-2" />
                Rectangle
              </Button>
              <Button
                variant={tool === 'draw-text' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTool('draw-text')}
                className="w-full justify-start"
              >
                <Type className="h-4 w-4 mr-2" />
                Text
              </Button>
            </CardContent>
          </Card>

          {/* Canvas Actions */}
          <Card className="border-purple-100">
            <CardContent className="p-4 space-y-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="w-full justify-start"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Plan
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleUploadBackground}
                accept=".jpg,.jpeg,.png,.gif"
                className="hidden"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadDesign}
                className="w-full justify-start"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearCanvas}
                className="w-full justify-start text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Middle Panel - Symbol Library */}
        <div className="lg:col-span-1">
          <Card className="border-purple-100 h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">{getCategoryDisplayName(selectedCategory)}</CardTitle>
            </CardHeader>
            <CardContent className="max-h-96 overflow-y-auto space-y-2">
              {symbols.map(symbol => (
                <Button
                  key={symbol.id}
                  variant={selectedSymbol === symbol.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedSymbol(symbol.id)}
                  className={`w-full justify-start text-xs ${
                    selectedSymbol === symbol.id ? 'bg-purple-600 hover:bg-purple-700' : ''
                  }`}
                  title={symbol.description}
                >
                  <div
                    className="w-5 h-5 mr-2 flex-shrink-0"
                    dangerouslySetInnerHTML={{ __html: symbol.svg }}
                  />
                  <span className="truncate">{symbol.name}</span>
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - Canvas */}
        <div className="lg:col-span-2">
          <Card className="border-purple-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Design Canvas</CardTitle>
            </CardHeader>
            <CardContent>
              <canvas
                ref={canvasRef}
                onMouseDown={handleCanvasMouseDown}
                onMouseUp={handleCanvasMouseUp}
                className="w-full border-2 border-slate-200 rounded-lg bg-white cursor-crosshair"
                style={{ height: '500px' }}
              />
              <p className="text-xs text-slate-500 mt-2">
                {tool === 'select' && selectedSymbol ? 'Click to place symbols' : `Tool: ${tool}`}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

/**
 * Main Bid Intelligence Page
 */
export default function BidIntelligence() {
  const [activeTab, setActiveTab] = useState('analysis');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-2">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 flex items-center gap-3 tracking-tight">
            <div className="p-2 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg">
              <Sparkles className="h-7 w-7 text-purple-700" />
            </div>
            Bid Intelligence
          </h1>
          <p className="text-slate-600 mt-2">AI-powered document analysis, drawing measurement, and design tools</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 overflow-x-auto">
        <Button
          variant={activeTab === 'analysis' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('analysis')}
          className={activeTab === 'analysis' ? 'border-b-2 border-amber-600 rounded-none' : 'rounded-none'}
        >
          <FileText className="h-4 w-4 mr-2" />
          Document Analysis
        </Button>
        <Button
          variant={activeTab === 'drawing' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('drawing')}
          className={activeTab === 'drawing' ? 'border-b-2 border-blue-600 rounded-none' : 'rounded-none'}
        >
          <Eye className="h-4 w-4 mr-2" />
          Drawing Measurement
        </Button>
        <Button
          variant={activeTab === 'designer' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('designer')}
          className={activeTab === 'designer' ? 'border-b-2 border-purple-600 rounded-none' : 'rounded-none'}
        >
          <Settings className="h-4 w-4 mr-2" />
          Designer Tool
        </Button>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'analysis' && <DocumentAnalysisTab />}
        {activeTab === 'drawing' && <DrawingMeasurementTab />}
        {activeTab === 'designer' && <DesignerTab />}
      </div>
    </div>
  );
}
