'use client';

import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

const languages = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
];

export function LanguageSelector() {
  const { i18n } = useTranslation();

  const handleLanguageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newLanguage = event.target.value;
    i18n.changeLanguage(newLanguage);
  };

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center justify-center rounded-lg bg-blue-100 p-2">
        <Globe className="h-5 w-5 text-blue-600" />
      </div>
      <div className="flex-1">
        <label htmlFor="language-select" className="mb-1 block text-sm font-medium text-gray-700">
          Language
        </label>
        <select
          id="language-select"
          value={i18n.language}
          onChange={handleLanguageChange}
          className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          {languages.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
