# Bid Discovery Detailed Specification

## Purpose
Bid Discovery must retrieve **real opportunities** (not fabricated outputs), normalize them, rank them, and present actionable next steps.

## What it should do end-to-end
1. Parse user intent from the Market Intelligence chat prompt.
2. Detect filters:
   - Work type (e.g., low_voltage, electrical, hvac)
   - State (default California when unspecified)
   - Pagination defaults
3. Invoke scraper sources:
   - `scrapeCaCounties` for California county/public sources when applicable.
   - `scrapeCaliforniaBids` as primary general fallback/source.
4. Normalize output schema across sources:
   - `title/project_name`, `agency/client_name`, `due_date`, `estimated_value`, `url`.
5. Deduplicate opportunities across sources.
6. Rank opportunities by urgency/value/source quality.
7. Present summary with top opportunities and due dates.
8. Expose full normalized list in the opportunities panel for add-to-pipeline actions.

## Inputs
- User prompt text from Market Intelligence agent.
- Live scraper function responses.

## Outputs
- Ranked opportunities array (with `_priority_score`).
- Human-readable summary of top opportunities.
- Toast status indicating whether live opportunities were found.

## Failure handling
- If county scraper errors, continue with general scraper.
- If no live data exists, return explicit “no live opportunities found” summary.
- Never fabricate opportunities.

## Accuracy statement
A true "100% accuracy" guarantee is not technically possible for AI + external data pipelines because source systems can be unavailable, stale, or inconsistent. This implementation instead enforces:
- strict source gating,
- transparent fallback behavior,
- no fabricated claims,
- deterministic normalization + ranking logic,
which is the strongest practical reliability strategy.
