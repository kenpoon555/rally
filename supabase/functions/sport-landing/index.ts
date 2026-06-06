import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SPORT_SLUGS: Record<string, string> = {
  badminton: 'Badminton',
  pickleball: 'Pickleball',
  basketball: 'Basketball',
};

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
    const citySlug = (url.searchParams.get('city') || 'la').toLowerCase();
    const sportSlug = (url.searchParams.get('sport') || 'badminton').toLowerCase();
    const sport = SPORT_SLUGS[sportSlug];

    if (!sport || citySlug !== 'la') {
      return new Response('Not found', { status: 404, headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const admin = createClient(supabaseUrl, serviceRoleKey);

    const { data, error } = await admin.rpc('get_sport_landing_payload', {
      p_city: 'Los Angeles',
      p_sport: sport,
    });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const payload = data as {
      tagline?: string;
      open_games_count?: number;
      free_agent_count?: number;
      need_posts?: Array<{
        spot_count: number;
        starts_at: string;
        location_name?: string;
        host_username?: string;
      }>;
      captains?: Array<{ username: string; rally_name?: string }>;
    };

    const deepLink = `rallyapp://la/${sportSlug}`;
    const title = `${sport} in Los Angeles · Rally`;
    const description = payload.tagline || `Find ${sport.toLowerCase()} games in LA`;

    const needLines = (payload.need_posts || [])
      .slice(0, 3)
      .map((post) => {
        const when = new Date(post.starts_at).toLocaleString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        });
        return `<li>@${escapeHtml(post.host_username || 'host')} needs ${post.spot_count} · ${escapeHtml(when)}${post.location_name ? ` · ${escapeHtml(post.location_name)}` : ''}</li>`;
      })
      .join('');

    const captainLines = (payload.captains || [])
      .map(
        (c) =>
          `<li>@${escapeHtml(c.username)}${c.rally_name ? ` · ${escapeHtml(c.rally_name)}` : ''}</li>`
      )
      .join('');

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
    body { font-family: system-ui, sans-serif; max-width: 640px; margin: 0 auto; padding: 24px; line-height: 1.5; color: #111; }
    h1 { font-size: 1.75rem; margin-bottom: 0.25rem; }
    .sub { color: #555; margin-bottom: 1.5rem; }
    .stats { display: flex; gap: 16px; margin: 1rem 0 1.5rem; }
    .stat { background: #f4f6f8; border-radius: 12px; padding: 12px 16px; flex: 1; }
    .stat strong { display: block; font-size: 1.25rem; }
    a.cta { display: inline-block; background: #1a6b4a; color: #fff; text-decoration: none; padding: 12px 20px; border-radius: 10px; font-weight: 600; margin-top: 1rem; }
    h2 { font-size: 1.1rem; margin-top: 1.5rem; }
    ul { padding-left: 1.25rem; }
  </style>
</head>
<body>
  <h1>${escapeHtml(sport)} in LA</h1>
  <p class="sub">${escapeHtml(description)}</p>
  <div class="stats">
    <div class="stat"><strong>${payload.open_games_count ?? 0}</strong> open games</div>
    <div class="stat"><strong>${payload.free_agent_count ?? 0}</strong> free agents</div>
  </div>
  ${needLines ? `<h2>Hosts need players</h2><ul>${needLines}</ul>` : ''}
  ${captainLines ? `<h2>Sport captains</h2><ul>${captainLines}</ul>` : ''}
  <a class="cta" href="${deepLink}">Open in Rally</a>
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
