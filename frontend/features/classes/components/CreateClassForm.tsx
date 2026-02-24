'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { createClass, CreateClassResponse } from '../services/classes-api';

interface CreateClassFormProps {
  onSuccess?: (classData: CreateClassResponse) => void;
  onCancel?: () => void;
}

export function CreateClassForm({ onSuccess, onCancel }: CreateClassFormProps) {
  const { t } = useTranslation('classes');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const validateName = (value: string): string | null => {
    if (!value || value.trim().length === 0) {
      return t('createClassForm.nameRequired');
    }
    if (value.length < 2) {
      return t('createClassForm.nameMinLength');
    }
    if (value.length > 100) {
      return t('createClassForm.nameMaxLength');
    }
    return null;
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    const nameError = validateName(name);
    if (nameError) {
      setError(nameError);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const classData = await createClass({
        name: name.trim(),
        description: description.trim() || undefined,
      });

      onSuccess?.(classData);
    } catch (err) {
      setError(t('createClassForm.error'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">{t('createClassForm.nameLabel')} *</Label>
        <Input
          id="name"
          placeholder={t('createClassForm.namePlaceholder')}
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (error) setError(null);
          }}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">{t('createClassForm.descriptionLabel')}</Label>
        <Textarea
          id="description"
          placeholder={t('createClassForm.descriptionPlaceholder')}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
        />
      </div>

      {error && (
        <div className="text-sm text-red-500 bg-red-50 p-3 rounded-md">{error}</div>
      )}

      <div className="flex gap-2 justify-end pt-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            {t('createClassForm.cancel')}
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t('createClassForm.creating')}
            </>
          ) : (
            t('createClassForm.createButton')
          )}
        </Button>
      </div>
    </form>
  );
}