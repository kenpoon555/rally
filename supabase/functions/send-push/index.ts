import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { sendFcmV1 } from './fcm.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type PushBody = {
  type:
    | 'join_request'
    | 'join_request_approved'
    | 'join_request_rejected'
    | 'game_finalized'
    | 'roster_nudge'
    | 'free_agent_invite'
    | 'fill_in_invite'
    | 'review_prompt'
    | 'chat_message'
    | 'crew_dormancy_nudge';
  activity_id?: string;
  group_id?: string;
  conversation_id?: string;
  message_preview?: string;
  target_user_id?: string;
  title?: string;
  body?: string;
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

async function sendPush(
  serviceAccountJson: string,
  token: string,
  title: string,
  body: string,
  data: Record<string, string>
): Promise<void> {
  await sendFcmV1(serviceAccountJson, token, title, body, data);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const serviceAccountJson = Deno.env.get('FIREBASE_SERVICE_ACCOUNT_JSON');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!serviceAccountJson) {
      return new Response(
        JSON.stringify({
          ok: false,
          error:
            'FIREBASE_SERVICE_ACCOUNT_JSON not configured. Run scripts/set-firebase-service-account-secret.sh',
        }),
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
    if (!payload?.type) {
      return new Response(JSON.stringify({ error: 'type required' }), {
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

    if (payload.type === 'chat_message') {
      if (!payload.conversation_id) {
        return new Response(JSON.stringify({ error: 'conversation_id required for chat_message' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: membership } = await admin
        .from('conversation_members')
        .select('conversation_id')
        .eq('conversation_id', payload.conversation_id)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (!membership) {
        return new Response(JSON.stringify({ error: 'Not a member of this conversation' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: convo } = await admin
        .from('conversations')
        .select('id, activity_id, title, conversation_type')
        .eq('id', payload.conversation_id)
        .maybeSingle();

      const { data: senderProfile } = await admin
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .maybeSingle();

      const { data: members } = await admin
        .from('conversation_members')
        .select('user_id')
        .eq('conversation_id', payload.conversation_id)
        .eq('is_active', true);

      const preview = (payload.message_preview || payload.body || 'New message').trim();
      const senderName = (senderProfile?.username as string | undefined) || 'Someone';
      const chatTitle =
        payload.title ||
        (convo?.conversation_type === 'crew_group'
          ? `${senderName} in Rally chat`
          : `${senderName} in game chat`);
      const chatBody =
        preview.length > 120 ? `${preview.slice(0, 117)}…` : preview;

      let sent = 0;
      for (const member of members || []) {
        const memberId = member.user_id as string;
        if (memberId === user.id) {
          continue;
        }

        const { data: memberProfile } = await admin
          .from('profiles')
          .select('is_suspended, push_quiet_hours_start, push_quiet_hours_end')
          .eq('id', memberId)
          .maybeSingle();

        if (memberProfile?.is_suspended) {
          continue;
        }

        if (
          isInQuietHours(
            memberProfile?.push_quiet_hours_start as number | null | undefined,
            memberProfile?.push_quiet_hours_end as number | null | undefined
          )
        ) {
          continue;
        }

        const { data: tokens } = await admin
          .from('user_device_tokens')
          .select('device_token')
          .eq('user_id', memberId);

        for (const tokenRow of tokens || []) {
          try {
            await sendPush(serviceAccountJson, tokenRow.device_token, chatTitle, chatBody, {
              type: payload.type,
              conversation_id: payload.conversation_id,
              activity_id: (convo?.activity_id as string | undefined) || '',
            });
            sent += 1;
          } catch (e) {
            console.error('FCM chat_message send failed for token:', e);
          }
        }
      }

      return new Response(JSON.stringify({ ok: true, sent }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (payload.type === 'crew_dormancy_nudge') {
      if (!payload.group_id) {
        return new Response(JSON.stringify({ error: 'group_id required for crew_dormancy_nudge' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: group } = await admin
        .from('regular_groups')
        .select('id, host_id, name')
        .eq('id', payload.group_id)
        .maybeSingle();

      if (!group) {
        return new Response(JSON.stringify({ error: 'Rally not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const hostId = group.host_id as string;
      if (user.id !== hostId) {
        return new Response(JSON.stringify({ error: 'Only the host can send dormancy nudges' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const claimCutoff = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      const { data: recentClaim } = await admin
        .from('crew_dormancy_nudges')
        .select('id')
        .eq('group_id', payload.group_id)
        .eq('host_id', hostId)
        .gte('sent_at', claimCutoff)
        .order('sent_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!recentClaim) {
        return new Response(JSON.stringify({ error: 'Claim dormancy nudge before sending push' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: hostProfile } = await admin
        .from('profiles')
        .select('is_suspended, push_quiet_hours_start, push_quiet_hours_end')
        .eq('id', hostId)
        .maybeSingle();

      if (hostProfile?.is_suspended) {
        return new Response(JSON.stringify({ ok: true, sent: 0, reason: 'host suspended' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (
        isInQuietHours(
          hostProfile?.push_quiet_hours_start as number | null | undefined,
          hostProfile?.push_quiet_hours_end as number | null | undefined
        )
      ) {
        return new Response(JSON.stringify({ ok: true, sent: 0, reason: 'quiet hours' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const rallyName = (group.name as string | undefined) || 'Your Rally';
      const title = payload.title || 'Schedule your next game';
      const body =
        payload.body ||
        `${rallyName} has no upcoming games. Tap to open Play and schedule your next session.`;

      const { data: tokens } = await admin
        .from('user_device_tokens')
        .select('device_token')
        .eq('user_id', hostId);

      let sent = 0;
      for (const tokenRow of tokens || []) {
        try {
          await sendPush(serviceAccountJson, tokenRow.device_token, title, body, {
            type: payload.type,
            group_id: payload.group_id,
          });
          sent += 1;
        } catch (e) {
          console.error('FCM crew_dormancy_nudge send failed for token:', e);
        }
      }

      return new Response(JSON.stringify({ ok: true, sent }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!payload.activity_id) {
      return new Response(JSON.stringify({ error: 'activity_id required' }), {
        status: 400,
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

    if (payload.type === 'join_request_rejected') {
      if (!payload.target_user_id) {
        return new Response(JSON.stringify({ error: 'target_user_id required for rejection push' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (user.id !== hostUserId) {
        return new Response(JSON.stringify({ error: 'Only the host can notify rejection' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const { data: rejectedRow } = await admin
        .from('join_requests')
        .select('id, status')
        .eq('activity_id', payload.activity_id)
        .eq('user_id', payload.target_user_id)
        .eq('status', 'rejected')
        .maybeSingle();
      if (!rejectedRow) {
        return new Response(JSON.stringify({ error: 'No rejected join request for target user' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      recipientUserId = payload.target_user_id;
    }

    if (
      payload.type === 'free_agent_invite' ||
      payload.type === 'fill_in_invite' ||
      payload.type === 'game_friend_invite'
    ) {
      if (!payload.target_user_id) {
        return new Response(JSON.stringify({ error: 'target_user_id required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (payload.type === 'game_friend_invite') {
        const { data: friendInvite } = await admin
          .from('activity_friend_invites')
          .select('id, status, invited_by')
          .eq('activity_id', payload.activity_id)
          .eq('invited_user_id', payload.target_user_id)
          .eq('status', 'pending')
          .maybeSingle();
        if (!friendInvite || friendInvite.invited_by !== user.id) {
          return new Response(JSON.stringify({ error: 'No pending game friend invite' }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      } else if (user.id !== hostUserId) {
        return new Response(JSON.stringify({ error: 'Only the host can send free agent invites' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const courtName =
        (activity.location as { name?: string } | null)?.name || 'a court';
      const title =
        payload.title ||
        (payload.type === 'fill_in_invite'
          ? 'Fill-in invite'
          : payload.type === 'game_friend_invite'
            ? 'Game invite'
            : 'Game invite');
      const body =
        payload.body ||
        (payload.type === 'fill_in_invite'
          ? `You're invited to fill a spot for ${activity.sport_type} at ${courtName}. Open Rally to respond.`
          : payload.type === 'game_friend_invite'
            ? `A friend invited you to ${activity.sport_type} at ${courtName}. Open Rally to respond.`
            : `A host invited you to ${activity.sport_type} at ${courtName}. Open Rally to respond.`);

      const { data: tokens } = await admin
        .from('user_device_tokens')
        .select('device_token')
        .eq('user_id', payload.target_user_id);

      let sent = 0;
      for (const tokenRow of tokens || []) {
        try {
          await sendPush(serviceAccountJson, tokenRow.device_token, title, body, {
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
            await sendPush(serviceAccountJson, tokenRow.device_token, title, body, {
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
            await sendPush(serviceAccountJson, tokenRow.device_token, title, body, {
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
        : payload.type === 'join_request_rejected'
          ? 'Request declined'
          : payload.type === 'join_request'
            ? 'New join request'
            : payload.type === 'game_finalized'
              ? 'Game finalized'
              : 'Rally');
    const body =
      payload.body ||
      (payload.type === 'join_request_approved'
        ? `Your request to join the ${activity.sport_type} game at ${courtName} was approved.`
        : payload.type === 'join_request_rejected'
          ? `Your request to join the ${activity.sport_type} game at ${courtName} was declined.`
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
        await sendPush(serviceAccountJson, row.device_token, title, body, dataPayload);
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
