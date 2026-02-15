import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, Loader2, Ruler, Package, ScanSearch, Calculator, Files } from 'lucide-react';
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

  useEffect(() => {
    setAnalysis(bid?.ai_analysis?.drawing_analysis || null);
  }, [bid?.ai_analysis?.drawing_analysis]);

  useEffect(() => {
    const loadDocs = async () => {
      try {
        const docs = await base44.entities.BidDocument.filter({ bid_opportunity_id: bid.id });
        setExistingDocs(docs);
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
      
      const result = await base44.integrations.Core.InvokeLLM({
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

      await base44.entities.BidOpportunity.update(bid.id, {
        ai_analysis: updatedAiAnalysis,
        estimated_value: bid.estimated_value || normalized.estimateInputs.subtotal
      });

      setAnalysis(normalized);
      toast.success(`Re-analyzed ${existingDocs.length} document${existingDocs.length > 1 ? 's' : ''}`);
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
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        const bidDoc = await base44.entities.BidDocument.create({
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

      const result = await base44.integrations.Core.InvokeLLM({
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
          base44.entities.BidDocument.update(bidDoc.id, {
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

      await base44.entities.BidOpportunity.update(bid.id, {
        ai_analysis: updatedAiAnalysis,
        estimated_value: bid.estimated_value || normalized.estimateInputs.subtotal
      });

      setAnalysis(normalized);
      toast.success(`Drawing analysis complete (${uploadedDocs.length} file${uploadedDocs.length > 1 ? 's' : ''}).`);
      
      // Reload documents list
      const docs = await base44.entities.BidDocument.filter({ bid_opportunity_id: bid.id });
      setExistingDocs(docs);
      
      onAnalysisSaved?.();
    } catch (error) {
      console.error(error);
      toast.error(`Drawing analysis failed: ${error.message || 'Unknown error'}`);
    } finally {
      setUploading(false);
      setAnalyzing(false);
    }
  };

  const handleApplyEstimate = async () => {
    if (!analysis) return;
    
    setApplyingEstimate(true);
    try {
      const contingency = analysis.estimateInputs.recommended_contingency_percent || 10;
      const estimated = analysis.estimateInputs.subtotal * (1 + contingency / 100);
      await base44.entities.BidOpportunity.update(bid.id, { estimated_value: Math.round(estimated) });
      toast.success('Estimate applied to bid value.');
      onAnalysisSaved?.();
    } catch (error) {
      console.error(error);
      toast.error('Failed to apply estimate: ' + error.message);
    } finally {
      setApplyingEstimate(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Drawing Analysis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="text-sm">
              <span className="text-slate-600">Classification</span>
              <select
                className="mt-1 w-full border rounded px-3 py-2"
                value={classification}
                onChange={(e) => setClassification(e.target.value)}
              >
                {CLASSIFICATIONS.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
            <label className="text-sm">
              <span className="text-slate-600">CSI Division Focus</span>
              <select
                className="mt-1 w-full border rounded px-3 py-2"
                value={csiDivision}
                onChange={(e) => setCsiDivision(e.target.value)}
              >
                {CSI_DIVISIONS.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
          </div>

          {existingDocs.length > 0 && (
            <div className="border border-amber-200 bg-amber-50 rounded-lg p-4">
              <p className="text-sm font-medium text-slate-700 mb-2">
                {existingDocs.length} document{existingDocs.length > 1 ? 's' : ''} already uploaded
              </p>
              <div className="space-y-1 mb-3 max-h-24 overflow-y-auto">
                {existingDocs.map(doc => (
                  <p key={doc.id} className="text-xs text-slate-600">• {doc.name}</p>
                ))}
              </div>
              <Button 
                onClick={reanalyzeExistingDocs}
                disabled={analyzing}
                variant="outline"
                size="sm"
                className="w-full"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <ScanSearch className="h-4 w-4 mr-2" />
                    Re-analyze All Documents
                  </>
                )}
              </Button>
            </div>
          )}

          <label className="cursor-pointer block">
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-amber-500 transition-colors">
              {uploading || analyzing ? (
                <>
                  <Loader2 className="h-10 w-10 mx-auto text-amber-600 animate-spin" />
                  <p className="text-sm text-slate-600 mt-2">{uploading ? 'Uploading drawing files...' : 'Analyzing all pages/files...'}</p>
                </>
              ) : (
                <>
                  <Upload className="h-10 w-10 mx-auto text-amber-600" />
                  <p className="text-sm text-slate-700 mt-2 font-medium">Upload {existingDocs.length > 0 ? 'more' : ''} drawing files</p>
                  <p className="text-xs text-slate-500 mt-1">Supports multi-page PDF or multiple files (.pdf, .png, .jpg)</p>
                </>
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

      {analysis && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Ruler className="h-4 w-4" /> Measurements & Takeoff</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-slate-700">{analysis.summary}</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Badge variant="outline">Conduit: {analysis.takeoffTotals.conduit_length_ft} ft</Badge>
                <Badge variant="outline">Cable: {analysis.takeoffTotals.cable_length_ft} ft</Badge>
                <Badge variant="outline">Devices: {analysis.takeoffTotals.device_count}</Badge>
                <Badge variant="outline">Fixtures: {analysis.takeoffTotals.fixture_count}</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Package className="h-4 w-4" /> Material Quantities</CardTitle>
            </CardHeader>
            <CardContent>
              {analysis.materials.length === 0 ? (
                <p className="text-sm text-slate-500">No materials extracted.</p>
              ) : (
                <ul className="space-y-2 text-sm text-slate-600">
                  {analysis.materials.slice(0, 20).map((item, idx) => (
                    <li key={idx} className="border rounded p-2">
                      <p className="font-medium text-slate-800">{item.item}</p>
                      <p>Qty: {item.quantity} {item.unit} • CSI: {item.csi_division}</p>
                      {item.notes && <p className="text-xs text-slate-500">{item.notes}</p>}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><ScanSearch className="h-4 w-4" /> Symbol Detection</CardTitle>
            </CardHeader>
            <CardContent>
              {analysis.symbols.length === 0 ? (
                <p className="text-sm text-slate-500">No symbols extracted.</p>
              ) : (
                <ul className="space-y-1 text-sm text-slate-600">
                  {analysis.symbols.slice(0, 20).map((symbol, idx) => (
                    <li key={idx}>• {symbol.symbol} ({symbol.classification}) × {symbol.count} — {symbol.confidence}</li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Calculator className="h-4 w-4" /> Estimate Builder</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-slate-700">
              <p>Labor hours: {analysis.estimateInputs.labor_hours}</p>
              <p>Material cost: ${analysis.estimateInputs.material_cost.toLocaleString()}</p>
              <p>Equipment cost: ${analysis.estimateInputs.equipment_cost.toLocaleString()}</p>
              <p className="font-semibold">Subtotal: ${analysis.estimateInputs.subtotal.toLocaleString()}</p>
              <p>Recommended contingency: {analysis.estimateInputs.recommended_contingency_percent}%</p>
              <Button 
                onClick={handleApplyEstimate} 
                disabled={applyingEstimate}
                className="mt-2"
              >
                {applyingEstimate ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Applying...
                  </>
                ) : (
                  'Apply This Estimate to Bid'
                )}
              </Button>

              {analysis.missingInformation.length > 0 && (
                <div className="pt-2">
                  <p className="font-medium text-amber-700 flex items-center gap-1"><Files className="h-4 w-4" /> Missing Information</p>
                  <ul className="list-disc ml-5 text-amber-700">
                    {analysis.missingInformation.map((note, idx) => <li key={idx}>{note}</li>)}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}