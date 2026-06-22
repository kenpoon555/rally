export type AgeCategory = 'under_13' | 'teen_13_17' | 'adult_18_plus';

export const AGE_CATEGORIES: AgeCategory[] = ['under_13', 'teen_13_17', 'adult_18_plus'];

export const AGE_CATEGORY_LABELS: Record<AgeCategory, string> = {
  under_13: 'Under 13',
  teen_13_17: '13–17',
  adult_18_plus: '18+',
};

export function parseAgeCategory(value: unknown): AgeCategory | null {
  if (typeof value !== 'string') {
    return null;
  }
  return AGE_CATEGORIES.includes(value as AgeCategory) ? (value as AgeCategory) : null;
}

export function isAdultAgeCategory(
  category: AgeCategory | null | undefined
): category is 'adult_18_plus' {
  return category === 'adult_18_plus';
}

export function isTeenAgeCategory(
  category: AgeCategory | null | undefined
): category is 'teen_13_17' {
  return category === 'teen_13_17';
}

export function canCreateStudentProfiles(
  category: AgeCategory | null | undefined
): boolean {
  return isAdultAgeCategory(category);
}
