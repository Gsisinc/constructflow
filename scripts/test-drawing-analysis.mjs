import { buildDrawingAnalysisPrompt, normalizeDrawingAnalysis } from '../src/lib/drawingAnalysis.js';

const prompt = buildDrawingAnalysisPrompt({
  bid: { title: 'Hospital Expansion LV', agency: 'County Facilities' },
  classification: 'low_voltage',
  csiDivision: '27 Communications'
});

if (!prompt.includes('strict JSON') || !prompt.includes('Hospital Expansion LV')) {
  console.log('❌ Drawing prompt generation failed');
  process.exit(1);
}
console.log('✅ Drawing prompt generation includes bid context and JSON contract');

const normalized = normalizeDrawingAnalysis({
  summary: 'Drawing analyzed',
  drawing_type: 'Electrical Plan',
  units: 'ft',
  scale: '1/8" = 1\'-0"',
  measurements: [{ name: 'Main corridor run', value: 280, unit: 'ft', confidence: 'high' }],
  materials: [{ item: 'Cat6 Cable', quantity: 5200, unit: 'ft', csi_division: '27', notes: 'Include 10% slack' }],
  symbol_detections: [{ symbol: 'Data Drop', classification: 'low_voltage', count: 42, confidence: 'high' }],
  takeoff_totals: { conduit_length_ft: 1200, cable_length_ft: 5200, device_count: 42, fixture_count: 0 },
  estimate_inputs: { labor_hours: 320, material_cost: 18000, equipment_cost: 4000, subtotal: 22000, recommended_contingency_percent: 12 },
  proposal_notes: ['Use phased deployment to avoid service disruptions'],
  missing_information: ['Legend sheet not provided for all symbols']
});

if (normalized.materials.length !== 1 || normalized.symbols.length !== 1 || normalized.takeoffTotals.device_count !== 42) {
  console.log('❌ Drawing normalization failed');
  process.exit(1);
}

console.log('✅ Drawing normalization returns measurable takeoff, materials, symbols, and estimate inputs');
console.log('Example drawing summary:', normalized.summary);
console.log('Example estimate subtotal:', normalized.estimateInputs.subtotal);
