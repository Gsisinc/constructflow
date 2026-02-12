import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';
import { appClient } from './appClient';

const { appId, token, functionsVersion, appBaseUrl } = appParams;

const backendProvider = import.meta.env.VITE_BACKEND_PROVIDER || 'base44';
const supabaseExperimental = import.meta.env.VITE_ENABLE_SUPABASE_EXPERIMENTAL === 'true';
const requestedSupabase = backendProvider === 'supabase';
const useSupabase = requestedSupabase && supabaseExperimental;

const base44SdkClient = createClient({
  appId,
  token,
  functionsVersion,
  serverUrl: '',
  requiresAuth: false,
  appBaseUrl
});

if (requestedSupabase && !supabaseExperimental) {
  console.warn('Supabase mode is disabled unless VITE_ENABLE_SUPABASE_EXPERIMENTAL=true. Using Base44.');
}

if (useSupabase && !appClient.enabled) {
  console.warn('Supabase mode requested but env vars are missing. Falling back to Base44.');
}

export const base44 = useSupabase && appClient.enabled ? appClient : base44SdkClient;
