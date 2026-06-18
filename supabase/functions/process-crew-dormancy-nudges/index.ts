import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function isInQuietHours(
  quietStart: number | null | undefined,
  quietEnd: number | null | undefined
): boolean {
  if (quietStart == null || quietEnd == null) {
    return false;
  }
  const localHour = new Date().getUTCHours();
  return quietStart < quietEnd
    ? localHour >= quietStart && localHour < quietEnd
    : localHour >= quietStart || localHour < quietEnd;
}

async function sendFcmLegacy(
  serverKey: string,
  token: string,
  title: string,
  body: string,
  data: Record<string, string>
): Promise<void> {
  const res = await fetch('https://fcm.googleapis.com/fcm/send', {
    method: 'POST',
    headers: {
      Authorization: `key=${serverKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to: token,
      notification: { title, body, sound: 'default' },
      data,
      priority: 'high',
      content_available: true,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`FCM error ${res.status}: ${text}`);
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const serverKey = Deno.env.get('FIREBASE_SERVER_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const authHeader = req.headers.get('Authorization') ?? '';
    if (authHeader !== `Bearer ${serviceRoleKey}`) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const admin = createClient(supabaseUrl, serviceRoleKey);
    const { data: rows, error } = await admin.rpc('process_crew_dormancy_nudges_batch');

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!serverKey) {
      return new Response(
        JSON.stringify({ ok: false, queued: rows?.length ?? 0, error: 'FIREBASE_SERVER_KEY missing' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let sent = 0;
    for (const row of rows || []) {
      const groupId = row.group_id as string;
      const hostId = row.host_id as string;
      const groupName = (row.group_name as string | undefined) || 'Your Rally';

      const { data: hostProfile } = await admin
        .from('profiles')
        .select('is_suspended, push_quiet_hours_start, push_quiet_hours_end')
        .eq('id', hostId)
        .maybeSingle();

      if (hostProfile?.is_suspended) {
        continue;
      }

      if (
        isInQuietHours(
          hostProfile?.push_quiet_hours_start as number | null | undefined,
          hostProfile?.push_quiet_hours_end as number | null | undefined
        )
      ) {
        continue;
      }

      const title = 'Schedule your next game';
      const body = `${groupName} has no upcoming games. Tap to open Play and schedule your next session.`;

      const { data: tokens } = await admin
        .from('user_device_tokens')
        .select('device_token')
        .eq('user_id', hostId);

      for (const tokenRow of tokens || []) {
        try {
          await sendFcmLegacy(serverKey, tokenRow.device_token, title, body, {
            type: 'crew_dormancy_nudge',
            group_id: groupId,
          });
          sent += 1;
        } catch (e) {
          console.error('FCM batch dormancy nudge failed:', e);
        }
      }

      await admin.from('product_events').insert({
        user_id: hostId,
        event_name: 'crew_dormancy_nudge_sent',
        properties: { group_id: groupId, source: 'cron' },
      });
    }

    return new Response(JSON.stringify({ ok: true, queued: rows?.length ?? 0, sent }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
