import React, { useEffect, useState, useRef } from 'react';
import constructflowClient from '@/api/constructflowClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  Loader2, 
  Ruler, 
  Package, 
  ScanSearch, 
  Calculator, 
  Files, 
  Download, 
  RefreshCw, 
  Maximize2, 
  Eye, 
  Plus, 
  Trash2, 
  MousePointer2 
} from 'lucide-react';
import { toast } from 'sonner';
import { buildDrawingAnalysisPrompt, normalizeDrawingAnalysis } from '@/lib/drawingAnalysis';
import { parseLlmJsonResponse } from '@/lib/llmResponse';

const CLASSIFICATIONS = [
  'general_construction',
  'architectural',
  'electrical',
  'mechanical',
  'plumbing',
  'fire_protection',
  'low_voltage'
];

const CSI_DIVISIONS = [
  '03 Concrete',
  '05 Metals',
  '07 Thermal and Moisture Protection',
  '08 Openings',
  '09 Finishes',
  '21 Fire Suppression',
  '22 Plumbing',
  '23 HVAC',
  '26 Electrical',
  '27 Communications',
  '28 Electronic Safety and Security'
];

export default function DrawingAnalysisTab({ bid, organizationId, onAnalysisSaved }) {
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [applyingEstimate, setApplyingEstimate] = useState(false);
  const [classification, setClassification] = useState('low_voltage');
  const [csiDivision, setCsiDivision] = useState('27 Communications');
  const [analysis, setAnalysis] = useState(bid?.ai_analysis?.drawing_analysis || null);
  const [existingDocs, setExistingDocs] = useState([]);
  const [selectedDocIds, setSelectedDocIds] = useState([]);
  
  // New state for interactive takeoff
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'visual'
  const [selectedDocForPreview, setSelectedDocForPreview] = useState(null);
  const [measurements, setMeasurements] = useState([]);
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [tempMeasurement, setTempMeasurement] = useState(null);
  const [scale, setScale] = useState(1); // pixels per foot
  const [isSettingScale, setIsSettingScale] = useState(false);
  const [scaleStart, setScaleStart] = useState(null);
  
  const containerRef = useRef(null);
  const imageRef = useRef(null);

  useEffect(() => {
    setAnalysis(bid?.ai_analysis?.drawing_analysis || null);
  }, [bid?.ai_analysis?.drawing_analysis]);

  useEffect(() => {
    const loadDocs = async () => {
      try {
        const docs = await constructflowClient.getBidDocuments({ bid_opportunity_id: bid.id });
        setExistingDocs(docs);
        if (docs.length > 0 && !selectedDocForPreview) {
          setSelectedDocForPreview(docs[0]);
        }
      } catch (error) {
        console.error('Failed to load documents:', error);
      }
    };
    if (bid?.id) loadDocs();
  }, [bid?.id]);

  const reanalyzeExistingDocs = async () => {
    if (!selectedDocIds?.length) {
      toast.error('Please select at least one document to analyze');
      return;
    }

    setAnalyzing(true);
    try {
      const selectedDocs = existingDocs.filter(doc => selectedDocIds.includes(doc.id));
      const fileUrls = selectedDocs.map(doc => doc.file_url);
      
      const result = await constructflowClient.post("/llm/invoke", {
        prompt: buildDrawingAnalysisPrompt({
          bid,
          classification,
          csiDivision,
          documentCount: existingDocs.length
        }),
        file_urls: fileUrls,
        response_json_schema: {
          type: 'object',
          properties: {
            summary: { type: 'string' },
            drawing_type: { type: 'string' },
            units: { type: 'string' },
            scale: { type: 'string' },
            measurements: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  value: { type: 'number' },
                  unit: { type: 'string' },
                  confidence: { type: 'string' }
                }
              }
            },
            materials: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  item: { type: 'string' },
                  quantity: { type: 'number' },
                  unit: { type: 'string' },
                  csi_division: { type: 'string' },
                  notes: { type: 'string' }
                }
              }
            },
            symbol_detections: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  symbol: { type: 'string' },
                  classification: { type: 'string' },
                  count: { type: 'number' },
                  confidence: { type: 'string' },
                  notes: { type: 'string' }
                }
              }
            },
            takeoff_totals: {
              type: 'object',
              properties: {
                conduit_length_ft: { type: 'number' },
                cable_length_ft: { type: 'number' },
                device_count: { type: 'number' },
                fixture_count: { type: 'number' }
              }
            },
            estimate_inputs: {
              type: 'object',
              properties: {
                labor_hours: { type: 'number' },
                material_cost: { type: 'number' },
                equipment_cost: { type: 'number' },
                subtotal: { type: 'number' },
                recommended_contingency_percent: { type: 'number' }
              }
            },
            proposal_notes: { type: 'array', items: { type: 'string' } },
            missing_information: { type: 'array', items: { type: 'string' } }
          }
        }
      });

      const normalized = normalizeDrawingAnalysis(parseLlmJsonResponse(result));

      const updatedAiAnalysis = {
        ...(bid.ai_analysis || {}),
        drawing_analysis: normalized,
        drawing_analysis_meta: {
          classification,
          csi_division: csiDivision,
          analyzed_at: new Date().toISOString(),
          document_count: selectedDocs.length,
          document_names: selectedDocs.map(doc => doc.name)
        }
      };

      await constructflowClient.updateBidOpportunity(bid.id, {
        ai_analysis: updatedAiAnalysis,
        estimated_value: bid.estimated_value || normalized.estimateInputs.subtotal
      });

      setAnalysis(normalized);
      toast.success(`Re-analyzed ${selectedDocs.length} document${selectedDocs.length > 1 ? 's' : ''}`);
      setSelectedDocIds([]);
      onAnalysisSaved?.();
    } catch (error) {
      console.error(error);
      toast.error(`Re-analysis failed: ${error.message || 'Unknown error'}`);
    } finally {
      setAnalyzing(false);
    }
  };

  const analyzeDrawingSet = async (files) => {
    if (!files?.length) return;

    setUploading(true);
    try {
      const uploadedDocs = [];

      for (const file of files) {
        const { file_url } = await constructflowClient.post('/documents/upload',{ file });
        const bidDoc = await constructflowClient.createBidDocument({
          bid_opportunity_id: bid.id,
          organization_id: organizationId,
          name: file.name,
          file_url,
          file_type: file.type,
          file_size: file.size,
          ai_processed: false
        });

        uploadedDocs.push({ file, file_url, bidDoc });
      }

      setUploading(false);
      setAnalyzing(true);

      const result = await constructflowClient.post("/llm/invoke", {
        prompt: buildDrawingAnalysisPrompt({
          bid,
          classification,
          csiDivision,
          documentCount: uploadedDocs.length
        }),
        file_urls: uploadedDocs.map((doc) => doc.file_url),
        response_json_schema: {
          type: 'object',
          properties: {
            summary: { type: 'string' },
            drawing_type: { type: 'string' },
            units: { type: 'string' },
            scale: { type: 'string' },
            measurements: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  value: { type: 'number' },
                  unit: { type: 'string' },
                  confidence: { type: 'string' }
                }
              }
            },
            materials: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  item: { type: 'string' },
                  quantity: { type: 'number' },
                  unit: { type: 'string' },
                  csi_division: { type: 'string' },
                  notes: { type: 'string' }
                }
              }
            },
            symbol_detections: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  symbol: { type: 'string' },
                  classification: { type: 'string' },
                  count: { type: 'number' },
                  confidence: { type: 'string' },
                  notes: { type: 'string' }
                }
              }
            },
            takeoff_totals: {
              type: 'object',
              properties: {
                conduit_length_ft: { type: 'number' },
                cable_length_ft: { type: 'number' },
                device_count: { type: 'number' },
                fixture_count: { type: 'number' }
              }
            },
            estimate_inputs: {
              type: 'object',
              properties: {
                labor_hours: { type: 'number' },
                material_cost: { type: 'number' },
                equipment_cost: { type: 'number' },
                subtotal: { type: 'number' },
                recommended_contingency_percent: { type: 'number' }
              }
            },
            proposal_notes: { type: 'array', items: { type: 'string' } },
            missing_information: { type: 'array', items: { type: 'string' } }
          }
        }
      });

      const normalized = normalizeDrawingAnalysis(parseLlmJsonResponse(result));

      await Promise.all(
        uploadedDocs.map(({ bidDoc }) =>
          constructflowClient.updateBidDocument(bidDoc.id, {
            ai_processed: true,
            extracted_data: {
              ...(bidDoc.extracted_data || {}),
              drawing_analysis: normalized,
              analyzed_at: new Date().toISOString(),
              classification,
              csi_division: csiDivision,
              analysis_scope: uploadedDocs.length > 1 ? 'multi_document' : 'single_document'
            }
          })
        )
      );

      const updatedAiAnalysis = {
        ...(bid.ai_analysis || {}),
        drawing_analysis: normalized,
        drawing_analysis_meta: {
          classification,
          csi_division: csiDivision,
          analyzed_at: new Date().toISOString(),
          document_count: uploadedDocs.length,
          document_names: uploadedDocs.map((doc) => doc.file.name)
        }
      };

      await constructflowClient.updateBidOpportunity(bid.id, {
        ai_analysis: updatedAiAnalysis,
        estimated_value: bid.estimated_value || normalized.estimateInputs.subtotal
      });

      setAnalysis(normalized);
      toast.success(`Drawing analysis complete (${uploadedDocs.length} file${uploadedDocs.length > 1 ? 's' : ''}).`);
      
      // Reload documents list
      const docs = await constructflowClient.getBidDocuments({ bid_opportunity_id: bid.id });
      setExistingDocs(docs);
      if (docs.length > 0) setSelectedDocForPreview(docs[docs.length - 1]);
      
      onAnalysisSaved?.();
    } catch (error) {
      console.error(error);
      toast.error(`Drawing analysis failed: ${error.message || 'Unknown error'}`);
    } finally {
      setUploading(false);
      setAnalyzing(false);
    }
  };

  const handleExportTakeoffCsv = () => {
    if (!analysis) return;
    const headers = ['Item', 'Quantity', 'Unit', 'CSI Division', 'Notes'];
    const rows = analysis.materials.map(m => [m.item, m.quantity, m.unit, m.csi_division || '', m.notes || '']);
    const totals = [
      [],
      ['Takeoff totals', '', '', '', ''],
      ['Conduit (ft)', analysis.takeoffTotals.conduit_length_ft, '', '', ''],
      ['Cable (ft)', analysis.takeoffTotals.cable_length_ft, '', '', ''],
      ['Devices', analysis.takeoffTotals.device_count, '', '', ''],
      ['Fixtures', analysis.takeoffTotals.fixture_count, '', '', '']
    ];
    const csv = [headers, ...rows, ...totals]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `takeoff-${bid?.title || 'bid'}-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    toast.success('Takeoff exported as CSV');
  };

  const handleApplyEstimate = async () => {
    if (!analysis) return;
    
    setApplyingEstimate(true);
    try {
      const existingEstimates = await constructflowClient.getBidEstimates({ bid_opportunity_id: bid.id }).catch(() => []);
      const nextVersion = existingEstimates.length > 0
        ? Math.max(...existingEstimates.map(e => (e.version || 1)), 0) + 1
        : 1;

      const subtotal = analysis.estimateInputs.subtotal;
      const overheadPercent = 15;
      const profitPercent = 20;
      const totalBidAmount = subtotal * (1 + (overheadPercent + profitPercent) / 100);

      const lineItems = analysis.materials.map(mat => ({
        description: mat.item,
        quantity: mat.quantity,
        unit: mat.unit,
        unit_cost: 0,
        total_cost: 0,
        category: mat.csi_division || classification
      }));

      await constructflowClient.createBidEstimate({
        bid_opportunity_id: bid.id,
        organization_id: organizationId,
        line_items: lineItems,
        labor_hours: analysis.estimateInputs.labor_hours,
        labor_rate: 65,
        labor_cost: analysis.estimateInputs.labor_hours * 65,
        material_cost: analysis.estimateInputs.material_cost,
        equipment_cost: analysis.estimateInputs.equipment_cost,
        subcontractor_cost: 0,
        overhead_percent: overheadPercent,
        profit_margin_percent: profitPercent,
        subtotal: subtotal,
        total_bid_amount: Math.round(totalBidAmount),
        notes: `Generated from drawing takeoff on ${new Date().toLocaleDateString()}. Classification: ${classification}, CSI: ${csiDivision}. Version ${nextVersion}.`,
        version: nextVersion
      });

      await constructflowClient.updateBidOpportunity(bid.id, { 
        estimated_value: Math.round(totalBidAmount) 
      });

      toast.success('Estimate created and applied to bid.');
      onAnalysisSaved?.();
    } catch (error) {
      console.error(error);
      toast.error('Failed to apply estimate: ' + error.message);
    } finally {
      setApplyingEstimate(false);
    }
  };

  // Interactive Takeoff Logic
  const handleSurfaceClick = (e) => {
    if (!selectedDocForPreview) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (isSettingScale) {
      if (!scaleStart) {
        setScaleStart({ x, y });
        toast.info("Click the other end of the known dimension.");
      } else {
        const dx = x - scaleStart.x;
        const dy = y - scaleStart.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const length = parseFloat(prompt("Enter the length in feet for this segment:", "10"));
        if (length > 0) {
          setScale(dist / length);
          toast.success(`Scale set: ${Math.round(dist / length)} pixels per foot.`);
        }
        setIsSettingScale(false);
        setScaleStart(null);
      }
      return;
    }

    if (isMeasuring) {
      if (!tempMeasurement) {
        setTempMeasurement({ x1: x, y1: y, x2: x, y2: y });
      } else {
        const dx = x - tempMeasurement.x1;
        const dy = y - tempMeasurement.y1;
        const pixelDist = Math.sqrt(dx * dx + dy * dy);
        const ftDist = scale > 0 ? pixelDist / scale : 0;
        
        const name = prompt("Enter a name for this measurement (e.g., North Wall):", "Measurement");
        if (name) {
          setMeasurements([...measurements, {
            id: crypto.randomUUID(),
            name,
            x1: tempMeasurement.x1,
            y1: tempMeasurement.y1,
            x2: x,
            y2: y,
            lengthFt: ftDist
          }]);
        }
        setTempMeasurement(null);
        setIsMeasuring(false);
      }
    }
  };

  const handleMouseMove = (e) => {
    if ((isMeasuring || isSettingScale) && (tempMeasurement || scaleStart)) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      if (tempMeasurement) {
        setTempMeasurement({ ...tempMeasurement, x2: x, y2: y });
      } else if (scaleStart) {
        // Just visual feedback for scale setting
      }
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle>Drawing Analysis & Takeoff</CardTitle>
          <div className="flex gap-2">
            <Button 
              variant={viewMode === 'list' ? 'default' : 'outline'} 
              size="sm" 
              onClick={() => setViewMode('list')}
            >
              <Files className="h-4 w-4 mr-2" /> List View
            </Button>
            <Button 
              variant={viewMode === 'visual' ? 'default' : 'outline'} 
              size="sm" 
              onClick={() => setViewMode('visual')}
            >
              <Maximize2 className="h-4 w-4 mr-2" /> Visual Takeoff
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="text-sm">
              <span className="text-slate-600 font-medium">Classification</span>
              <select
                className="mt-1 w-full border rounded-md px-3 py-2 bg-white"
                value={classification}
                onChange={(e) => setClassification(e.target.value)}
              >
                {CLASSIFICATIONS.map((item) => <option key={item} value={item}>{item.replace('_', ' ')}</option>)}
              </select>
            </label>
            <label className="text-sm">
              <span className="text-slate-600 font-medium">CSI Division Focus</span>
              <select
                className="mt-1 w-full border rounded-md px-3 py-2 bg-white"
                value={csiDivision}
                onChange={(e) => setCsiDivision(e.target.value)}
              >
                {CSI_DIVISIONS.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
          </div>

          {existingDocs.length > 0 && (
            <div className="border border-amber-200 bg-amber-50/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-amber-900">
                  {existingDocs.length} document{existingDocs.length > 1 ? 's' : ''} uploaded
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setSelectedDocIds(
                      selectedDocIds.length === existingDocs.length 
                        ? [] 
                        : existingDocs.map(d => d.id)
                    )}
                    className="text-xs text-amber-700 hover:text-amber-900 font-medium underline"
                  >
                    {selectedDocIds.length === existingDocs.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3 max-h-40 overflow-y-auto pr-2">
                {existingDocs.map(doc => (
                  <div 
                    key={doc.id} 
                    className={`flex items-center justify-between p-2 rounded border transition-colors ${selectedDocForPreview?.id === doc.id ? 'bg-amber-100 border-amber-300' : 'bg-white border-slate-200 hover:bg-slate-50'}`}
                  >
                    <label className="flex items-center gap-2 text-xs cursor-pointer flex-1 truncate">
                      <input
                        type="checkbox"
                        checked={selectedDocIds.includes(doc.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedDocIds([...selectedDocIds, doc.id]);
                          } else {
                            setSelectedDocIds(selectedDocIds.filter(id => id !== doc.id));
                          }
                        }}
                        className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <span className="truncate font-medium text-slate-700">{doc.name}</span>
                    </label>
                    <button 
                      onClick={() => {
                        setSelectedDocForPreview(doc);
                        setViewMode('visual');
                      }}
                      className="p-1 hover:bg-amber-200 rounded text-amber-700"
                      title="View Drawing"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <Button 
                onClick={reanalyzeExistingDocs}
                disabled={analyzing || selectedDocIds.length === 0}
                variant="outline"
                size="sm"
                className="w-full border-amber-300 text-amber-800 hover:bg-amber-100"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <ScanSearch className="h-4 w-4 mr-2" />
                    Re-analyze Selected ({selectedDocIds.length})
                  </>
                )}
              </Button>
            </div>
          )}

          <label className="cursor-pointer block">
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-amber-500 hover:bg-slate-50 transition-all group">
              {uploading || analyzing ? (
                <div className="flex flex-col items-center">
                  <Loader2 className="h-12 w-12 text-amber-600 animate-spin mb-3" />
                  <p className="text-sm font-medium text-slate-700">{uploading ? 'Uploading drawing files...' : 'Analyzing drawings with AI...'}</p>
                  <p className="text-xs text-slate-500 mt-1">This may take a minute for complex plans.</p>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center mb-3 group-hover:bg-amber-200 transition-colors">
                    <Upload className="h-6 w-6 text-amber-600" />
                  </div>
                  <p className="text-sm font-semibold text-slate-800">Upload drawing files for takeoff</p>
                  <p className="text-xs text-slate-500 mt-1">Supports multi-page PDF, PNG, JPG</p>
                </div>
              )}
              <input
                type="file"
                className="hidden"
                accept=".pdf,.png,.jpg,.jpeg"
                multiple
                disabled={uploading || analyzing}
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  if (files.length > 0) analyzeDrawingSet(files);
                  e.target.value = '';
                }}
              />
            </div>
          </label>
        </CardContent>
      </Card>

      {viewMode === 'visual' && selectedDocForPreview && (
        <Card className="overflow-hidden">
          <CardHeader className="bg-slate-900 text-white flex flex-row items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <Maximize2 className="h-5 w-5 text-amber-400" />
              <div>
                <CardTitle className="text-base font-bold">{selectedDocForPreview.name}</CardTitle>
                <p className="text-[10px] text-slate-400">Interactive Visual Takeoff Tool</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant={isSettingScale ? "default" : "outline"}
                className={isSettingScale ? "bg-amber-600" : "text-white border-slate-700 hover:bg-slate-800"}
                onClick={() => {
                  setIsSettingScale(true);
                  setIsMeasuring(false);
                  setScaleStart(null);
                  toast.info("Click on a known dimension on the drawing to set scale.");
                }}
              >
                <Ruler className="h-4 w-4 mr-2" /> Set Scale
              </Button>
              <Button 
                size="sm" 
                variant={isMeasuring ? "default" : "outline"}
                className={isMeasuring ? "bg-blue-600" : "text-white border-slate-700 hover:bg-slate-800"}
                onClick={() => {
                  if (scale === 1) {
                    toast.warning("Set the scale first for accurate measurements.");
                  }
                  setIsMeasuring(true);
                  setIsSettingScale(false);
                  setTempMeasurement(null);
                }}
              >
                <Plus className="h-4 w-4 mr-2" /> Measure Line
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0 bg-slate-800 relative min-h-[600px] flex items-center justify-center overflow-auto">
            <div 
              ref={containerRef}
              className="relative cursor-crosshair inline-block shadow-2xl"
              onClick={handleSurfaceClick}
              onMouseMove={handleMouseMove}
            >
              {selectedDocForPreview.file_type?.includes('pdf') ? (
                <div className="bg-white p-8 text-center rounded shadow-lg">
                  <Files className="h-16 w-16 mx-auto text-slate-300 mb-4" />
                  <p className="text-slate-800 font-bold">PDF View Not Supported in Visual Mode</p>
                  <p className="text-slate-500 text-sm mt-2 max-w-xs">Visual takeoff requires an image file. Please upload a PNG or JPG version of this plan for interactive measurements.</p>
                  <Button variant="outline" className="mt-4" onClick={() => window.open(selectedDocForPreview.file_url, '_blank')}>
                    Open PDF in New Tab
                  </Button>
                </div>
              ) : (
                <>
                  <img 
                    ref={imageRef}
                    src={selectedDocForPreview.file_url} 
                    alt="Drawing" 
                    className="max-w-none block"
                    onLoad={() => toast.success("Drawing loaded. Use 'Set Scale' to calibrate.")}
                  />
                  
                  {/* Render Measurements */}
                  <svg className="absolute inset-0 pointer-events-none w-full h-full">
                    {measurements.map((m) => (
                      <g key={m.id}>
                        <line x1={m.x1} y1={m.y1} x2={m.x2} y2={m.y2} stroke="#3b82f6" strokeWidth="3" strokeDasharray="4" />
                        <circle cx={m.x1} cy={m.y1} r="4" fill="#3b82f6" />
                        <circle cx={m.x2} cy={m.y2} r="4" fill="#3b82f6" />
                        <rect x={(m.x1+m.x2)/2 - 30} y={(m.y1+m.y2)/2 - 12} width="60" height="20" rx="4" fill="white" stroke="#3b82f6" strokeWidth="1" />
                        <text x={(m.x1+m.x2)/2} y={(m.y1+m.y2)/2 + 2} textAnchor="middle" fontSize="10" fontWeight="bold" fill="#1e40af">
                          {Math.round(m.lengthFt)} ft
                        </text>
                      </g>
                    ))}
                    
                    {tempMeasurement && (
                      <g>
                        <line x1={tempMeasurement.x1} y1={tempMeasurement.y1} x2={tempMeasurement.x2} y2={tempMeasurement.y2} stroke="#3b82f6" strokeWidth="2" strokeDasharray="4" />
                        <circle cx={tempMeasurement.x1} cy={tempMeasurement.y1} r="3" fill="#3b82f6" />
                      </g>
                    )}

                    {scaleStart && (
                      <circle cx={scaleStart.x} cy={scaleStart.y} r="5" fill="#f59e0b" />
                    )}
                  </svg>
                </>
              )}
            </div>

            {/* Floating Measurement List */}
            {measurements.length > 0 && (
              <div className="absolute top-4 right-4 w-64 bg-white/95 backdrop-blur shadow-xl rounded-lg border border-slate-200 overflow-hidden">
                <div className="bg-slate-100 px-3 py-2 border-b flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-700">Manual Takeoffs</span>
                  <Badge variant="secondary" className="text-[10px]">{measurements.length}</Badge>
                </div>
                <div className="max-h-60 overflow-y-auto p-2 space-y-1">
                  {measurements.map((m) => (
                    <div key={m.id} className="flex items-center justify-between p-2 bg-slate-50 rounded border border-slate-100 text-[11px] group">
                      <div className="flex-1 truncate">
                        <p className="font-bold text-slate-800 truncate">{m.name}</p>
                        <p className="text-slate-500">{Math.round(m.lengthFt)} linear feet</p>
                      </div>
                      <button 
                        onClick={() => setMeasurements(measurements.filter(x => x.id !== m.id))}
                        className="p-1 hover:text-red-600 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="p-2 bg-slate-50 border-t">
                  <Button size="sm" className="w-full text-[10px] h-7 bg-blue-600" onClick={() => {
                    const total = measurements.reduce((acc, m) => acc + m.lengthFt, 0);
                    toast.success(`Added ${Math.round(total)} ft to takeoff totals.`);
                    // In a real app, this would update the analysis state
                  }}>
                    Add to Takeoff Totals
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {analysis && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <Card className="border-2 border-amber-200 bg-amber-50/30">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-amber-900">
                  <Calculator className="h-5 w-5" /> 
                  Apply Takeoff to Bid Estimate
                </CardTitle>
                <p className="text-xs text-slate-600 mt-1">
                  Create a new estimate version from this takeoff. This will update the bid&apos;s estimated value.
                </p>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-3 pt-2">
                <Button
                  onClick={handleApplyEstimate}
                  disabled={applyingEstimate}
                  className="bg-amber-600 hover:bg-amber-700 text-white shadow-md"
                >
                  {applyingEstimate ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Applying...
                    </>
                  ) : (
                    'Create Bid Estimate from Takeoff'
                  )}
                </Button>
                <Button variant="outline" onClick={handleExportTakeoffCsv} className="border-amber-300 text-amber-800 hover:bg-amber-50">
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2"><Package className="h-5 w-5 text-blue-600" /> Material Quantities</CardTitle>
              </CardHeader>
              <CardContent>
                {analysis.materials.length === 0 ? (
                  <div className="text-center py-8 bg-slate-50 rounded border border-dashed">
                    <Package className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                    <p className="text-sm text-slate-500">No materials extracted from these drawings.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {analysis.materials.map((item, idx) => (
                      <div key={idx} className="border rounded-lg p-3 bg-white shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-1">
                          <p className="font-bold text-slate-800 text-sm leading-tight">{item.item}</p>
                          <Badge variant="secondary" className="text-[10px] bg-blue-50 text-blue-700 border-blue-100">
                            {item.quantity} {item.unit}
                          </Badge>
                        </div>
                        <p className="text-[10px] text-slate-500 font-medium">CSI: {item.csi_division || 'General'}</p>
                        {item.notes && <p className="text-[11px] text-slate-600 mt-2 italic">&ldquo;{item.notes}&rdquo;</p>}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card className="bg-slate-900 text-white border-0 shadow-xl">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-amber-400">
                  <Ruler className="h-5 w-5" /> 
                  Takeoff Totals
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-3 bg-slate-800 rounded-lg border border-slate-700">
                    <span className="text-xs text-slate-400">Conduit Length</span>
                    <span className="font-bold text-amber-400">{analysis.takeoffTotals.conduit_length_ft.toLocaleString()} ft</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-800 rounded-lg border border-slate-700">
                    <span className="text-xs text-slate-400">Cable Length</span>
                    <span className="font-bold text-amber-400">{analysis.takeoffTotals.cable_length_ft.toLocaleString()} ft</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-800 rounded-lg border border-slate-700">
                    <span className="text-xs text-slate-400">Device Count</span>
                    <span className="font-bold text-amber-400">{analysis.takeoffTotals.device_count} ea</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-800 rounded-lg border border-slate-700">
                    <span className="text-xs text-slate-400">Fixture Count</span>
                    <span className="font-bold text-amber-400">{analysis.takeoffTotals.fixture_count} ea</span>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-slate-700">
                  <p className="text-[11px] text-slate-400 leading-relaxed italic">
                    &ldquo;{analysis.summary}&rdquo;
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2"><Calculator className="h-5 w-5 text-emerald-600" /> Estimate Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm space-y-2">
                  <div className="flex justify-between text-slate-600">
                    <span>Labor ({analysis.estimateInputs.labor_hours} hrs)</span>
                    <span>${(analysis.estimateInputs.labor_hours * 65).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Materials</span>
                    <span>${analysis.estimateInputs.material_cost.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Equipment</span>
                    <span>${analysis.estimateInputs.equipment_cost.toLocaleString()}</span>
                  </div>
                  <div className="pt-2 border-t flex justify-between font-bold text-slate-900 text-base">
                    <span>Subtotal</span>
                    <span>${analysis.estimateInputs.subtotal.toLocaleString()}</span>
                  </div>
                </div>
                
                {analysis.missingInformation.length > 0 && (
                  <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-100">
                    <p className="text-[11px] font-bold text-amber-800 flex items-center gap-1 mb-1">
                      <Files className="h-3 w-3" /> Missing Information
                    </p>
                    <ul className="space-y-1">
                      {analysis.missingInformation.map((note, idx) => (
                        <li key={idx} className="text-[10px] text-amber-700 flex items-start gap-1">
                          <span className="mt-1">•</span>
                          <span>{note}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2"><ScanSearch className="h-5 w-5 text-violet-600" /> Symbol Detection</CardTitle>
              </CardHeader>
              <CardContent>
                {analysis.symbols.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-4">No symbols detected.</p>
                ) : (
                  <div className="space-y-2">
                    {analysis.symbols.slice(0, 10).map((symbol, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs p-2 bg-slate-50 rounded border border-slate-100">
                        <div className="flex-1 truncate mr-2">
                          <p className="font-bold text-slate-800 truncate">{symbol.symbol}</p>
                          <p className="text-[10px] text-slate-500">{symbol.classification}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-slate-900">× {symbol.count}</p>
                          <p className="text-[9px] text-emerald-600 font-medium">{symbol.confidence}</p>
                        </div>
                      </div>
                    ))}
                    {analysis.symbols.length > 10 && (
                      <p className="text-[10px] text-center text-slate-400">+{analysis.symbols.length - 10} more symbols detected</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
