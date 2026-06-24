import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { getAndroidInstallUrl, getIosInstallUrl } from '../_shared/installUrls.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const APP_SCHEME = 'rallyapp';
const PENDING_KEY = 'rally_pending_invite_v1';

const IOS_INSTALL = getIosInstallUrl();
const ANDROID_INSTALL = getAndroidInstallUrl();

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const inviteToken = url.searchParams.get('token');

    if (!inviteToken) {
      return new Response('Missing token', { status: 400, headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const admin = createClient(supabaseUrl, serviceRoleKey);

    const { data, error } = await admin.rpc('get_rally_invite_preview', {
      p_invite_token: inviteToken,
    });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const payload = (data || {}) as {
      found?: boolean;
      group_id?: string;
      invite_token?: string;
      name?: string;
      sport_type?: string;
      member_count?: number;
      location_name?: string | null;
      host_username?: string | null;
    };

    const resolvedToken = payload.invite_token || inviteToken;
    const deepLink = `${APP_SCHEME}://group-invite/${resolvedToken}`;

    const title = payload.found
      ? `${payload.sport_type || 'Rally'} on Rally`
      : 'Rally invite';
    const headline = payload.name?.trim() || 'Join our Rally';
    const hostLine = payload.host_username ? `@${payload.host_username}` : 'A host';
    const memberLine =
      typeof payload.member_count === 'number' && payload.member_count > 0
        ? `${payload.member_count} member${payload.member_count === 1 ? '' : 's'}`
        : 'Be the first to join';

    const description = payload.found
      ? `${hostLine} invited you — tap to join the Rally and see upcoming games.`
      : 'Open Rally to accept this Rally invite.';

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <style>
    body { font-family: system-ui, sans-serif; max-width: 640px; margin: 0 auto; padding: 24px; line-height: 1.5; color: #111; background: #f5f4f0; }
    .card { background: #fff; border-radius: 16px; padding: 20px; border: 1px solid #e6e4df; }
    h1 { font-size: 1.5rem; margin: 0 0 4px; }
    .sub { color: #555; margin-bottom: 1rem; }
    .meta { color: #333; margin: 0.25rem 0; }
    .actions { display: flex; flex-direction: column; gap: 10px; margin-top: 1.25rem; }
    a.btn { display: block; text-align: center; text-decoration: none; padding: 14px 18px; border-radius: 12px; font-weight: 700; }
    a.primary { background: #1a6b4a; color: #fff; }
    a.secondary { background: #fff; color: #1a6b4a; border: 1px solid #1a6b4a; }
    .hint { font-size: 0.9rem; color: #666; margin-top: 1rem; }
  </style>
</head>
<body>
  <div class="card">
    <h1>${escapeHtml(headline)}</h1>
    <p class="sub">${escapeHtml(description)}</p>
    ${payload.found ? `<p class="meta"><strong>${escapeHtml(payload.sport_type || 'Rally')}</strong> · ${escapeHtml(memberLine)}</p>` : ''}
    ${payload.found && payload.location_name ? `<p class="meta">${escapeHtml(payload.location_name)}</p>` : ''}
    <div class="actions">
      <a class="btn primary" id="open-app" href="${escapeHtml(deepLink)}">Open in Rally</a>
      <a class="btn secondary" id="get-ios" href="${escapeHtml(IOS_INSTALL)}">Get Rally on iPhone</a>
      <a class="btn secondary" id="get-android" href="${escapeHtml(ANDROID_INSTALL)}">Get Rally on Android</a>
    </div>
    <p class="hint" id="install-hint">No app yet? Install Rally, then tap <strong>Open in Rally</strong> again on this page.</p>
  </div>
  <script>
    (function () {
      var deepLink = ${JSON.stringify(deepLink)};
      var pendingKey = ${JSON.stringify(PENDING_KEY)};
      try { localStorage.setItem(pendingKey, deepLink); } catch (e) {}

      var resumed = false;
      try { resumed = localStorage.getItem(pendingKey) === deepLink; } catch (e) {}

      function tryOpenApp() {
        window.location.href = deepLink;
      }

      if (resumed) {
        var hint = document.getElementById('install-hint');
        if (hint) {
          hint.textContent = 'Welcome back — tap Open in Rally to join the Rally.';
        }
        setTimeout(tryOpenApp, 400);
      }

      document.getElementById('open-app')?.addEventListener('click', function (event) {
        event.preventDefault();
        tryOpenApp();
      });

      ['get-ios', 'get-android'].forEach(function (id) {
        document.getElementById(id)?.addEventListener('click', function () {
          try { localStorage.setItem(pendingKey, deepLink); } catch (e) {}
        });
      });
    })();
  </script>
</body>
</html>`;

    return new Response(html, {
      headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
