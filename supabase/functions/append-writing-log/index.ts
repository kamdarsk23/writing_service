import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

type AuditAction = 'created' | 'edited' | 'deleted';

const CSV_HEADER = 'date,time,piece_name,action';

function corsHeaders(req: Request): HeadersInit {
  const origin = req.headers.get('Origin') ?? '*';
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
}

function escapeCsvField(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function utf8ToBase64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
}

function base64ToUtf8(b64: string): string {
  const clean = b64.replace(/\n/g, '');
  const binary = atob(clean);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

function encodeRepoPath(path: string): string {
  return path.split('/').map(encodeURIComponent).join('/');
}

async function getGithubFile(
  owner: string,
  repo: string,
  filePath: string,
  branch: string,
  token: string,
): Promise<{ content: string; sha: string } | null> {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeRepoPath(filePath)}?ref=${encodeURIComponent(branch)}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`GitHub GET ${res.status}: ${t}`);
  }
  const data = (await res.json()) as { content?: string; sha?: string; encoding?: string };
  if (data.encoding !== 'base64' || !data.content || !data.sha) {
    throw new Error('Unexpected GitHub contents response');
  }
  return { content: base64ToUtf8(data.content), sha: data.sha };
}

async function putGithubFile(
  owner: string,
  repo: string,
  filePath: string,
  branch: string,
  token: string,
  message: string,
  newContent: string,
  sha: string | undefined,
): Promise<void> {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeRepoPath(filePath)}`;
  const body: Record<string, string> = {
    message,
    content: utf8ToBase64(newContent),
    branch,
  };
  if (sha) body.sha = sha;

  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (res.ok) return;
  const t = await res.text();
  throw new Error(`GitHub PUT ${res.status}: ${t}`);
}

async function appendCsvRow(
  owner: string,
  repo: string,
  filePath: string,
  branch: string,
  token: string,
  pieceName: string,
  action: AuditAction,
): Promise<void> {
  const now = new Date();
  const date = now.toISOString().slice(0, 10);
  const time = now.toISOString().slice(11, 19);
  const row =
    [
      escapeCsvField(date),
      escapeCsvField(time),
      escapeCsvField(pieceName),
      escapeCsvField(action),
    ].join(',') + '\n';

  const commitMessage = `writing-audit: ${action} — ${pieceName.slice(0, 60)}`;

  const attempt = async (): Promise<void> => {
    const existing = await getGithubFile(owner, repo, filePath, branch, token);
    let body: string;
    let sha: string | undefined;
    if (existing === null) {
      body = `${CSV_HEADER}\n${row}`;
      sha = undefined;
    } else {
      const base = existing.content.endsWith('\n') ? existing.content : `${existing.content}\n`;
      body = base + row;
      sha = existing.sha;
    }
    await putGithubFile(owner, repo, filePath, branch, token, commitMessage, body, sha);
  };

  try {
    await attempt();
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    // Concurrent updates: refetch SHA and append again once.
    if (msg.includes('409')) {
      await attempt();
      return;
    }
    throw e;
  }
}

Deno.serve(async (req) => {
  const headers = { ...corsHeaders(req), 'Content-Type': 'application/json' };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const githubToken = Deno.env.get('GITHUB_TOKEN');
  const owner = Deno.env.get('GITHUB_OWNER');
  const repo = Deno.env.get('GITHUB_REPO');
  const filePath = Deno.env.get('GITHUB_FILE_PATH') ?? 'writing_audit.csv';
  const branch = Deno.env.get('GITHUB_BRANCH') ?? 'main';

  if (!supabaseUrl || !anonKey || !serviceRole || !githubToken || !owner || !repo) {
    return new Response(JSON.stringify({ error: 'Server misconfigured' }), { status: 500, headers });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers });
  }

  const supabaseUser = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const {
    data: { user },
    error: userError,
  } = await supabaseUser.auth.getUser();
  if (userError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers });
  }

  let body: { action?: string; workId?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers });
  }

  const action = body.action as AuditAction | undefined;
  const workId = body.workId;
  if (!action || !workId || !['created', 'edited', 'deleted'].includes(action)) {
    return new Response(JSON.stringify({ error: 'Invalid action or workId' }), { status: 400, headers });
  }

  const admin = createClient(supabaseUrl, serviceRole);
  const { data: work, error: workError } = await admin
    .from('works')
    .select('user_id, title')
    .eq('id', workId)
    .maybeSingle();

  if (workError) {
    return new Response(JSON.stringify({ error: 'Lookup failed' }), { status: 500, headers });
  }
  if (!work) {
    return new Response(JSON.stringify({ error: 'Work not found' }), { status: 404, headers });
  }
  if (work.user_id !== user.id) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers });
  }

  try {
    await appendCsvRow(owner, repo, filePath, branch, githubToken, work.title, action);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'GitHub error';
    console.error(message);
    return new Response(JSON.stringify({ error: message }), { status: 502, headers });
  }

  return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
});
