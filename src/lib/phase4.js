export const DEFAULT_AI_POLICY = {
  require_citations: true,
  block_unverified_claims: true,
  confidence_threshold: 0.7,
  allow_live_discovery_only_for_market_intelligence: true,
  redact_pii_in_logs: true,
  keep_prompt_history_days: 90
};

export const DEFAULT_MODEL_POLICY = {
  cost_sensitive: 'gpt-4.1-mini',
  standard_assistant: 'gpt-4.1',
  high_reasoning: 'o3',
  compliance_review: 'gpt-4.1'
};

export function normalizeAiPolicy(raw = {}) {
  return {
    ...DEFAULT_AI_POLICY,
    ...raw,
    confidence_threshold: clamp(Number(raw?.confidence_threshold ?? DEFAULT_AI_POLICY.confidence_threshold), 0.1, 1),
    keep_prompt_history_days: Math.max(7, Number(raw?.keep_prompt_history_days ?? DEFAULT_AI_POLICY.keep_prompt_history_days))
  };
}

export function normalizeModelPolicy(raw = {}) {
  return {
    ...DEFAULT_MODEL_POLICY,
    ...raw
  };
}

export function buildPromptTraceRows(messages = []) {
  return messages
    .filter((row) => row?.message || row?.prompt)
    .map((row) => {
      const confidenceRaw = Number(row.confidence_score ?? row.metadata?.confidence ?? row.metadata?.score ?? 0.72);
      const confidence = clamp(confidenceRaw, 0, 1);
      return {
        id: row.id,
        created_date: row.created_date || row.timestamp || new Date().toISOString(),
        agent_name: row.agent_name || row.agent || 'unknown_agent',
        model: row.model || row.metadata?.model || 'gpt-4.1-mini',
        prompt_preview: String(row.prompt || row.message || '').slice(0, 140),
        response_preview: String(row.response || row.assistant_message || '').slice(0, 180),
        confidence,
        token_estimate: Number(row.token_estimate || row.metadata?.tokens || estimateTokens(row.prompt || row.message, row.response || row.assistant_message))
      };
    })
    .sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
}

export function buildAiReliabilityStats(traceRows = []) {
  if (!traceRows.length) {
    return {
      total_runs: 0,
      avg_confidence: 0,
      low_confidence_runs: 0,
      total_estimated_tokens: 0
    };
  }

  const totalConfidence = traceRows.reduce((sum, row) => sum + Number(row.confidence || 0), 0);
  const lowConfidenceRuns = traceRows.filter((row) => Number(row.confidence || 0) < 0.7).length;
  const tokens = traceRows.reduce((sum, row) => sum + Number(row.token_estimate || 0), 0);

  return {
    total_runs: traceRows.length,
    avg_confidence: Number((totalConfidence / traceRows.length).toFixed(2)),
    low_confidence_runs: lowConfidenceRuns,
    total_estimated_tokens: Math.round(tokens)
  };
}

export function evaluateAutomationRule({ rule, bids = [], projects = [] }) {
  if (!rule?.trigger_type) {
    return { shouldTrigger: false, reason: 'missing_trigger_type' };
  }

  if (rule.trigger_type === 'risk_threshold') {
    const threshold = Number(rule.threshold ?? 0.7);
    const riskyProjects = projects.filter((project) => Number(project.risk_score || 0) >= threshold);
    return {
      shouldTrigger: riskyProjects.length > 0,
      reason: riskyProjects.length > 0 ? 'projects_over_threshold' : 'no_projects_over_threshold',
      impacted: riskyProjects.map((project) => project.id)
    };
  }

  if (rule.trigger_type === 'bid_deadline_window') {
    const days = Number(rule.threshold ?? 7);
    const now = Date.now();
    const msWindow = days * 24 * 60 * 60 * 1000;

    const matching = bids.filter((bid) => {
      const due = bid?.due_date ? new Date(bid.due_date).getTime() : null;
      return due && due >= now && due - now <= msWindow;
    });

    return {
      shouldTrigger: matching.length > 0,
      reason: matching.length > 0 ? 'bids_due_soon' : 'no_bids_in_window',
      impacted: matching.map((bid) => bid.id)
    };
  }

  return { shouldTrigger: false, reason: 'unsupported_trigger_type' };
}

export function buildAutomationPreview({ rules = [], bids = [], projects = [] }) {
  return rules.map((rule) => {
    const evaluation = evaluateAutomationRule({ rule, bids, projects });
    return {
      ...rule,
      ...evaluation
    };
  });
}

function estimateTokens(prompt = '', response = '') {
  const combinedLength = `${prompt || ''} ${response || ''}`.trim().length;
  return Math.max(20, Math.round(combinedLength / 4));
}

function clamp(value, min, max) {
  if (Number.isNaN(value)) return min;
  return Math.min(max, Math.max(min, value));
}
