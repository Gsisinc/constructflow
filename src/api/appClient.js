import { supabase, isSupabaseConfigured } from './supabaseClient';

const toSnakeCase = (value) =>
  value
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1_$2')
    .toLowerCase();

const parseSort = (sortBy) => {
  if (!sortBy) return { column: 'created_at', ascending: false };
  const isDescending = String(sortBy).startsWith('-');
  const raw = String(sortBy).replace(/^-/, '');
  const normalized = raw === 'created_date' ? 'created_at' : toSnakeCase(raw);
  return { column: normalized, ascending: !isDescending };
};

const tableNameFromEntity = (entityName) => `${toSnakeCase(entityName)}s`;

const coerceRecord = (record) => {
  if (!record || typeof record !== 'object') return record;
  if (record.created_at && !record.created_date) {
    return { ...record, created_date: record.created_at };
  }
  return record;
};

const encodeFilters = (filters = {}) =>
  Object.entries(filters)
    .map(([key, value]) => `${toSnakeCase(key)}=eq.${encodeURIComponent(value)}`)
    .join('&');

const queryRows = async ({ table, filters = {}, sortBy, limit, select = '*' }) => {
  const { column, ascending } = parseSort(sortBy);
  const filterQuery = encodeFilters(filters);
  const sortQuery = `order=${column}.${ascending ? 'asc' : 'desc'}`;
  const limitQuery = typeof limit === 'number' ? `&limit=${limit}` : '';
  const query = [filterQuery, sortQuery].filter(Boolean).join('&');

  return supabase.request({
    path: `/rest/v1/${table}?select=${select}${query ? `&${query}` : ''}${limitQuery}`
  });
};

const createRow = async ({ table, payload }) => {
  const rows = await supabase.request({
    path: `/rest/v1/${table}`,
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: payload
  });
  return Array.isArray(rows) ? rows[0] : rows;
};

const updateRow = async ({ table, id, payload }) => {
  const rows = await supabase.request({
    path: `/rest/v1/${table}?id=eq.${id}`,
    method: 'PATCH',
    headers: { Prefer: 'return=representation' },
    body: payload
  });
  return Array.isArray(rows) ? rows[0] : rows;
};

const deleteRow = async ({ table, id }) => {
  await supabase.request({
    path: `/rest/v1/${table}?id=eq.${id}`,
    method: 'DELETE'
  });
  return { success: true };
};

const buildEntityClient = (entityName) => {
  const table = tableNameFromEntity(entityName);

  return {
    async list(sortBy, limit) {
      const data = await queryRows({ table, sortBy, limit });
      return (data ?? []).map(coerceRecord);
    },

    async filter(filters = {}, sortBy, limit) {
      const data = await queryRows({ table, filters, sortBy, limit });
      return (data ?? []).map(coerceRecord);
    },

    async create(payload) {
      const data = await createRow({ table, payload });
      return coerceRecord(data);
    },

    async update(id, payload) {
      const data = await updateRow({ table, id, payload });
      return coerceRecord(data);
    },

    async delete(id) {
      return deleteRow({ table, id });
    }
  };
};

const entitiesProxy = new Proxy(
  {},
  {
    get(_target, prop) {
      if (typeof prop !== 'string') return undefined;
      return buildEntityClient(prop);
    }
  }
);

const uploadFile = async ({ file, bucket = 'documents', path }) => {
  const ext = file.name?.split('.').pop();
  const filename = `${crypto.randomUUID()}${ext ? `.${ext}` : ''}`;
  const targetPath = path || filename;
  const token = supabase.getAccessToken();

  const uploadResponse = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/${bucket}/${targetPath}`,
    {
      method: 'POST',
      headers: {
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        Authorization: `Bearer ${token || import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': file.type || 'application/octet-stream'
      },
      body: file
    }
  );

  if (!uploadResponse.ok) {
    const details = await uploadResponse.text();
    throw new Error(`File upload failed (${uploadResponse.status}): ${details}`);
  }

  const fileUrl = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/${bucket}/${targetPath}`;
  return { file_url: fileUrl, path: targetPath, bucket };
};

const invokeFunction = async (name, payload = {}) => {
  const { data, error } = await supabase.functions.invoke(name, {
    body: payload
  });
  if (error) throw error;
  return data;
};

const loadConversationWithMessages = async (conversationId) => {
  const [conversation] = await queryRows({
    table: 'agent_conversations',
    filters: { id: conversationId },
    limit: 1
  });

  if (!conversation) {
    throw new Error('Conversation not found.');
  }

  const messages = await queryRows({
    table: 'agent_messages',
    filters: { conversation_id: conversationId },
    sortBy: 'created_at',
    limit: 200
  });

  return {
    ...conversation,
    messages: messages || []
  };
};

const agents = {
  async listConversations(filters = {}) {
    const data = await queryRows({
      table: 'agent_conversations',
      filters,
      sortBy: '-updated_at',
      limit: 30
    });

    return data || [];
  },

  async createConversation(payload = {}) {
    const user = await appClient.auth.me();

    const created = await createRow({
      table: 'agent_conversations',
      payload: {
        user_id: user?.id,
        agent_name: payload.agent_name,
        metadata: payload.metadata || {},
        status: 'active'
      }
    });

    return {
      ...created,
      messages: []
    };
  },

  subscribeToConversation(conversationId, callback, pollMs = 2500) {
    let stopped = false;

    const poll = async () => {
      if (stopped) return;
      try {
        const latest = await loadConversationWithMessages(conversationId);
        callback(latest);
      } catch {
        // ignore polling errors; next cycle will retry
      }
    };

    poll();
    const timer = setInterval(poll, pollMs);

    return () => {
      stopped = true;
      clearInterval(timer);
    };
  },

  async addMessage(conversation, message) {
    const conversationId = conversation?.id || conversation;
    if (!conversationId) {
      throw new Error('Conversation id is required.');
    }

    await createRow({
      table: 'agent_messages',
      payload: {
        conversation_id: conversationId,
        role: message.role,
        content: message.content,
        metadata: message.metadata || {}
      }
    });

    if (message.role === 'user') {
      const modelResponse = await invokeFunction('invoke-llm', {
        prompt: message.content,
        temperature: 0.2
      });

      await createRow({
        table: 'agent_messages',
        payload: {
          conversation_id: conversationId,
          role: 'assistant',
          content: modelResponse?.output || 'I am ready to help with your construction workflow.',
          metadata: {
            provider: 'openai',
            model: 'gpt-4o-mini'
          }
        }
      });

      await updateRow({
        table: 'agent_conversations',
        id: conversationId,
        payload: {
          updated_at: new Date().toISOString()
        }
      });
    }

    return loadConversationWithMessages(conversationId);
  }
};

export const appClient = {
  enabled: isSupabaseConfigured,
  auth: {
    async me() {
      const { data, error } = await supabase.auth.getUser();
      if (error) throw error;
      const user = data?.user;
      if (!user) return null;
      try {
        const profiles = await supabase.request({
          path: `/rest/v1/profiles?id=eq.${user.id}&select=full_name,organization_id,role&limit=1`,
          headers: {
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
            Authorization: `Bearer ${supabase.getAccessToken() || import.meta.env.VITE_SUPABASE_ANON_KEY}`
          }
        });
        const profile = Array.isArray(profiles) ? profiles[0] : profiles;
        return {
          ...user,
          full_name: profile?.full_name ?? user.email,
          organization_id: profile?.organization_id ?? null,
          role: profile?.role ?? null
        };
      } catch {
        return { ...user, full_name: user.email, organization_id: null, role: null };
      }
    },
    async isAuthenticated() {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      return Boolean(data.session);
    },
    async logout(returnToUrl) {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      if (returnToUrl) window.location.href = returnToUrl;
    },
    redirectToLogin(returnToUrl = window.location.href) {
      window.location.href = `/login?redirect=${encodeURIComponent(returnToUrl)}`;
    },
    async updateMe(payload) {
      const user = await this.me();
      const data = await updateRow({ table: 'profiles', id: user.id, payload });
      return coerceRecord(data);
    },
    async deleteAccount() {
      throw new Error('deleteAccount requires a secured backend function.');
    }
  },
  agents,
  entities: entitiesProxy,
  functions: {
    invoke: invokeFunction
  },
  integrations: {
    Core: {
      UploadFile: uploadFile,
      async InvokeLLM(payload) {
        return invokeFunction('invoke-llm', payload);
      }
    }
  }
};
