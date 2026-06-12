import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const APP_SCHEME = 'rallyapp';
const PENDING_KEY = 'rally_pending_invite_v1';

const DEFAULT_IOS_INSTALL =
  Deno.env.get('IOS_INSTALL_URL') || 'https://testflight.apple.com/join/gBcW7gA2';
const DEFAULT_ANDROID_INSTALL =
  Deno.env.get('ANDROID_INSTALL_URL') ||
  'https://play.google.com/store/apps/details?id=app.rally.sports';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatWhen(iso: string | null | undefined): string {
  if (!iso) {
    return 'Time TBD';
  }
  return new Date(iso).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const activityId = url.searchParams.get('activity');
    const inviteToken = url.searchParams.get('token');
    const isHostInvite = url.searchParams.get('host') === '1';

    if (!activityId && !inviteToken) {
      return new Response('Missing activity or token', { status: 400, headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const admin = createClient(supabaseUrl, serviceRoleKey);

    const { data, error } = await admin.rpc('get_game_invite_preview', {
      p_activity_id: activityId || null,
      p_invite_token: inviteToken || null,
    });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const payload = (data || {}) as {
      found?: boolean;
      activity_id?: string;
      invite_token?: string;
      sport_type?: string;
      start_time?: string;
      listing_title?: string | null;
      location_name?: string | null;
      host_username?: string | null;
      missing_players?: number;
    };

    const resolvedActivityId = payload.activity_id || activityId || '';
    const resolvedToken = payload.invite_token || inviteToken || '';
    const deepLink = isHostInvite && resolvedToken
      ? `${APP_SCHEME}://host-invite/${resolvedToken}`
      : resolvedActivityId
        ? `${APP_SCHEME}://game/${resolvedActivityId}`
        : `${APP_SCHEME}://home`;

    const title = payload.found
      ? `${payload.sport_type || 'Game'} on Rally`
      : 'Rally game invite';
    const headline = payload.listing_title?.trim() || payload.location_name || 'Pickup game';
    const when = formatWhen(payload.start_time);
    const hostLine = payload.host_username ? `@${payload.host_username}` : 'A host';
    const spots =
      typeof payload.missing_players === 'number' && payload.missing_players > 0
        ? `${payload.missing_players} spot${payload.missing_players === 1 ? '' : 's'} open`
        : 'Request to join';

    const description = payload.found
      ? isHostInvite
        ? `${hostLine} invited you — tap to join this game.`
        : `${hostLine} is hosting — open Rally to request a spot.`
      : 'Open Rally to view this game invite.';

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
    ${payload.found ? `<p class="meta"><strong>${escapeHtml(payload.sport_type || 'Game')}</strong> · ${escapeHtml(when)}</p>` : ''}
    ${payload.found && payload.location_name ? `<p class="meta">${escapeHtml(payload.location_name)}</p>` : ''}
    ${payload.found ? `<p class="meta">${escapeHtml(spots)}</p>` : ''}
    <div class="actions">
      <a class="btn primary" id="open-app" href="${escapeHtml(deepLink)}">Open in Rally</a>
      <a class="btn secondary" id="get-ios" href="${escapeHtml(DEFAULT_IOS_INSTALL)}">Get Rally on iPhone</a>
      <a class="btn secondary" id="get-android" href="${escapeHtml(DEFAULT_ANDROID_INSTALL)}">Get Rally on Android</a>
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
          hint.textContent = 'Welcome back — tap Open in Rally to continue to the game card.';
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
