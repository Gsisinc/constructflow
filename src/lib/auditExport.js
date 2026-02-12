export function buildAuditHashChain(logs = []) {
  const ordered = [...logs].sort((a, b) => new Date(a.logged_at || a.created_date || 0) - new Date(b.logged_at || b.created_date || 0));
  let previousHash = 'GENESIS';

  return ordered.map((log) => {
    const payload = JSON.stringify({
      id: log.id,
      action: log.action,
      entity_type: log.entity_type,
      entity_id: log.entity_id,
      logged_at: log.logged_at || log.created_date,
      user_id: log.user_id,
      metadata: log.metadata,
      before_state: log.before_state,
      after_state: log.after_state,
      previousHash
    });

    const currentHash = simpleHash(payload);
    const row = {
      ...log,
      hash: currentHash,
      previous_hash: previousHash,
      chain_valid: true
    };
    previousHash = currentHash;
    return row;
  });
}

export function verifyAuditHashChain(chained = []) {
  for (let i = 0; i < chained.length; i += 1) {
    const row = chained[i];
    const expectedPrevious = i === 0 ? 'GENESIS' : chained[i - 1].hash;
    if (row.previous_hash !== expectedPrevious) {
      return { valid: false, broken_index: i };
    }
  }
  return { valid: true, broken_index: -1 };
}

export function exportAuditAsJsonl(chained = []) {
  return chained.map((row) => JSON.stringify(row)).join('\n');
}

export function exportAuditAsCsv(chained = []) {
  if (!chained.length) return '';
  const headers = ['logged_at', 'action', 'entity_type', 'entity_id', 'user_id', 'hash', 'previous_hash'];
  const lines = [headers.join(',')];
  for (const row of chained) {
    lines.push(headers.map((key) => `"${String(row[key] ?? '').replaceAll('"', '""')}"`).join(','));
  }
  return lines.join('\n');
}

function simpleHash(text) {
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }
  return `h${Math.abs(hash).toString(16)}`;
}
