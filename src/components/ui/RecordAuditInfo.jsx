import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { fmtDate } from '@/lib/dates';
import { User as UserIcon, Clock, History } from 'lucide-react';
import { cn } from '@/lib/utils';

// Module-level cache: created_by_id -> { full_name, email }
const userCache = new Map();

function sameDay(a, b) {
  if (!a || !b) return false;
  return String(a).slice(0, 10) === String(b).slice(0, 10);
}

/**
 * Shows "Entered by <user> on <date>" and, when the record was edited later,
 * "Last edited <date>" for any record. Leverages the platform's automatic
 * created_by_id / created_date / updated_date fields, and falls back to a
 * record's own `entered_by` text field when the creator can't be resolved.
 */
export default function RecordAuditInfo({ record, className }) {
  const [creator, setCreator] = useState(null);
  const [loading, setLoading] = useState(false);

  const creatorId = record?.created_by_id;
  const enteredBy = record?.entered_by;

  useEffect(() => {
    if (!creatorId) return;
    if (userCache.has(creatorId)) {
      setCreator(userCache.get(creatorId));
      return;
    }
    setLoading(true);
    base44.entities.User
      .filter({ id: creatorId })
      .then((users) => {
        const u = users?.[0] || null;
        userCache.set(creatorId, u);
        setCreator(u);
      })
      .catch(() => {
        userCache.set(creatorId, null);
        setCreator(null);
      })
      .finally(() => setLoading(false));
  }, [creatorId]);

  const name =
    creator?.full_name ||
    creator?.email ||
    enteredBy ||
    (loading ? 'Loading…' : 'Unknown');

  const created = record?.created_date;
  const updated = record?.updated_date;
  const editedLater = updated && !sameDay(created, updated);

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500',
        className
      )}
    >
      <span className="inline-flex items-center gap-1.5">
        <UserIcon className="h-3.5 w-3.5 text-slate-400" />
        <span>Entered by <span className="font-medium text-slate-700">{name}</span></span>
      </span>
      {created && (
        <span className="inline-flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-slate-400" />
          <span>{fmtDate(created, 'MMM d, yyyy h:mm a')}</span>
        </span>
      )}
      {editedLater && (
        <span className="inline-flex items-center gap-1.5">
          <History className="h-3.5 w-3.5 text-slate-400" />
          <span>Last edited {fmtDate(updated, 'MMM d, yyyy h:mm a')}</span>
        </span>
      )}
    </div>
  );
}