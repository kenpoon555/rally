export type AgeCategory = 'under_13' | 'teen_13_17' | 'adult_18_plus';

export const AGE_CATEGORY_LABELS: Record<AgeCategory, string> = {
  under_13: 'Under 13',
  teen_13_17: '13–17',
  adult_18_plus: '18+',
};

export function isAdultAgeCategory(
  category: AgeCategory | null | undefined
): category is 'adult_18_plus' {
  return category === 'adult_18_plus';
}

export function canCreateStudentProfiles(
  category: AgeCategory | null | undefined
): boolean {
  return isAdultAgeCategory(category);
}
