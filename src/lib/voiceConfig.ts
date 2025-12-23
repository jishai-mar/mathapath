// Voice configuration for tutor personalities
// ElevenLabs voice IDs mapped to tutor personalities

export const tutorVoices = {
  patient: 'EXAVITQu4vr4xnSDxMaL',      // Sarah - warm, patient
  encouraging: 'pFZP5JQG7iQjIQuC4Bku',  // Lily - enthusiastic
  strict: 'JBFqnCBsd6RMkjVDRZzb',       // George - authoritative
  friendly: 'N2lVS1w4EtoT3dr4eOWO',     // Callum - soothing, friendly
} as const;

export type TutorPersonality = keyof typeof tutorVoices;

// Voice settings based on speaking context
export const contextVoiceSettings = {
  explaining: {
    stability: 0.7,
    similarity_boost: 0.75,
    style: 0.2,
    speed: 0.9,  // Slower for clarity
  },
  encouraging: {
    stability: 0.5,
    similarity_boost: 0.75,
    style: 0.5,
    speed: 1.0,  // Normal, energetic
  },
  correcting: {
    stability: 0.8,
    similarity_boost: 0.8,
    style: 0.15,
    speed: 0.85, // Patient, slower
  },
  celebrating: {
    stability: 0.4,
    similarity_boost: 0.7,
    style: 0.6,
    speed: 1.1,  // Excited, faster
  },
  thinking: {
    stability: 0.6,
    similarity_boost: 0.75,
    style: 0.3,
    speed: 0.95,
  },
  default: {
    stability: 0.5,
    similarity_boost: 0.75,
    style: 0.3,
    speed: 1.0,
  },
} as const;

export type VoiceContext = keyof typeof contextVoiceSettings;

// Sound effect prompts for generation
export const soundEffectPrompts = {
  correct: 'gentle chime success notification sound, positive, bright, short',
  incorrect: 'soft error notification, gentle, not harsh, brief',
  achievement: 'celebration sparkle sound effect, magical, triumphant',
  levelUp: 'level up video game sound, ascending notes, exciting',
  hint: 'magical discovery sound, soft whoosh, mystical',
  newExercise: 'page turn paper sound, soft, subtle',
  xpGain: 'coin collect sound, soft ding, rewarding',
  streak: 'fire whoosh sound, energetic, powerful',
} as const;

export type SoundEffectType = keyof typeof soundEffectPrompts;

// Focus music prompts
export const focusMusicPrompts = {
  calm: 'calm ambient study music, soft piano, minimal, 60 bpm, relaxing',
  lofi: 'lofi hip hop study beats, chill, mellow, 85 bpm',
  classical: 'gentle classical piano, Mozart style, peaceful studying',
  nature: 'ambient nature sounds with soft music, rain, forest, peaceful',
} as const;

export type FocusMusicType = keyof typeof focusMusicPrompts;

// Get voice ID for personality
export function getVoiceForPersonality(personality: string): string {
  return tutorVoices[personality as TutorPersonality] || tutorVoices.patient;
}

// Get voice settings for context
export function getVoiceSettingsForContext(context?: string) {
  return contextVoiceSettings[context as VoiceContext] || contextVoiceSettings.default;
}
