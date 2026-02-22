import { base44 } from '@/api/base44Client';

export const BLUEPRINT_ANALYZER_CAPABILITIES = [
  'Identifies drawing type, trade, and scale',
  'Counts all elements (outlets, fixtures, conduit, etc.)',
  'Generates full quantity takeoff table',
  'Applies current US market pricing',
  'Exports to CSV or Word with one click',
];

/**
 * Analyze a blueprint image (data URL or public URL) using the backend vision function.
 */
export async function analyzeBlueprintWithVision(imageUrl, prompt = '', options = {}) {
  try {
    const response = await base44.functions.invoke('analyzeBlueprintVision', {
      imageUrl,
      prompt,
      preferredProviders: ['claude', 'openai'],
    });

    const data = response.data;
    if (data?.success && data?.structured) {
      return data.structured;
    }

    if (data?.error) {
      throw new Error(data.error + (data.details ? ': ' + data.details.join(', ') : ''));
    }

    throw new Error('Blueprint analysis returned no structured data');
  } catch (err) {
    throw new Error(
      err.message || 'Blueprint vision analysis failed. Make sure VITE_CLAUDE_API_KEY or VITE_OPENAI_API_KEY are set.'
    );
  }
}