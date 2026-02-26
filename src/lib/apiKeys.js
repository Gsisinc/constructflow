/**
 * Central API key resolution: env vars first, then localStorage.
 * Use these getters everywhere so keys set in Settings / AI Agents (localStorage) work without restart.
 */
const STORAGE_KEYS = {
  openai: 'openai_api_key',
  claude: 'claude_api_key',
  anthropic: 'anthropic_api_key',
  samGov: 'sam_gov_api_key',
};

function fromEnv(name) {
  const v = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[name];
  return typeof v === 'string' ? v.trim() : '';
}

function fromStorage(key) {
  try {
    const v = typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
    return typeof v === 'string' ? v.trim() : '';
  } catch {
    return '';
  }
}

export function getOpenAIKey() {
  return (
    fromEnv('VITE_OPENAI_API_KEY') ||
    fromEnv('REACT_APP_OPENAI_API_KEY') ||
    fromEnv('VITE_FRONTEND_FORGE_API_KEY') ||
    fromStorage(STORAGE_KEYS.openai) ||
    fromStorage('VITE_OPENAI_API_KEY') ||
    ''
  );
}

export function getClaudeKey() {
  return (
    fromEnv('VITE_CLAUDE_API_KEY') ||
    fromEnv('VITE_ANTHROPIC_API_KEY') ||
    fromEnv('REACT_APP_CLAUDE_API_KEY') ||
    fromEnv('VITE_FRONTEND_FORGE_API_KEY') ||
    fromStorage(STORAGE_KEYS.claude) ||
    fromStorage(STORAGE_KEYS.anthropic) ||
    ''
  );
}

export function getSamGovKey() {
  return (
    fromEnv('VITE_SAM_GOV_API_KEY') ||
    fromEnv('SAM_GOV_API_KEY') ||
    fromStorage(STORAGE_KEYS.samGov) ||
    ''
  );
}

export function setSamGovKey(key) {
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEYS.samGov, key || '');
  } catch (_) {}
}

export function hasOpenAIKey() {
  return getOpenAIKey().length > 0;
}

export function hasClaudeKey() {
  return getClaudeKey().length > 0;
}

export function hasAnyLLMKey() {
  return hasOpenAIKey() || hasClaudeKey();
}

export function hasSamGovKey() {
  const k = getSamGovKey();
  return k.length > 0 && k !== 'DEMO_KEY';
}
