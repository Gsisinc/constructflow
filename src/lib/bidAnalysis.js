export const buildBidAnalysisPrompt = ({ formData, phases, fileCount }) => {
  return `You are a construction bid analyst.

Analyze the provided bid documents and the manual bid intake details.
Manual Bid Intake:
- Project name: ${formData.project_name}
- Agency/client: ${formData.agency || 'Unknown'}
- Description: ${formData.description || 'Not provided'}
- Estimated value: ${formData.estimated_value || 0}
- Due date: ${formData.due_date || 'Not provided'}
- User-entered phases: ${phases.map((p) => `${p.name} (${p.duration_days} days)`).join(', ')}
- Uploaded document count: ${fileCount}

Return strict JSON with:
1) summary (string)
2) project_overview with fields: scope_summary, timeline_days, estimated_budget
3) deadlines: [{name, date, source}]
4) bid_requirements: [{text, category, priority, source}]
5) project_requirements: [{text, category, priority, source}]
6) phases: [{name, duration_days, description, requirements[]}]
7) risks: [{risk, severity, mitigation}]
8) confidence_notes: [string]

Rules:
- Do NOT fabricate that a source was scraped.
- If unknown, state assumptions clearly.
- Keep dates in ISO format if possible (YYYY-MM-DD).`;
};

const toArray = (value) => (Array.isArray(value) ? value : []);

export const normalizeBidAnalysis = (analysis = {}, fallback = {}) => {
  const bidRequirements = toArray(analysis.bid_requirements).map((req) => ({
    text: req?.text || req?.requirement_text || '',
    category: (req?.category || 'other').toLowerCase(),
    priority: (req?.priority || 'medium').toLowerCase(),
    source: req?.source || 'ai'
  })).filter((req) => req.text);

  const projectRequirements = toArray(analysis.project_requirements).map((req) => ({
    text: req?.text || req?.requirement_text || '',
    category: (req?.category || 'other').toLowerCase(),
    priority: (req?.priority || 'medium').toLowerCase(),
    source: req?.source || 'ai'
  })).filter((req) => req.text);

  const normalizedPhases = toArray(analysis.phases).map((phase) => ({
    name: phase?.name || 'Unspecified phase',
    duration_days: Number(phase?.duration_days || 7),
    description: phase?.description || '',
    requirements: toArray(phase?.requirements).filter(Boolean)
  }));

  const fallbackPhases = toArray(fallback.phases || []).map((phase) => ({
    name: phase.name,
    duration_days: Number(phase.duration_days || 7),
    description: phase.description || '',
    requirements: toArray(phase.requirements)
  }));

  return {
    summary: analysis.summary || 'AI analysis complete.',
    scopeSummary: analysis?.project_overview?.scope_summary || fallback.description || '',
    timelineDays: Number(analysis?.project_overview?.timeline_days || 0) || null,
    estimatedBudget: Number(analysis?.project_overview?.estimated_budget || fallback.estimated_value || 0),
    deadlines: toArray(analysis.deadlines),
    bidRequirements,
    projectRequirements,
    phases: normalizedPhases.length > 0 ? normalizedPhases : fallbackPhases,
    risks: toArray(analysis.risks),
    confidenceNotes: toArray(analysis.confidence_notes)
  };
};
