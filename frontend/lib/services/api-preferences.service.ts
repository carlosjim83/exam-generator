import { apiClient } from '@/features/auth/services/api.service';

export interface UserPreferences {
  language: 'en' | 'es';
  theme: 'light' | 'dark';
}

export interface UpdatePreferencesRequest {
  language?: 'en' | 'es';
  theme?: 'light' | 'dark';
}

export interface PreferencesResponse {
  language: string;
  theme: string;
}

export interface UpdatePreferencesResponse {
  language: string;
  theme: string;
  message: string;
}

class PreferencesService {
  /**
   * Get user preferences
   */
  async getPreferences(): Promise<UserPreferences> {
    const response = await apiClient.get<PreferencesResponse>('/preferences');
    return {
      language: response.language as 'en' | 'es',
      theme: response.theme as 'light' | 'dark',
    };
  }

  /**
   * Update user preferences
   */
  async updatePreferences(data: UpdatePreferencesRequest): Promise<UserPreferences> {
    const response = await apiClient.patch<UpdatePreferencesResponse>('/preferences', data);
    return {
      language: response.language as 'en' | 'es',
      theme: response.theme as 'light' | 'dark',
    };
  }
}

export const preferencesService = new PreferencesService();
