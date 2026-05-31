import { ProfileReviewStats } from '../types/review';
import { ProfileTrustStats } from '../types/safety';

/** One-line trust summary for roster rows and join-request previews. */
export function formatPlayerTrustPreview(
  review: ProfileReviewStats | null | undefined,
  trust: ProfileTrustStats | null | undefined
): string {
  const parts: string[] = [];
  const reviewCount = review?.review_count ?? 0;

  if (typeof review?.visible_score === 'number') {
    parts.push(`${review.visible_score.toFixed(1)}★`);
  } else if (reviewCount > 0) {
    parts.push(`${reviewCount} review${reviewCount === 1 ? '' : 's'}`);
  } else {
    parts.push('New player');
  }

  const flakes = trust?.flake_count ?? 0;
  const noShows = trust?.no_show_count ?? 0;

  if (flakes === 0 && noShows === 0) {
    if (reviewCount >= 3) {
      parts.push('Reliable');
    }
  } else if (noShows > 0) {
    parts.push(`${noShows} no-show${noShows === 1 ? '' : 's'}`);
  } else if (flakes > 0) {
    parts.push(`${flakes} late exit${flakes === 1 ? '' : 's'}`);
  }

  return parts.join(' · ');
}
