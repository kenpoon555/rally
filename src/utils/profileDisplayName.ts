import { User } from '../types/user';

/** Never surface raw email in nickname / display-name fields (demo + legacy accounts). */
export function profileDisplayName(
  user: Pick<User, 'nickname' | 'username' | 'email'> | null | undefined
): string {
  if (!user) {
    return '';
  }
  const nick = user.nickname?.trim();
  if (nick && !nick.includes('@')) {
    return nick;
  }
  return user.username?.trim() || 'player';
}
