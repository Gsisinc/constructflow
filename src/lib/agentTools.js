/**
 * Agent tools: definitions and executor so agents can complete tasks (create tasks, run discovery, add bids, etc.).
 */
import { fetchDiscoveryFromSources } from '@/lib/bidDiscoveryOrchestrator';

/** OpenAI-style tool definition (also usable for Claude input_schema) */
export const AGENT_TOOL_DEFINITIONS = [
  {
    name: 'run_bid_discovery',
    description: 'Run live bid discovery from SAM.gov and portals. Use when the user asks to find opportunities, search for bids, or discover projects. Returns a list of opportunities with title, agency, location, due_date, url.',
    input_schema: {
      type: 'object',
      properties: {
        state: { type: 'string', description: 'State name e.g. California, Texas' },
        work_type: { type: 'string', description: 'Optional: low_voltage, electrical, hvac, etc.' },
      },
      required: ['state'],
    },
  },
  {
    name: 'add_opportunity_to_pipeline',
    description: 'Add a bid opportunity to the user pipeline (creates a BidOpportunity record). Call this after run_bid_discovery when the user wants to save or add specific opportunities.',
    input_schema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Opportunity/project title' },
        agency: { type: 'string', description: 'Agency or client name' },
        location: { type: 'string', description: 'Location' },
        due_date: { type: 'string', description: 'Due date YYYY-MM-DD if known' },
        url: { type: 'string', description: 'Link to RFP/solicitation' },
        estimated_value: { type: 'number', description: 'Estimated value if known' },
      },
      required: ['title', 'agency'],
    },
  },
  {
    name: 'list_projects',
    description: 'List projects for the organization. Use when the user asks to see projects or when you need a project_id to create a task.',
    input_schema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'create_task',
    description: 'Create a task on a project. Use when the user asks to create a task, add a to-do, or schedule work.',
    input_schema: {
      type: 'object',
      properties: {
        project_id: { type: 'string', description: 'UUID of the project' },
        title: { type: 'string', description: 'Task title' },
        description: { type: 'string', description: 'Optional task description' },
        due_date: { type: 'string', description: 'Optional due date YYYY-MM-DD' },
        status: { type: 'string', description: 'Optional: todo, in_progress, done', enum: ['todo', 'in_progress', 'done'] },
      },
      required: ['project_id', 'title'],
    },
  },
  {
    name: 'create_project',
    description: 'Create a new project. Use when the user asks to create a project or start a new job.',
    input_schema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Project name' },
        description: { type: 'string', description: 'Optional description' },
        status: { type: 'string', description: 'Optional: planning, in_progress, completed', enum: ['planning', 'in_progress', 'completed'] },
      },
      required: ['name'],
    },
  },
];

/**
 * Execute a single tool and return a string result for the LLM.
 * @param {string} name - Tool name
 * @param {Record<string, unknown>} args - Tool arguments
 * @param {{ base44: object, user: { organization_id: string } }} context
 * @returns {Promise<string>} Result summary
 */
export async function executeTool(name, args, context) {
  const { base44, user } = context;
  const orgId = user?.organization_id;
  if (!base44) return JSON.stringify({ error: 'No API client' });
  if (!orgId && (name !== 'run_bid_discovery')) return JSON.stringify({ error: 'User organization required' });

  try {
    switch (name) {
      case 'run_bid_discovery': {
        const state = (args.state || 'California').toString();
        const workType = (args.work_type || 'all').toString();
        const { opportunities = [] } = await fetchDiscoveryFromSources({
          base44Client: base44,
          filters: { state, workType, classification: 'all' },
          page: 1,
          pageSize: 25,
        });
        const summary = opportunities.slice(0, 15).map((o, i) =>
          `${i + 1}. ${o.title || 'Untitled'} | ${o.agency || 'N/A'} | ${o.location || 'N/A'} | Due: ${o.due_date || 'N/A'} | ${o.url || 'no link'}`
        ).join('\n');
        return JSON.stringify({
          count: opportunities.length,
          message: `Found ${opportunities.length} opportunities. Top 15:\n${summary}`,
          opportunities: opportunities.slice(0, 15).map((o) => ({
            title: o.title,
            agency: o.agency,
            location: o.location,
            due_date: o.due_date,
            url: o.url,
            estimated_value: o.estimated_value,
          })),
        });
      }
      case 'add_opportunity_to_pipeline': {
        const title = (args.title || '').toString().trim();
        const agency = (args.agency || '').toString().trim();
        if (!title || !agency) return JSON.stringify({ error: 'title and agency required' });
        const record = await base44.entities.BidOpportunity.create({
          organization_id: orgId,
          title,
          client_name: agency,
          agency,
          location: (args.location || '').toString() || null,
          due_date: (args.due_date || '').toString() || null,
          url: (args.url || '').toString() || null,
          estimated_value: typeof args.estimated_value === 'number' ? args.estimated_value : null,
          status: 'active',
        });
        return JSON.stringify({
          success: true,
          id: record?.id,
          message: `Added to pipeline: "${title}" (${agency})`,
        });
      }
      case 'list_projects': {
        const list = await base44.entities.Project.filter({ organization_id: orgId }, '-created_at');
        const summary = (list || []).map((p) => `${p.name} (id: ${p.id})`).join('\n');
        return JSON.stringify({
          count: (list || []).length,
          message: summary || 'No projects found.',
          projects: (list || []).map((p) => ({ id: p.id, name: p.name })),
        });
      }
      case 'create_task': {
        const project_id = (args.project_id || '').toString().trim();
        const title = (args.title || '').toString().trim();
        if (!project_id || !title) return JSON.stringify({ error: 'project_id and title required' });
        const task = await base44.entities.Task.create({
          project_id,
          organization_id: orgId,
          title,
          description: (args.description || '').toString() || null,
          due_date: (args.due_date || '').toString() || null,
          status: (args.status || 'todo').toString() || 'todo',
        });
        return JSON.stringify({
          success: true,
          id: task?.id,
          message: `Created task: "${title}"`,
        });
      }
      case 'create_project': {
        const name = (args.name || '').toString().trim();
        if (!name) return JSON.stringify({ error: 'name required' });
        const proj = await base44.entities.Project.create({
          organization_id: orgId,
          name,
          description: (args.description || '').toString() || null,
          status: (args.status || 'planning').toString() || 'planning',
        });
        return JSON.stringify({
          success: true,
          id: proj?.id,
          message: `Created project: "${name}"`,
        });
      }
      default:
        return JSON.stringify({ error: `Unknown tool: ${name}` });
    }
  } catch (err) {
    return JSON.stringify({ error: err.message || 'Tool execution failed' });
  }
}

/** Human-readable summary of what was done (for UI "Actions taken") */
export function formatActionsTaken(toolResults) {
  return (toolResults || [])
    .filter((r) => r.result && !String(r.result).includes('"error":'))
    .map((r) => {
      try {
        const data = JSON.parse(r.result);
        return data.message || data.success ? `✓ ${r.name} completed` : null;
      } catch (_) {
        return `✓ ${r.name} completed`;
      }
    })
    .filter(Boolean);
}
