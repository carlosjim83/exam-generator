import i18n from '../config';

describe('i18n Configuration', () => {
  it('should be initialized', () => {
    expect(i18n.isInitialized).toBe(true);
  });

  it('should have English and Spanish as available languages', () => {
    // Test that resources have both languages configured
    expect(i18n.hasResourceBundle('en', 'common')).toBe(true);
    expect(i18n.hasResourceBundle('es', 'common')).toBe(true);
  });

  it('should have English as default language', () => {
    expect(i18n.options.fallbackLng).toEqual(['en']);
  });

  it('should have common and dashboard namespaces', () => {
    const namespaces = i18n.options.ns as string[];
    expect(namespaces).toContain('common');
    expect(namespaces).toContain('dashboard');
  });

  it('should use common as default namespace', () => {
    expect(i18n.options.defaultNS).toBe('common');
  });

  it('should support interpolation', () => {
    expect(i18n.options.interpolation?.escapeValue).toBe(false);
  });

  it('should detect browser language', () => {
    expect(i18n.options.detection).toBeDefined();
  });
});

describe('i18n Translations', () => {
  beforeEach(() => {
    i18n.changeLanguage('en');
  });

  describe('English translations', () => {
    it('should translate common keys', () => {
      expect(i18n.t('common:welcome')).toBe('Welcome');
      expect(i18n.t('common:logout')).toBe('Sign out');
      expect(i18n.t('common:settings')).toBe('Settings');
    });

    it('should translate dashboard keys', () => {
      expect(i18n.t('dashboard:title')).toBe('Dashboard');
      expect(i18n.t('dashboard:stats.totalDocuments')).toBe('Total Documents');
      expect(i18n.t('dashboard:stats.totalExams')).toBe('Total Exams');
    });
  });

  describe('Spanish translations', () => {
    beforeEach(() => {
      i18n.changeLanguage('es');
    });

    it('should translate common keys', () => {
      expect(i18n.t('common:welcome')).toBe('Bienvenido');
      expect(i18n.t('common:logout')).toBe('Cerrar sesión');
      expect(i18n.t('common:settings')).toBe('Configuración');
    });

    it('should translate dashboard keys', () => {
      expect(i18n.t('dashboard:title')).toBe('Panel de Control');
      expect(i18n.t('dashboard:stats.totalDocuments')).toBe('Documentos Totales');
      expect(i18n.t('dashboard:stats.totalExams')).toBe('Exámenes Totales');
    });
  });

  describe('Language switching', () => {
    it('should switch from English to Spanish', async () => {
      await i18n.changeLanguage('en');
      expect(i18n.language).toBe('en');
      expect(i18n.t('common:welcome')).toBe('Welcome');

      await i18n.changeLanguage('es');
      expect(i18n.language).toBe('es');
      expect(i18n.t('common:welcome')).toBe('Bienvenido');
    });

    it('should fallback to English for missing translations', async () => {
      await i18n.changeLanguage('es');
      // If a key doesn't exist, it should fallback to English
      expect(i18n.options.fallbackLng).toEqual(['en']);
    });
  });
});
