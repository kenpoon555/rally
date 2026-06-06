import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type PushBody = {
  type:
    | 'join_request'
    | 'join_request_approved'
    | 'game_finalized'
    | 'roster_nudge'
    | 'free_agent_invite'
    | 'review_prompt';
  activity_id: string;
  target_user_id?: string;
  title?: string;
  body?: string;
};

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
      notification: { title, body },
      data,
      priority: 'high',
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

    if (!serverKey) {
      return new Response(
        JSON.stringify({ ok: false, error: 'FIREBASE_SERVER_KEY not configured on project' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });
    const admin = createClient(supabaseUrl, serviceRoleKey);

    const {
      data: { user },
    } = await userClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const payload = (await req.json()) as PushBody;
    if (!payload?.activity_id || !payload?.type) {
      return new Response(JSON.stringify({ error: 'activity_id and type required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: pushLimit, error: limitErr } = await admin.rpc('consume_rate_limit', {
      p_metric: 'push_send',
      p_user_id: user.id,
    });

    if (limitErr) {
      console.error('push rate limit check failed:', limitErr);
    } else if (pushLimit && pushLimit.allowed === false) {
      return new Response(JSON.stringify({ ok: false, error: 'push rate limit exceeded' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: activity, error: actErr } = await admin
      .from('activities')
      .select(
        'id, user_id, sport_type, match_status, location:activity_locations!activities_location_id_fkey(name)'
      )
      .eq('id', payload.activity_id)
      .single();

    if (actErr || !activity) {
      return new Response(JSON.stringify({ error: 'Activity not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const hostUserId = activity.user_id as string;

    let recipientUserId = hostUserId;
    if (payload.type === 'join_request_approved') {
      if (!payload.target_user_id) {
        return new Response(JSON.stringify({ error: 'target_user_id required for approval push' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (user.id !== hostUserId) {
        return new Response(JSON.stringify({ error: 'Only the host can notify approval' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const { data: approvedRow } = await admin
        .from('join_requests')
        .select('id, status')
        .eq('activity_id', payload.activity_id)
        .eq('user_id', payload.target_user_id)
        .eq('status', 'approved')
        .maybeSingle();
      if (!approvedRow) {
        return new Response(JSON.stringify({ error: 'No approved join request for target user' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      recipientUserId = payload.target_user_id;
    }

    if (payload.type === 'free_agent_invite') {
      if (user.id !== hostUserId) {
        return new Response(JSON.stringify({ error: 'Only the host can send free agent invites' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (!payload.target_user_id) {
        return new Response(JSON.stringify({ error: 'target_user_id required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const courtName =
        (activity.location as { name?: string } | null)?.name || 'a court';
      const title = payload.title || 'Game invite';
      const body =
        payload.body ||
        `A host invited you to ${activity.sport_type} at ${courtName}. Open Rally to respond.`;

      const { data: tokens } = await admin
        .from('user_device_tokens')
        .select('device_token')
        .eq('user_id', payload.target_user_id);

      let sent = 0;
      for (const tokenRow of tokens || []) {
        try {
          await sendFcmLegacy(serverKey, tokenRow.device_token, title, body, {
            type: payload.type,
            activity_id: payload.activity_id,
          });
          sent += 1;
        } catch (e) {
          console.error('FCM send failed for token:', e);
        }
      }

      return new Response(JSON.stringify({ ok: true, sent }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (payload.type === 'roster_nudge') {
      if (user.id !== hostUserId) {
        return new Response(JSON.stringify({ error: 'Only the host can send roster nudges' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (activity.match_status === 'finalized') {
        return new Response(JSON.stringify({ error: 'Roster is already locked' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: needsNudge } = await admin
        .from('join_requests')
        .select('user_id')
        .eq('activity_id', payload.activity_id)
        .eq('status', 'approved')
        .is('ready_at', null);

      const courtName =
        (activity.location as { name?: string } | null)?.name || 'your game';
      const title = payload.title || 'Tap I\'m in';
      const body =
        payload.body ||
        `Host is locking roster for ${activity.sport_type} at ${courtName}. Open Rally to confirm.`;

      let sent = 0;
      for (const row of needsNudge || []) {
        const joinerId = row.user_id as string;
        if (joinerId === hostUserId) {
          continue;
        }

        const { data: joinerProfile } = await admin
          .from('profiles')
          .select('is_suspended, push_quiet_hours_start, push_quiet_hours_end')
          .eq('id', joinerId)
          .maybeSingle();

        if (joinerProfile?.is_suspended) {
          continue;
        }

        const quietStart = joinerProfile?.push_quiet_hours_start as number | null | undefined;
        const quietEnd = joinerProfile?.push_quiet_hours_end as number | null | undefined;
        if (quietStart != null && quietEnd != null) {
          const localHour = new Date().getUTCHours();
          const inQuiet =
            quietStart < quietEnd
              ? localHour >= quietStart && localHour < quietEnd
              : localHour >= quietStart || localHour < quietEnd;
          if (inQuiet) {
            continue;
          }
        }

        const { data: tokens } = await admin
          .from('user_device_tokens')
          .select('device_token')
          .eq('user_id', joinerId);

        for (const tokenRow of tokens || []) {
          try {
            await sendFcmLegacy(serverKey, tokenRow.device_token, title, body, {
              type: payload.type,
              activity_id: payload.activity_id,
            });
            sent += 1;
          } catch (e) {
            console.error('FCM send failed for token:', e);
          }
        }
      }

      return new Response(JSON.stringify({ ok: true, sent }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (payload.type === 'game_finalized') {
      if (user.id !== hostUserId) {
        return new Response(JSON.stringify({ error: 'Only the host can notify finalize' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (activity.match_status !== 'finalized') {
        return new Response(JSON.stringify({ error: 'Activity is not finalized' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: approvedJoiners } = await admin
        .from('join_requests')
        .select('user_id')
        .eq('activity_id', payload.activity_id)
        .eq('status', 'approved');

      const courtName =
        (activity.location as { name?: string } | null)?.name || 'your game';
      const title = payload.title || 'Game finalized';
      const body =
        payload.body ||
        `Roster locked for ${activity.sport_type} at ${courtName}. See you on court!`;

      let sent = 0;
      for (const row of approvedJoiners || []) {
        const joinerId = row.user_id as string;
        if (joinerId === hostUserId) {
          continue;
        }

        const { data: joinerProfile } = await admin
          .from('profiles')
          .select('is_suspended, push_quiet_hours_start, push_quiet_hours_end')
          .eq('id', joinerId)
          .maybeSingle();

        if (joinerProfile?.is_suspended) {
          continue;
        }

        const quietStart = joinerProfile?.push_quiet_hours_start as number | null | undefined;
        const quietEnd = joinerProfile?.push_quiet_hours_end as number | null | undefined;
        if (quietStart != null && quietEnd != null) {
          const localHour = new Date().getUTCHours();
          const inQuiet =
            quietStart < quietEnd
              ? localHour >= quietStart && localHour < quietEnd
              : localHour >= quietStart || localHour < quietEnd;
          if (inQuiet) {
            continue;
          }
        }

        const { data: tokens } = await admin
          .from('user_device_tokens')
          .select('device_token')
          .eq('user_id', joinerId);

        for (const tokenRow of tokens || []) {
          try {
            await sendFcmLegacy(serverKey, tokenRow.device_token, title, body, {
              type: payload.type,
              activity_id: payload.activity_id,
            });
            sent += 1;
          } catch (e) {
            console.error('FCM send failed for token:', e);
          }
        }
      }

      return new Response(JSON.stringify({ ok: true, sent }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: recipientProfile } = await admin
      .from('profiles')
      .select('is_suspended, push_quiet_hours_start, push_quiet_hours_end')
      .eq('id', recipientUserId)
      .maybeSingle();

    if (recipientProfile?.is_suspended) {
      return new Response(JSON.stringify({ ok: true, skipped: 'recipient suspended' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const quietStart = recipientProfile?.push_quiet_hours_start as number | null | undefined;
    const quietEnd = recipientProfile?.push_quiet_hours_end as number | null | undefined;
    if (quietStart != null && quietEnd != null) {
      const localHour = new Date().getUTCHours();
      const inQuiet =
        quietStart < quietEnd
          ? localHour >= quietStart && localHour < quietEnd
          : localHour >= quietStart || localHour < quietEnd;
      if (inQuiet) {
        return new Response(JSON.stringify({ ok: true, skipped: 'quiet hours' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    if (payload.type === 'join_request') {
      const { data: joinRow } = await admin
        .from('join_requests')
        .select('id, user_id, status')
        .eq('activity_id', payload.activity_id)
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .maybeSingle();

      if (!joinRow) {
        return new Response(JSON.stringify({ error: 'No pending join request from caller' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (user.id === hostUserId) {
        return new Response(JSON.stringify({ ok: true, skipped: 'host is requester' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const { data: tokens } = await admin
      .from('user_device_tokens')
      .select('device_token')
      .eq('user_id', recipientUserId);

    if (!tokens?.length) {
      return new Response(JSON.stringify({ ok: true, sent: 0, reason: 'no device tokens' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const courtName =
      (activity.location as { name?: string } | null)?.name || 'your game';
    const title =
      payload.title ||
      (payload.type === 'join_request_approved'
        ? "You're in!"
        : payload.type === 'join_request'
          ? 'New join request'
          : payload.type === 'game_finalized'
            ? 'Game finalized'
            : 'Rally');
    const body =
      payload.body ||
      (payload.type === 'join_request_approved'
        ? `Your request to join the ${activity.sport_type} game at ${courtName} was approved.`
        : payload.type === 'join_request'
          ? `Someone wants to join your ${activity.sport_type} game at ${courtName}.`
          : payload.type === 'game_finalized'
            ? `Roster locked for ${activity.sport_type} at ${courtName}. See you on court!`
            : 'Rate your recent game on Rally.');

    const dataPayload: Record<string, string> = {
      type: payload.type,
      activity_id: payload.activity_id,
    };

    let sent = 0;
    for (const row of tokens) {
      try {
        await sendFcmLegacy(serverKey, row.device_token, title, body, dataPayload);
        sent += 1;
      } catch (e) {
        console.error('FCM send failed for token:', e);
      }
    }

    return new Response(JSON.stringify({ ok: true, sent }), {
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
