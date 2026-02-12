const toArray = (value) => (Array.isArray(value) ? value : []);

export const buildDrawingAnalysisPrompt = ({ bid, classification, csiDivision }) => `You are a construction estimating assistant specializing in blueprint and drawing takeoff analysis.

Analyze this uploaded project drawing/blueprint and extract measurable takeoff data.
Context:
- Bid/project: ${bid?.title || bid?.project_name || 'Unknown'}
- Agency/client: ${bid?.agency || bid?.client_name || 'Unknown'}
- Existing scope notes: ${bid?.scope_of_work || bid?.description || 'Not provided'}
- Classification focus: ${classification}
- CSI division focus: ${csiDivision}

Return strict JSON with:
1) summary (string)
2) drawing_type (string)
3) units (string)
4) scale (string)
5) measurements: [{name, value, unit, confidence}]
6) materials: [{item, quantity, unit, csi_division, notes}]
7) symbol_detections: [{symbol, classification, count, confidence, notes}]
8) takeoff_totals: {conduit_length_ft, cable_length_ft, device_count, fixture_count}
9) estimate_inputs: {labor_hours, material_cost, equipment_cost, subtotal, recommended_contingency_percent}
10) proposal_notes: [string]
11) missing_information: [string]

Rules:
- Never claim exact certainty when symbols/scale are unclear.
- If scale or legend is missing, include that in missing_information.
- Keep numeric fields as numbers where possible.`;

export const normalizeDrawingAnalysis = (analysis = {}) => {
  const measurements = toArray(analysis.measurements).map((m) => ({
    name: m?.name || 'Measurement',
    value: Number(m?.value || 0),
    unit: m?.unit || 'unit',
    confidence: m?.confidence || 'medium'
  }));

  const materials = toArray(analysis.materials).map((m) => ({
    item: m?.item || 'Unknown material',
    quantity: Number(m?.quantity || 0),
    unit: m?.unit || 'unit',
    csi_division: m?.csi_division || 'Unspecified',
    notes: m?.notes || ''
  }));

  const symbols = toArray(analysis.symbol_detections).map((s) => ({
    symbol: s?.symbol || 'Unknown symbol',
    classification: s?.classification || 'unknown',
    count: Number(s?.count || 0),
    confidence: s?.confidence || 'medium',
    notes: s?.notes || ''
  }));

  const estimate = analysis.estimate_inputs || {};
  const subtotal = Number(estimate.subtotal || (Number(estimate.material_cost || 0) + Number(estimate.equipment_cost || 0)));

  return {
    summary: analysis.summary || 'Drawing analysis complete.',
    drawingType: analysis.drawing_type || 'General Blueprint',
    units: analysis.units || 'unknown',
    scale: analysis.scale || 'unknown',
    measurements,
    materials,
    symbols,
    takeoffTotals: {
      conduit_length_ft: Number(analysis?.takeoff_totals?.conduit_length_ft || 0),
      cable_length_ft: Number(analysis?.takeoff_totals?.cable_length_ft || 0),
      device_count: Number(analysis?.takeoff_totals?.device_count || 0),
      fixture_count: Number(analysis?.takeoff_totals?.fixture_count || 0)
    },
    estimateInputs: {
      labor_hours: Number(estimate.labor_hours || 0),
      material_cost: Number(estimate.material_cost || 0),
      equipment_cost: Number(estimate.equipment_cost || 0),
      subtotal,
      recommended_contingency_percent: Number(estimate.recommended_contingency_percent || 10)
    },
    proposalNotes: toArray(analysis.proposal_notes).filter(Boolean),
    missingInformation: toArray(analysis.missing_information).filter(Boolean)
  };
};
