const SHARED_SYMBOLS = [
  { id: 'north_arrow', label: 'North Arrow', glyph: '↑N', category: 'navigation', csi: '01' },
  { id: 'elevation_marker', label: 'Elevation Marker', glyph: 'EL', category: 'annotation', csi: '01' },
  { id: 'section_callout', label: 'Section Callout', glyph: '§', category: 'annotation', csi: '01' },
  { id: 'detail_callout', label: 'Detail Callout', glyph: 'D', category: 'annotation', csi: '01' },
  { id: 'door_tag', label: 'Door Tag', glyph: 'DR', category: 'architectural', csi: '08' },
  { id: 'window_tag', label: 'Window Tag', glyph: 'WN', category: 'architectural', csi: '08' },
  { id: 'column_grid', label: 'Grid Bubble', glyph: '◎', category: 'structural', csi: '03' },
  { id: 'beam_symbol', label: 'Beam', glyph: '━', category: 'structural', csi: '05' },
  { id: 'wall_partition', label: 'Partition Wall', glyph: '║', category: 'architectural', csi: '09' },
  { id: 'room_tag', label: 'Room Tag', glyph: 'RM', category: 'architectural', csi: '09' }
];

const CLASSIFICATION_SYMBOLS = {
  low_voltage: [
    { id: 'data_drop', label: 'Data Drop', glyph: 'D', category: 'communications', csi: '27' },
    { id: 'voice_drop', label: 'Voice Drop', glyph: 'V', category: 'communications', csi: '27' },
    { id: 'waps', label: 'Wireless AP', glyph: 'AP', category: 'communications', csi: '27' },
    { id: 'camera', label: 'CCTV Camera', glyph: 'CCTV', category: 'security', csi: '28' },
    { id: 'access_control', label: 'Access Control Reader', glyph: 'AC', category: 'security', csi: '28' },
    { id: 'door_contact', label: 'Door Contact', glyph: 'DC', category: 'security', csi: '28' },
    { id: 'motion_sensor', label: 'Motion Sensor', glyph: 'MS', category: 'security', csi: '28' },
    { id: 'horn_strobe', label: 'Horn Strobe', glyph: 'HS', category: 'life_safety', csi: '28' },
    { id: 'fire_panel', label: 'Fire Alarm Panel', glyph: 'FACP', category: 'life_safety', csi: '28' },
    { id: 'telecom_rack', label: 'Telecom Rack', glyph: 'TR', category: 'communications', csi: '27' }
  ],
  electrical: [
    { id: 'receptacle', label: 'Duplex Receptacle', glyph: '◉', category: 'power', csi: '26' },
    { id: 'gfci', label: 'GFCI Receptacle', glyph: 'GFCI', category: 'power', csi: '26' },
    { id: 'lighting_fixture', label: 'Lighting Fixture', glyph: 'LF', category: 'lighting', csi: '26' },
    { id: 'switch', label: 'Single Pole Switch', glyph: 'S', category: 'lighting', csi: '26' },
    { id: 'panelboard', label: 'Panelboard', glyph: 'PNL', category: 'distribution', csi: '26' },
    { id: 'transformer', label: 'Transformer', glyph: 'XFMR', category: 'distribution', csi: '26' },
    { id: 'generator', label: 'Generator', glyph: 'GEN', category: 'distribution', csi: '26' },
    { id: 'disconnect', label: 'Disconnect', glyph: 'DISC', category: 'distribution', csi: '26' }
  ],
  mechanical: [
    { id: 'ahu', label: 'Air Handling Unit', glyph: 'AHU', category: 'hvac', csi: '23' },
    { id: 'vav', label: 'VAV Box', glyph: 'VAV', category: 'hvac', csi: '23' },
    { id: 'diffuser', label: 'Diffuser', glyph: 'DF', category: 'hvac', csi: '23' },
    { id: 'return_grille', label: 'Return Grille', glyph: 'RG', category: 'hvac', csi: '23' },
    { id: 'chiller', label: 'Chiller', glyph: 'CH', category: 'hvac', csi: '23' },
    { id: 'boiler', label: 'Boiler', glyph: 'BLR', category: 'hvac', csi: '23' }
  ],
  plumbing: [
    { id: 'lavatory', label: 'Lavatory', glyph: 'LAV', category: 'fixtures', csi: '22' },
    { id: 'water_closet', label: 'Water Closet', glyph: 'WC', category: 'fixtures', csi: '22' },
    { id: 'floor_drain', label: 'Floor Drain', glyph: 'FD', category: 'drainage', csi: '22' },
    { id: 'hose_bib', label: 'Hose Bib', glyph: 'HB', category: 'fixtures', csi: '22' },
    { id: 'water_heater', label: 'Water Heater', glyph: 'WH', category: 'equipment', csi: '22' },
    { id: 'backflow_preventer', label: 'Backflow Preventer', glyph: 'BFP', category: 'equipment', csi: '22' }
  ],
  fire_protection: [
    { id: 'sprinkler_head', label: 'Sprinkler Head', glyph: 'SP', category: 'sprinkler', csi: '21' },
    { id: 'riser', label: 'Riser', glyph: 'RIS', category: 'sprinkler', csi: '21' },
    { id: 'flow_switch', label: 'Flow Switch', glyph: 'FS', category: 'sprinkler', csi: '21' },
    { id: 'tamper_switch', label: 'Tamper Switch', glyph: 'TS', category: 'sprinkler', csi: '21' },
    { id: 'fire_pump', label: 'Fire Pump', glyph: 'FP', category: 'sprinkler', csi: '21' }
  ],
  architectural: [
    { id: 'casework', label: 'Casework', glyph: 'CW', category: 'interiors', csi: '12' },
    { id: 'finish_change', label: 'Finish Change', glyph: 'FC', category: 'interiors', csi: '09' },
    { id: 'ceiling_tag', label: 'Ceiling Tag', glyph: 'CT', category: 'interiors', csi: '09' },
    { id: 'millwork', label: 'Millwork', glyph: 'MW', category: 'interiors', csi: '12' },
    { id: 'accessibility_clearance', label: 'Accessibility Clearance', glyph: 'ADA', category: 'compliance', csi: '01' }
  ],
  general_construction: [
    { id: 'demolition_note', label: 'Demolition Note', glyph: 'DEM', category: 'general', csi: '02' },
    { id: 'existing_to_remain', label: 'Existing to Remain', glyph: 'EX', category: 'general', csi: '02' },
    { id: 'new_work', label: 'New Work', glyph: 'NEW', category: 'general', csi: '01' },
    { id: 'phase_marker', label: 'Phase Marker', glyph: 'PH', category: 'scheduling', csi: '01' },
    { id: 'inspection_point', label: 'Inspection Point', glyph: 'INSP', category: 'quality', csi: '01' }
  ]
};

export const DESIGNER_CLASSIFICATIONS = Object.keys(CLASSIFICATION_SYMBOLS);

export function getSymbolLibrary(classification = 'general_construction') {
  const classificationSymbols = CLASSIFICATION_SYMBOLS[classification] || CLASSIFICATION_SYMBOLS.general_construction;
  return [...SHARED_SYMBOLS, ...classificationSymbols];
}

export function searchSymbols(symbols, searchTerm = '') {
  const term = searchTerm.trim().toLowerCase();
  if (!term) return symbols;

  return symbols.filter((symbol) => {
    const haystack = `${symbol.label} ${symbol.id} ${symbol.category} ${symbol.csi}`.toLowerCase();
    return haystack.includes(term);
  });
}

export function snapPercent(percent, snapEnabled = false, increment = 2) {
  if (!snapEnabled) return percent;
  return Math.round(percent / increment) * increment;
}

export function createPlacedItem({ symbol, x, y, type = 'symbol', text = '' }) {
  return {
    id: `${type}_${symbol?.id || 'note'}_${Date.now()}_${Math.round(Math.random() * 10000)}`,
    type,
    symbolId: symbol?.id || null,
    label: symbol?.label || text || 'Annotation',
    glyph: symbol?.glyph || text,
    x,
    y,
    text,
    createdAt: new Date().toISOString()
  };
}

export function summarizeSymbolCounts(items = []) {
  const symbolItems = items.filter((item) => item.type === 'symbol' && item.label);
  const counts = symbolItems.reduce((acc, item) => {
    acc[item.label] = (acc[item.label] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}
