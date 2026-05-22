import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

type DeletePayload = {
  email?: string;
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
    data: { user: requester },
    error: requesterError,
  } = await supabaseUser.auth.getUser();
  if (requesterError || !requester || !requester.email) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers,
    });
  }

  if (requester.email.toLowerCase() !== ownerEmail) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers,
    });
  }

  let payload: DeletePayload;
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers,
    });
  }

  const targetEmail = payload.email?.trim().toLowerCase() ?? '';
  if (!targetEmail) {
    return new Response(JSON.stringify({ error: 'Email is required' }), {
      status: 400,
      headers,
    });
  }
  if (targetEmail === ownerEmail) {
    return new Response(JSON.stringify({ error: 'Owner account cannot be deleted' }), {
      status: 400,
      headers,
    });
  }

  const admin = createClient(supabaseUrl, serviceRole);
  let page = 1;
  const perPage = 200;
  let foundUserId: string | null = null;

  while (page <= 50 && !foundUserId) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers,
      });
    }
    const users = data.users ?? [];
    const match = users.find((u) => (u.email ?? '').toLowerCase() === targetEmail);
    if (match) {
      foundUserId = match.id;
      break;
    }
    if (users.length < perPage) {
      break;
    }
    page += 1;
  }

  if (!foundUserId) {
    return new Response(JSON.stringify({ error: 'User not found' }), {
      status: 404,
      headers,
    });
  }

  const { error: deleteError } = await admin.auth.admin.deleteUser(foundUserId);
  if (deleteError) {
    return new Response(JSON.stringify({ error: deleteError.message }), {
      status: 500,
      headers,
    });
  }

  return new Response(
    JSON.stringify({
      ok: true,
      deletedEmail: targetEmail,
      note: 'User deleted. Related rows should cascade via foreign keys.',
    }),
    { status: 200, headers },
  );
});
