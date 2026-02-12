import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, Loader2, Ruler, Package, ScanSearch, Calculator } from 'lucide-react';
import { toast } from 'sonner';
import { buildDrawingAnalysisPrompt, normalizeDrawingAnalysis } from '@/lib/drawingAnalysis';

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
  const [classification, setClassification] = useState('low_voltage');
  const [csiDivision, setCsiDivision] = useState('27 Communications');
  const [analysis, setAnalysis] = useState(bid?.ai_analysis?.drawing_analysis || null);

  const analyzeDrawing = async (file) => {
    setUploading(true);
    try {
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

      setUploading(false);
      setAnalyzing(true);

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: buildDrawingAnalysisPrompt({ bid, classification, csiDivision }),
        file_urls: [file_url],
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

      const normalized = normalizeDrawingAnalysis(result);

      await base44.entities.BidDocument.update(bidDoc.id, {
        ai_processed: true,
        extracted_data: {
          ...(bidDoc.extracted_data || {}),
          drawing_analysis: normalized,
          analyzed_at: new Date().toISOString(),
          classification,
          csi_division: csiDivision
        }
      });

      const updatedAiAnalysis = {
        ...(bid.ai_analysis || {}),
        drawing_analysis: normalized,
        drawing_analysis_meta: {
          classification,
          csi_division: csiDivision,
          document_name: file.name,
          analyzed_at: new Date().toISOString()
        }
      };

      await base44.entities.BidOpportunity.update(bid.id, {
        ai_analysis: updatedAiAnalysis,
        estimated_value: bid.estimated_value || normalized.estimateInputs.subtotal
      });

      setAnalysis(normalized);
      toast.success('Drawing analysis complete. Materials and measurements extracted.');
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
    const contingency = analysis.estimateInputs.recommended_contingency_percent || 10;
    const estimated = analysis.estimateInputs.subtotal * (1 + contingency / 100);
    await base44.entities.BidOpportunity.update(bid.id, { estimated_value: estimated });
    toast.success('Estimated value updated from drawing takeoff.');
    onAnalysisSaved?.();
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Blueprint / Drawing Analysis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-slate-700">Classification Focus</label>
              <select value={classification} onChange={(e) => setClassification(e.target.value)} className="w-full mt-1 border rounded-md p-2 text-sm">
                {CLASSIFICATIONS.map((option) => <option key={option} value={option}>{option.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">CSI Division Focus</label>
              <select value={csiDivision} onChange={(e) => setCsiDivision(e.target.value)} className="w-full mt-1 border rounded-md p-2 text-sm">
                {CSI_DIVISIONS.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </div>
          </div>

          <label className="block">
            <div className="border-2 border-dashed border-blue-300 rounded-lg p-6 text-center cursor-pointer hover:bg-blue-50 transition">
              {uploading || analyzing ? <Loader2 className="h-8 w-8 mx-auto text-blue-600 mb-2 animate-spin" /> : <Upload className="h-8 w-8 mx-auto text-blue-600 mb-2" />}
              <p className="text-sm text-slate-600">
                {uploading ? 'Uploading drawing...' : analyzing ? 'Analyzing drawing symbols, measurements, and materials...' : 'Upload blueprint/drawing for AI takeoff analysis'}
              </p>
              <p className="text-xs text-slate-500 mt-1">PDF / image plans (PNG, JPG)</p>
              <input
                type="file"
                className="hidden"
                accept=".pdf,.png,.jpg,.jpeg"
                disabled={uploading || analyzing}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) analyzeDrawing(file);
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
              {analysis.measurements.length > 0 && (
                <ul className="space-y-1 text-sm text-slate-600">
                  {analysis.measurements.slice(0, 10).map((m, idx) => (
                    <li key={idx}>• {m.name}: {m.value} {m.unit} ({m.confidence})</li>
                  ))}
                </ul>
              )}
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
              <CardTitle className="flex items-center gap-2"><ScanSearch className="h-4 w-4" /> Blueprint Symbol Detection</CardTitle>
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
              <Button onClick={handleApplyEstimate} className="mt-2">Apply This Estimate to Bid</Button>
              {analysis.proposalNotes.length > 0 && (
                <div className="pt-2">
                  <p className="font-medium">Proposal Notes</p>
                  <ul className="list-disc ml-5">
                    {analysis.proposalNotes.map((note, idx) => <li key={idx}>{note}</li>)}
                  </ul>
                </div>
              )}
              {analysis.missingInformation.length > 0 && (
                <div className="pt-2">
                  <p className="font-medium text-amber-700">Missing Information</p>
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
