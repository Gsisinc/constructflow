export const CONNECTOR_REGISTRY = {
  quickbooks: {
    provider: 'quickbooks',
    entities: ['vendors', 'purchase_orders', 'invoices', 'expenses'],
    supportsBidirectional: true
  },
  sage: {
    provider: 'sage',
    entities: ['vendors', 'purchase_orders', 'invoices', 'expenses'],
    supportsBidirectional: true
  },
  netsuite: {
    provider: 'netsuite',
    entities: ['vendors', 'purchase_orders', 'invoices', 'projects', 'expenses'],
    supportsBidirectional: true
  },
  procore: {
    provider: 'procore',
    entities: ['projects', 'submittals', 'rfis', 'daily_logs'],
    supportsBidirectional: true
  },
  autodesk_acc: {
    provider: 'autodesk_acc',
    entities: ['projects', 'docs', 'issues', 'rfis'],
    supportsBidirectional: true
  }
};

export function listConnectorCapabilities() {
  return Object.values(CONNECTOR_REGISTRY);
}

export function detectReconciliationConflicts({ sourceRecords = [], targetRecords = [], key = 'external_id' }) {
  const targetMap = new Map(targetRecords.map((row) => [row[key], row]));
  const conflicts = [];

  for (const sourceRow of sourceRecords) {
    const targetRow = targetMap.get(sourceRow[key]);
    if (!targetRow) continue;

    const diffFields = Object.keys(sourceRow).filter((field) => {
      if (field === key) return false;
      return JSON.stringify(sourceRow[field] ?? null) !== JSON.stringify(targetRow[field] ?? null);
    });

    if (diffFields.length) {
      conflicts.push({
        external_id: sourceRow[key],
        diff_fields: diffFields,
        source: sourceRow,
        target: targetRow
      });
    }
  }

  return conflicts;
}
