// Shared helpers for the "Entered by" + timestamp audit pattern.
//
// The platform already auto-stamps every record with created_by_id,
// created_date and updated_date, so RecordAuditInfo can display "Entered by /
// Last edited" for any record without per-form wiring. For entities that ALSO
// keep a human-readable `entered_by` email (and optional `updated_by`), these
// helpers let a form auto-fill it from the current user on create/edit.

import { base44 } from '@/api/base44Client';

let _currentUser = null;

// Resolve and cache the current app user so forms don't refetch on every save.
export async function getCurrentUser() {
  if (_currentUser) return _currentUser;
  try {
    _currentUser = await base44.auth.me();
  } catch {
    _currentUser = null;
  }
  return _currentUser;
}

// Stamp a create payload with the current user's email (when the entity has
// an `entered_by` field). Safe to call for any entity — unknown fields are
// simply ignored by the server.
export async function stampCreate(data = {}) {
  const user = await getCurrentUser();
  return {
    ...data,
    entered_by: user?.email || data.entered_by || '',
    updated_by: user?.email || data.updated_by || '',
  };
}

// Stamp an edit payload with the current user's email (when the entity has
// an `updated_by` field).
export async function stampUpdate(data = {}) {
  const user = await getCurrentUser();
  return {
    ...data,
    updated_by: user?.email || data.updated_by || '',
  };
}