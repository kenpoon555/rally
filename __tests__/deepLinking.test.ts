import { parseAppDeepLink } from '../src/navigation/deepLinking';

describe('parseAppDeepLink', () => {
  it('parses host game invite scheme links', () => {
    const token = '400a8e6b-1111-2222-3333-444444444444';
    expect(parseAppDeepLink(`rallyapp://host-invite/${token}`)).toEqual({
      type: 'hostInvite',
      inviteToken: token,
    });
  });

  it('parses public game detail links', () => {
    const activityId = '500b9f7c-aaaa-bbbb-cccc-dddddddddddd';
    expect(parseAppDeepLink(`rallyapp://game/${activityId}`)).toEqual({
      type: 'game',
      activityId,
    });
  });

  it('parses HTTPS game-invite host links', () => {
    const token = '400a8e6b-1111-2222-3333-444444444444';
    expect(
      parseAppDeepLink(
        `https://example.supabase.co/functions/v1/game-invite?token=${token}&host=1`
      )
    ).toEqual({
      type: 'hostInvite',
      inviteToken: token,
    });
  });

  it('parses HTTPS game-invite public links', () => {
    const activityId = '500b9f7c-aaaa-bbbb-cccc-dddddddddddd';
    expect(
      parseAppDeepLink(
        `https://example.supabase.co/functions/v1/game-invite?activity=${activityId}`
      )
    ).toEqual({
      type: 'game',
      activityId,
    });
  });

  it('parses HTTPS rally-invite links', () => {
    const token = '600c0g8d-2222-3333-4444-555555555555';
    expect(
      parseAppDeepLink(
        `https://example.supabase.co/functions/v1/rally-invite?token=${token}`
      )
    ).toEqual({
      type: 'groupInvite',
      groupInviteToken: token,
    });
  });
});
