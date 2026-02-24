import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { LanguageSelector } from '../LanguageSelector';
import '@/lib/i18n/config';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('LanguageSelector', () => {
  it('should render language selector', () => {
    render(<LanguageSelector />);

    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('should show current language as selected', () => {
    render(<LanguageSelector />);

    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select.value).toBeTruthy();
  });

  it('should display English and Spanish options', () => {
    render(<LanguageSelector />);

    expect(screen.getByRole('option', { name: /english/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /español/i })).toBeInTheDocument();
  });

  it('should call localStorage.setItem when language is changed', async () => {
    render(<LanguageSelector />);

    const select = screen.getByRole('combobox') as HTMLSelectElement;

    fireEvent.change(select, { target: { value: 'es' } });

    await waitFor(() => {
      expect(localStorageMock.setItem).toHaveBeenCalledWith('i18nextLng', 'es');
    });
  });
});
