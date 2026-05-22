import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

type InvitePayload = {
  email?: string;
  password?: string;
  displayName?: string;
};

function corsHeaders(req: Request): HeadersInit {
  const origin = req.headers.get('Origin') ?? '*';
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
}

Deno.serve(async (req) => {
  const headers = { ...corsHeaders(req), 'Content-Type': 'application/json' };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers,
    });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const ownerEmail = (Deno.env.get('OWNER_EMAIL') ?? '').trim().toLowerCase();

  if (!supabaseUrl || !anonKey || !serviceRole || !ownerEmail) {
    return new Response(JSON.stringify({ error: 'Server misconfigured' }), {
      status: 500,
      headers,
    });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers,
    });
  }

  const supabaseUser = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const {
    data: { user },
    error: userError,
  } = await supabaseUser.auth.getUser();

  if (userError || !user || !user.email) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers,
    });
  }

  if (user.email.toLowerCase() !== ownerEmail) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers,
    });
  }

  let payload: InvitePayload;
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers,
    });
  }

  const email = payload.email?.trim().toLowerCase() ?? '';
  const password = payload.password?.trim() ?? '';
  const displayName = payload.displayName?.trim() ?? '';

  if (!email || !password) {
    return new Response(JSON.stringify({ error: 'Email and password are required' }), {
      status: 400,
      headers,
    });
  }
  if (password.length < 6) {
    return new Response(JSON.stringify({ error: 'Password must be at least 6 characters' }), {
      status: 400,
      headers,
    });
  }

  const admin = createClient(supabaseUrl, serviceRole);
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: displayName ? { display_name: displayName } : undefined,
  });

  if (error || !data.user) {
    return new Response(JSON.stringify({ error: error?.message ?? 'Failed to create user' }), {
      status: 400,
      headers,
    });
  }

  return new Response(
    JSON.stringify({
      ok: true,
      invitedUser: {
        id: data.user.id,
        email: data.user.email,
      },
    }),
    { status: 200, headers },
  );
});
