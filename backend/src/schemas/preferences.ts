import { Type } from '@sinclair/typebox';

// --- Preferences schemas ---

export const PreferencesResponseSchema = Type.Object(
  {
    language: Type.String(),
    theme: Type.String(),
  },
  { description: 'User preferences' }
);

export const PreferencesUpdateResponseSchema = Type.Object(
  {
    language: Type.String(),
    theme: Type.String(),
    message: Type.String(),
  },
  { description: 'Preferences updated' }
);
