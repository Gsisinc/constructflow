import {
  DESIGNER_CLASSIFICATIONS,
  createPlacedItem,
  getSymbolLibrary,
  searchSymbols,
  snapPercent,
  summarizeSymbolCounts
} from '../src/lib/drawingDesigner.js';

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

for (const classification of DESIGNER_CLASSIFICATIONS) {
  const symbols = getSymbolLibrary(classification);
  assert(symbols.length >= 12, `Expected broad symbol library for ${classification}`);

  const found = searchSymbols(symbols, 'panel');
  assert(Array.isArray(found), 'Search should always return an array');

  const placed = createPlacedItem({ symbol: symbols[0], x: 22, y: 40 });
  assert(placed.id && placed.glyph, 'Placed symbol should contain identity and glyph');
}

assert(snapPercent(13.4, true, 2) === 14, 'Snap should round to nearest increment');
assert(snapPercent(13.4, false, 2) === 13.4, 'Snap disabled should preserve value');

const sampleItems = [
  { type: 'symbol', label: 'Data Drop' },
  { type: 'symbol', label: 'Data Drop' },
  { type: 'symbol', label: 'CCTV Camera' },
  { type: 'annotation', label: 'Check clearance' }
];

const summary = summarizeSymbolCounts(sampleItems);
assert(summary.length === 2, 'Summary should only include symbol items');
assert(summary[0].label === 'Data Drop' && summary[0].count === 2, 'Summary should count duplicate symbols');

const annotation = createPlacedItem({ symbol: null, x: 10, y: 10, type: 'annotation', text: 'Add firestopping' });
assert(annotation.type === 'annotation' && annotation.glyph === 'Add firestopping', 'Annotation placement should preserve text');

console.log(`Validated drawing designer library for ${DESIGNER_CLASSIFICATIONS.length} classifications.`);
