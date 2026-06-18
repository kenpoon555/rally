import { Alert } from 'react-native';
import { supabase } from './api/supabase';
import { trackProductEvent } from './analyticsService';
import { navigateFromNotificationData } from '../navigation/navigationRef';

type ClaimResult = {
  ok: boolean;
  group_id: string;
  group_name: string;
  host_id: string;
};

const NUDGE_TITLE = 'Schedule your next game';
const NUDGE_BODY = 'Your Rally has no upcoming games. Open Play to schedule the next session.';

export function crewDormancyNudgeCopy(groupName?: string): { title: string; body: string } {
  if (!groupName?.trim()) {
    return { title: NUDGE_TITLE, body: NUDGE_BODY };
  }
  const rallyLabel = groupName.trim();
  return {
    title: NUDGE_TITLE,
    body: `${rallyLabel} has no upcoming games. Tap to open Play and schedule your next session.`,
  };
}

async function claimCrewDormancyNudge(
  groupId: string,
  skipEligibility: boolean
): Promise<ClaimResult> {
  const { data, error } = await supabase.rpc('claim_crew_dormancy_nudge', {
    p_group_id: groupId,
    p_skip_eligibility: skipEligibility,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data as ClaimResult;
}

async function dispatchCrewDormancyPush(groupId: string, title: string, body: string): Promise<void> {
  const { error } = await supabase.functions.invoke('send-push', {
    body: {
      type: 'crew_dormancy_nudge',
      group_id: groupId,
      title,
      body,
    },
  });

  if (error) {
    throw new Error(error.message);
  }
}

function simulateDormancyNudgeAlert(groupId: string, title: string, body: string): void {
  Alert.alert(title, body, [
    { text: 'Dismiss', style: 'cancel' },
    {
      text: 'Open',
      onPress: () => {
        navigateFromNotificationData({
          type: 'crew_dormancy_nudge',
          group_id: groupId,
        });
      },
    },
  ]);
}

/** Host-only: claim cooldown slot and send dormancy push to self. */
export async function sendCrewDormancyNudge(
  groupId: string,
  options: { skipEligibility?: boolean; simulateOnSim?: boolean } = {}
): Promise<void> {
  const claim = await claimCrewDormancyNudge(groupId, Boolean(options.skipEligibility));
  const copy = crewDormancyNudgeCopy(claim.group_name);

  try {
    await dispatchCrewDormancyPush(groupId, copy.title, copy.body);
  } catch (pushError) {
    if (!options.simulateOnSim) {
      throw pushError;
    }
    if (__DEV__) {
      console.warn('Push dispatch skipped — simulating alert:', pushError);
    }
  }

  await trackProductEvent('crew_dormancy_nudge_sent', {
    group_id: groupId,
    dev_skip: Boolean(options.skipEligibility),
  });

  if (options.simulateOnSim) {
    simulateDormancyNudgeAlert(groupId, copy.title, copy.body);
  }
}

/** Dev / Validator hook: bypass dormancy checks and show sim-friendly alert. */
export async function devTestCrewDormancyNudge(groupId: string): Promise<void> {
  await sendCrewDormancyNudge(groupId, { skipEligibility: true, simulateOnSim: true });
}
