#!/usr/bin/env node
/**
 * Creates your first Supabase user, organization, and profile.
 * Run from project root: node scripts/setup-supabase-user.mjs your@email.com YourPassword "Your Name"
 *
 * Requires: .env.local with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
 * Or set SUPABASE_URL and SUPABASE_ANON_KEY in the environment.
 */

import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

function loadEnvFile(filename) {
  const filepath = resolve(process.cwd(), filename);
  if (!existsSync(filepath)) return {};
  const content = readFileSync(filepath, 'utf8').replace(/\r\n/g, '\n');
  const out = {};
  for (const line of content.split('\n')) {
    const m = line.match(/^\s*([^#=]+)=(.*)$/);
    if (m) out[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
  }
  return out;
}

const env = { ...process.env, ...loadEnvFile('.env'), ...loadEnvFile('.env.local') };
const SUPABASE_URL = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
const SUPABASE_ANON = env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY;

const [email, password, fullName] = process.argv.slice(2);
if (!email || !password) {
  console.error('Usage: node scripts/setup-supabase-user.mjs <email> <password> [ "Full Name" ]');
  process.exit(1);
}
const name = fullName || email.split('@')[0];

if (!SUPABASE_URL || !SUPABASE_ANON) {
  console.error('Missing Supabase config.');
  console.error('Add to .env.local (or .env): VITE_SUPABASE_URL=... and VITE_SUPABASE_ANON_KEY=...');
  console.error('Or set env vars: SUPABASE_URL and SUPABASE_ANON_KEY');
  process.exit(1);
}

async function main() {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_ANON,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) {
    console.error('Signup failed:', data?.msg || data?.error_description || res.statusText);
    process.exit(1);
  }
  const token = data.access_token;
  const userId = data.user?.id;
  if (!token || !userId) {
    console.error('Unexpected response:', data);
    process.exit(1);
  }

  const orgRes = await fetch(`${SUPABASE_URL}/rest/v1/organizations`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_ANON,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify({
      name: name + "'s Company",
      owner_id: userId,
      owner_email: email,
    }),
  });
  if (!orgRes.ok) {
    const err = await orgRes.text();
    console.error('Create organization failed:', err);
    process.exit(1);
  }
  const orgs = await orgRes.json();
  const orgId = Array.isArray(orgs) ? orgs[0]?.id : orgs?.id;
  if (!orgId) {
    console.error('Could not get organization id:', orgs);
    process.exit(1);
  }

  const profileRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_ANON,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({
      id: userId,
      full_name: name,
      organization_id: orgId,
    }),
  });
  if (!profileRes.ok) {
    const err = await profileRes.text();
    console.error('Create profile failed:', err);
    process.exit(1);
  }

  console.log('Done.');
  console.log('User:', email);
  console.log('Org:', orgId);
  console.log('You can now sign in at /Login with this email and password.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
