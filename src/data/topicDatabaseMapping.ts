/**
 * Mapping between theory topic slugs and database topic UUIDs
 * 
 * These IDs match the topics table in the Supabase database
 * and enable linking theory pages to their exercises and subtopics.
 */

export const TOPIC_DATABASE_IDS: Record<string, string> = {
  // Equations cluster
  'first-degree-equations': '11111111-1111-1111-1111-111111111101',
  'quadratic-equations': '11111111-1111-1111-1111-111111111103',
  'higher-degree-equations': '11111111-1111-1111-1111-111111111104',
  
  // Arithmetic cluster
  'fractions': '11111111-1111-1111-1111-111111111102',
  'exponents': '11111111-1111-1111-1111-111111111106',
  'logarithms': '11111111-1111-1111-1111-111111111108',
  
  // Advanced equations
  'inequalities': '11111111-1111-1111-1111-111111111105',
  'exponential-equations': '11111111-1111-1111-1111-111111111107',
  'logarithmic-equations': '11111111-1111-1111-1111-111111111109',
  
  // Functions
  'linear-functions': '11111111-1111-1111-1111-111111111110',
  'quadratic-functions': '11111111-1111-1111-1111-111111111111',
  'polynomial-functions': '11111111-1111-1111-1111-111111111112',
  'rational-functions': '11111111-1111-1111-1111-111111111113',
  
  // Calculus
  'limits': '11111111-1111-1111-1111-111111111114',
  'derivatives-basics': '11111111-1111-1111-1111-111111111115',
  'derivative-applications': '11111111-1111-1111-1111-111111111116',
  'chain-rule': '11111111-1111-1111-1111-111111111117',
  
  // Trigonometry
  'trigonometry-basics': '11111111-1111-1111-1111-111111111118',
  'trigonometric-equations': '11111111-1111-1111-1111-111111111119',
  
  // Epsilon-Delta (maps to Limits in DB)
  'epsilon-delta': '11111111-1111-1111-1111-111111111114',
} as const;

/**
 * Get the database topic ID for a theory topic slug
 */
export function getDatabaseTopicId(topicSlug: string): string | undefined {
  return TOPIC_DATABASE_IDS[topicSlug];
}
