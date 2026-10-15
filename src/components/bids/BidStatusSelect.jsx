import React from 'react';

// All owner bid statuses, offered everywhere a status can change.
export const BID_STATUSES = [
  'review', 'intake', 'off_pricing', 'no_bid', 'user_analyzing',
  'estimated', 'submitted', 'won', 'lost', 'closed',
];

export default function BidStatusSelect({ value, onChange, className }) {
  return (
    <select
      value={value || 'review'}
      onChange={(e) => onChange(e.target.value)}
      className={`border border-slate-200 rounded-md bg-white px-2 text-xs focus-visible:border-gold-500 focus-visible:ring-2 focus-visible:ring-gold-500/30 outline-none ${className || ''}`}
    >
      {BID_STATUSES.map((s) => (
        <option key={s} value={s}>{s.replace('_', ' ')}</option>
      ))}
    </select>
  );
}