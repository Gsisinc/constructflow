const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

const jsonHeaders = (accessToken) => ({
  apikey: supabaseAnonKey,
  Authorization: `Bearer ${accessToken || supabaseAnonKey}`,
  'Content-Type': 'application/json'
});

const getAccessToken = () => {
  const entries = Object.entries(localStorage);
  const authEntry = entries.find(([key]) => key.startsWith('sb-') && key.endsWith('-auth-token'));
  if (!authEntry) return null;

  try {
    const parsed = JSON.parse(authEntry[1]);
    return parsed?.access_token || null;
  } catch {
    return null;
  }
};

const request = async ({ path, method = 'GET', body = null, accessToken = null, headers = {} }) => {
  const response = await fetch(`${supabaseUrl}${path}`, {
    method,
    headers: { ...jsonHeaders(accessToken || getAccessToken()), ...headers },
    body: body ? JSON.stringify(body) : undefined
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(data?.message || `Supabase request failed: ${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
};

const auth = {
  async getUser() {
    const token = getAccessToken();
    if (!token) return { data: { user: null }, error: null };

    const data = await request({
      path: '/auth/v1/user',
      accessToken: token
    });

    return { data: { user: data }, error: null };
  },

  async getSession() {
    const token = getAccessToken();
    if (!token) return { data: { session: null }, error: null };
    return { data: { session: { access_token: token } }, error: null };
  },

  async signOut() {
    const token = getAccessToken();
    if (!token) return { error: null };

    await request({
      path: '/auth/v1/logout',
      method: 'POST',
      accessToken: token
    });

    return { error: null };
  }
};

const functions = {
  async invoke(name, { body = null } = {}) {
    const data = await request({
      path: `/functions/v1/${name}`,
      method: 'POST',
      body
    });
    return { data, error: null };
  }
};

export const supabase = {
  auth,
  functions,
  request,
  getAccessToken
};
