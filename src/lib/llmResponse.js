export function parseLlmJsonResponse(result) {
  if (!result) return {};
  if (typeof result === 'string') {
    try { return JSON.parse(result); } catch { return {}; }
  }
  if (typeof result.output === 'string') {
    try { return JSON.parse(result.output); } catch {}
  }
  if (result.output && typeof result.output === 'object') return result.output;
  if (result.result && typeof result.result === 'object') return result.result;
  return result;
}
