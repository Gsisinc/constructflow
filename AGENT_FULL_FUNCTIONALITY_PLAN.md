# AI Agents – Plan for Full Functionality

This document summarizes why the ConstructFlow AI agents don’t work as designed and outlines a concrete plan to achieve full functionality.

---

## 1. Root cause summary

| Issue | What’s wrong | Impact |
|-------|----------------|--------|
| **No UI → real agents** | AI Agents page “Use Agent” only toggles card selection; no chat opens, no `callAgent`/`streamAgent` is ever called. | Users cannot actually use any of the 10 workflow agents from the main hub. |
| **AgentChat ignores workflows** | `AgentChat.jsx` builds a short prompt from `agent.name` + `agent.description` and calls `base44.integrations.Core.InvokeLLM`. It never uses `agentWorkflows.js` or `buildAgentSystemPrompt(agent.id)`, and never calls `llmService.callAgent` or `streamAgent`. | Only place that has a chat (BidDiscovery → Market Intelligence) doesn’t use the real agent system prompts, guardrails, or outputs. |
| **Claude API key in Vite** | `llmService.js` uses `process.env.REACT_APP_CLAUDE_API_KEY`. In Vite, env vars are exposed as `import.meta.env.VITE_*`. So the key is never set in the app. | When any code path does call `callOpenAI`/`callAgent`, it will always fall back to the local `generateDynamicResponse` (no real LLM). |
| **callAgent/streamAgent unused** | No component or page passes `buildAgentSystemPrompt(agentId)` into `callAgent` or `streamAgent`. | Full workflow behavior is dead code in the front end. |
| **Live discovery not triggered from chat** | `shouldInvokeLiveDiscovery(agentId, messageText)` exists in `agentRuntimeRules.js` but is not imported or used in `BidDiscovery.jsx` or `AgentChat.jsx`. | User messages like “Find public low-voltage bids in California” in the Market Intelligence chat do not trigger live bid discovery. |
| **Custom agents duplicated** | `AIAgents.jsx` defines its own `customAgents` array (id 1–10, names only). These are not tied to `AGENT_WORKFLOWS` or agent ids like `central_orchestrator`, `market_intelligence`. | Even if we wired “Use Agent” to a chat, we’d need a separate mapping; single source of truth is `agentWorkflows.js`. |

---

## 2. Intended behavior (target)

- **Single source of truth:** All 10 agents are defined in `src/config/agentWorkflows.js` (id, name, purpose, workflow, guardrails, etc.).
- **System prompts:** When a user talks to an agent, the app uses `buildAgentSystemPrompt(agentId)` and passes that to the LLM (via `callAgent` or `streamAgent`).
- **AI Agents page:** “Use Agent” opens a chat for that agent; the chat uses the workflow-based prompt and `callAgent` (or streaming).
- **BidDiscovery Market Intelligence chat:** Same as above (workflow prompt + `callAgent`), and when the user’s message is a discovery request, the app calls `shouldInvokeLiveDiscovery` and, if true, runs live discovery and can inject results into the conversation or show the Bid Opportunities panel.
- **API keys:** Claude (and any other LLM) keys are read via `import.meta.env.VITE_*` so they work in Vite.

---

## 3. Plan to achieve full functionality

### Phase 1 – Fix LLM service and env (foundation)

**Goal:** `callAgent` and `streamAgent` can use a real LLM when keys are set; keys work in Vite.

| Step | Action | Files |
|------|--------|--------|
| 1.1 | In `llmService.js`, read Claude API key from Vite env: `import.meta.env.VITE_CLAUDE_API_KEY ?? process.env.REACT_APP_CLAUDE_API_KEY`. Use it in `callOpenAI`. | `src/services/llmService.js` |
| 1.2 | Add `VITE_CLAUDE_API_KEY` to `.env.example` (if present) and document in README that this key enables real Claude responses for agents. | `.env.example`, README (if you maintain one) |
| 1.3 | Optional: Add a small “Agent LLM status” in the app (e.g. in AI Agents or settings) that shows whether Claude key is set, so users know if they’re on real LLM or fallback. | e.g. `src/pages/AIAgents.jsx` or a shared hook |

**Outcome:** When `VITE_CLAUDE_API_KEY` is set, `callOpenAI`/`callAgent` use Claude; otherwise they keep using the existing fallback.

---

### Phase 2 – Wire AgentChat to workflow agents

**Goal:** Every place that shows an “agent chat” uses the canonical agent definition and `callAgent` with `buildAgentSystemPrompt(agentId)`.

| Step | Action | Files |
|------|--------|--------|
| 2.1 | **AgentChat:** Require that `agent` includes a valid workflow id (e.g. `agent.id` is one of `AGENT_WORKFLOWS` keys). If present, build system prompt with `buildAgentSystemPrompt(agent.id)` and call `callAgent(agentSystemPrompt, userMessage)` (from `llmService`) instead of `base44.integrations.Core.InvokeLLM` with a short prompt. If `agent.id` is missing or unknown, keep current behavior (Base44 InvokeLLM + name/description) for backward compatibility. | `src/components/agents/AgentChat.jsx` |
| 2.2 | **Imports in AgentChat:** Import `buildAgentSystemPrompt` from `@/config/agentWorkflows` and `callAgent` from `@/services/llmService`. | `src/components/agents/AgentChat.jsx` |
| 2.3 | **BidDiscovery:** Keep passing `marketIntelligenceAgent` with `id: 'market_intelligence'`. No change needed once AgentChat uses `agent.id` for the workflow prompt. | `src/pages/BidDiscovery.jsx` (optional: ensure `marketIntelligenceAgent` still has `id: 'market_intelligence'`) |

**Outcome:** The Market Intelligence chat in BidDiscovery uses the full Market Intelligence workflow (purpose, inputs, workflow steps, guardrails). Any other screen that opens AgentChat with an `agent` that has a workflow `id` will get the same behavior.

---

### Phase 3 – AI Agents page: open chat and use workflow agents

**Goal:** From the AI Agents hub, “Use Agent” opens a chat for that agent and the chat uses the same workflow + `callAgent` as in Phase 2.

| Step | Action | Files |
|------|--------|--------|
| 3.1 | **Single source of truth:** In `AIAgents.jsx`, replace the hardcoded `customAgents` array with a list derived from `AGENT_WORKFLOWS` (e.g. `Object.entries(AGENT_WORKFLOWS).map(([id, w]) => ({ id, name: w.name, desc: w.purpose, icon: ... }))`). Use a consistent mapping of id → icon/color if desired. | `src/pages/AIAgents.jsx` |
| 3.2 | **Open chat on “Use Agent”:** When the user clicks “Use Agent” for a custom agent, set state to “selected agent for chat” and render `AgentChat` in a modal/drawer (reuse the same `AgentChat` component as BidDiscovery). Pass the selected agent as an object that includes `id` (workflow id), `name`, `description` (e.g. purpose), and any UI fields (icon, color). | `src/pages/AIAgents.jsx` |
| 3.3 | **Close and selection:** “Use Agent” again toggles selection; add a clear “Chat with agent” or “Open chat” that opens the chat. Alternatively: “Use Agent” opens the chat directly and “Close” closes it. | `src/pages/AIAgents.jsx` |

**Outcome:** From the AI Agents page, users can open a chat for any of the 10 agents; that chat uses `buildAgentSystemPrompt(agentId)` and `callAgent`, so behavior matches the design.

---

### Phase 4 – Live discovery from Market Intelligence chat

**Goal:** When the user asks for bids/opportunities in the Market Intelligence chat, the app detects it and runs live discovery (and optionally shows the Bid Opportunities panel or injects results into the reply).

| Step | Action | Files |
|------|--------|--------|
| 4.1 | **Use discovery rules in chat:** In the path where AgentChat sends a message for the Market Intelligence agent (either inside `AgentChat.jsx` when `agent.id === 'market_intelligence'` or in a wrapper in BidDiscovery), after the user sends a message, call `shouldInvokeLiveDiscovery('market_intelligence', messageText)`. If true, before or in parallel to calling the LLM, invoke the existing live discovery flow (e.g. `fetchDiscoveryFromSources` or whatever BidDiscovery uses) with parsed or default filters. | `src/components/agents/AgentChat.jsx` or `src/pages/BidDiscovery.jsx` |
| 4.2 | **Integrate discovery results into reply:** Either: (a) pass discovery results as extra context into the LLM call (e.g. append to user message or system prompt: “Live discovery results: …”), or (b) show the Bid Opportunities panel when discovery returns and let the agent’s reply reference “see the opportunities panel.” Prefer (a) for a seamless “one reply” experience. | `AgentChat.jsx` or BidDiscovery |
| 4.3 | **Optional – use improved rules:** If you want better detection (e.g. “Find public low-voltage bids”) with fewer false positives, switch the app to use `agentRuntimeRules.FIXED.js` (e.g. re-export from `agentRuntimeRules.js` or change imports to the FIXED module) and use its `shouldInvokeLiveDiscovery` equivalent. | `src/config/agentRuntimeRules.js` and call sites |

**Outcome:** When a user types a discovery-style request in the Market Intelligence chat, the app runs live discovery and the agent’s response can include or reference real opportunities.

---

### Phase 5 – Optional improvements

| Item | Action |
|------|--------|
| **Streaming** | If you want streaming replies in the UI, use `streamAgent(agentSystemPrompt, userMessage, onChunk)` in AgentChat and append chunks to the assistant message as they arrive. |
| **Error and key feedback** | Show a clear message when the Claude key is missing (e.g. “Using built-in responses; set VITE_CLAUDE_API_KEY for full AI.”). |
| **AgentMessage / persistence** | If you use Base44 AgentMessage or Supabase `agent_conversations` / `agent_messages`, wire AgentChat to save/load messages there so conversations persist. |
| **Tests** | Update or add E2E/integration tests that open the AI Agents page, click “Use Agent” for one agent, send a message, and assert that the reply comes from the workflow (e.g. contains expected structure or keywords from the workflow). |

---

## 4. Implementation order

1. **Phase 1** – Fix env and LLM service so that when keys are set, agents get real LLM responses.
2. **Phase 2** – Wire AgentChat to `buildAgentSystemPrompt` + `callAgent` so the existing Market Intelligence chat is “real.”
3. **Phase 3** – AI Agents page: custom agents from `AGENT_WORKFLOWS` + open AgentChat on “Use Agent.”
4. **Phase 4** – In Market Intelligence chat, call `shouldInvokeLiveDiscovery` and integrate live discovery into the flow.
5. **Phase 5** – Streaming, key feedback, persistence, tests as needed.

---

## 5. File reference

| Purpose | File |
|--------|------|
| Agent definitions & system prompt builder | `src/config/agentWorkflows.js` |
| Discovery rules (in use) | `src/config/agentRuntimeRules.js` |
| callAgent / streamAgent / callOpenAI | `src/services/llmService.js` |
| In-app agent chat | `src/components/agents/AgentChat.jsx` |
| AI Agents hub | `src/pages/AIAgents.jsx` |
| Market Intelligence chat usage | `src/pages/BidDiscovery.jsx` |

This plan, implemented in order, should restore full functionality for the construction management app’s AI agents end to end.
