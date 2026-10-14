import { base44 } from '@/api/base44Client';

const PAGE_LABELS = {
  AIAgents: 'the AI Agents Hub',
  Dashboard: 'the dashboard',
  Bids: 'the Bids pipeline',
  Projects: 'the Projects list',
  ProjectDetail: 'a project',
  Billing: 'Billing',
  Estimates: 'Estimates',
  Leads: 'Leads',
  ContractorDirectory: 'the Contractor Directory',
  RateCard: 'the Rate Card',
  Suppliers: 'Suppliers',
  Documents: 'Documents',
  Calendar: 'the Schedule',
  Issues: 'Issues',
  ServiceDesk: 'the Service Desk',
};

/**
 * Build a short, plain-language context string describing the page/project the
 * user is currently viewing, so an agent can answer "what's this?" with real data.
 */
export async function buildPageContext(pageName) {
  const label = PAGE_LABELS[pageName] || (pageName ? pageName : 'the app');
  let ctx = `The user is currently viewing ${label}.`;

  if (pageName === 'ProjectDetail') {
    try {
      const id = new URLSearchParams(window.location.search).get('id');
      if (id) {
        const p = await base44.entities.Project.get(id);
        if (p) {
          ctx += ` Current project: "${p.name}" — status ${p.status || 'unknown'}, client ${p.client_name || 'n/a'}, progress ${p.progress || 0}%${p.current_phase ? `, phase ${p.current_phase}` : ''}.`;
        }
      }
    } catch (_) {}
  }
  return ctx;
}

export const AGENT_GROUNDING = ' When I ask "what\'s this?" or about the current page/project, use your tools to pull the relevant app data and answer with real records. If I ask you to write an email or message, draft it in full in your reply for me to review and send myself — never claim to send it automatically.';