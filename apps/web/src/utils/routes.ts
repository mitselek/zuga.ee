/**
 * Centralized URL translation maps for bilingual routing.
 * Maps internal category/subcategory names to language-specific URL slugs.
 */

export const CATEGORY_URLS: Record<string, Record<string, string>> = {
  etendused: { en: 'performances', et: 'etendused' },
  workshopid: { en: 'workshops', et: 'workshopid' },
  about: { en: 'about', et: 'about' },
  gallery: { en: 'gallery', et: 'gallery' },
  contact: { en: 'contact', et: 'contact' },
  news: { en: 'news', et: 'news' },
  kalender: { en: 'calendar', et: 'kalender' },
};

export const SUBCATEGORY_URLS: Record<string, Record<string, string>> = {
  'noorele-publikule': { en: 'for-young-audiences', et: 'noorele-publikule' },
  'suurtele': { en: 'for-adults', et: 'suurtele' },
};

export function getCategoryUrl(category: string, lang: string): string {
  return CATEGORY_URLS[category]?.[lang] || category;
}

export function getSubcategoryUrl(subcategory: string, lang: string): string {
  return SUBCATEGORY_URLS[subcategory]?.[lang] || subcategory;
}
