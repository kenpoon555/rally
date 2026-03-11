export interface PlayerReview {
  id: string;
  activity_id: string;
  reviewer_id: string;
  reviewed_id: string;
  friendliness_rating: number;
  physicality_rating: number;
  overall_vibe_rating: number;
  comment?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProfileReviewStats {
  user_id: string;
  review_count: number;
  avg_friendliness: number | null;
  avg_physicality: number | null;
  avg_vibe: number | null;
  raw_score: number | null;
  visible_score: number | null;
}
