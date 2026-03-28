/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Branding Settings Component
 *
 * Form for configuring logo and color scheme.
 * Saves to localStorage and applies CSS custom properties immediately.
 *
 * Requirements: 13.7, 13.9, 13.10, 4.3
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import type { BrandingSettings as BrandingSettingsType } from '@/types/entities';

export const BRANDING_SETTINGS_KEY = 'branding_settings';

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];

const hexColorRegex = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;

const brandingSettingsSchema = z.object({
  primaryColor: z
    .string()
    .regex(hexColorRegex, 'Must be a valid hex color (e.g. #3B82F6)'),
  secondaryColor: z
    .string()
    .regex(hexColorRegex, 'Must be a valid hex color (e.g. #6B7280)'),
});

type BrandingSettingsFormData = z.infer<typeof brandingSettingsSchema>;

function loadSavedSettings(): BrandingSettingsType | null {
  try {
    const raw = localStorage.getItem(BRANDING_SETTINGS_KEY);
    if (raw) return JSON.parse(raw) as BrandingSettingsType;
  } catch {
    // ignore parse errors
  }
  return null;
}

function applyBrandingToCss(primaryColor: string, secondaryColor: string) {
  if (typeof document !== 'undefined') {
    document.documentElement.style.setProperty('--color-primary', primaryColor);
    document.documentElement.style.setProperty('--color-secondary', secondaryColor);
  }
}

export function BrandingSettings() {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BrandingSettingsFormData>({
    resolver: zodResolver(brandingSettingsSchema),
    defaultValues: {
      primaryColor: '#3B82F6',
      secondaryColor: '#6B7280',
    },
  });

  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const logoDataRef = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const primaryColor = watch('primaryColor');
  const secondaryColor = watch('secondaryColor');

  // Load saved values on mount
  useEffect(() => {
    const saved = loadSavedSettings();
    if (saved) {
      reset({
        primaryColor: saved.primaryColor ?? '#3B82F6',
        secondaryColor: saved.secondaryColor ?? '#6B7280',
      });
      if (saved.logo) {
        setLogoPreview(saved.logo);
        logoDataRef.current = saved.logo;
      }
      applyBrandingToCss(saved.primaryColor ?? '#3B82F6', saved.secondaryColor ?? '#6B7280');
    }
  }, [reset]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setLogoError(null);

    if (!file) return;

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setLogoError('Only image files are allowed (JPEG, PNG, GIF, WebP, SVG)');
      e.target.value = '';
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setLogoError('File size must be 2MB or less');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setLogoPreview(dataUrl);
      logoDataRef.current = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const onSubmit = async (data: BrandingSettingsFormData) => {
    const settings: BrandingSettingsType = {
      primaryColor: data.primaryColor,
      secondaryColor: data.secondaryColor,
      logo: logoDataRef.current ?? undefined,
    };
    localStorage.setItem(BRANDING_SETTINGS_KEY, JSON.stringify(settings));
    applyBrandingToCss(data.primaryColor, data.secondaryColor);
    toast.success('Branding settings saved successfully');
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Branding Configuration</h3>
        <p className="mt-1 text-sm text-gray-500">
          Upload your logo and configure the color scheme. Changes are applied immediately on save.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
        {/* Logo Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Business Logo</label>
          <div className="flex items-start gap-4">
            {/* Preview */}
            <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 overflow-hidden flex-shrink-0">
              {logoPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoPreview}
                  alt="Logo preview"
                  className="w-full h-full object-contain"
                />
              ) : (
                <span className="text-xs text-gray-400 text-center px-2">No logo</span>
              )}
            </div>
            <div className="flex-1">
              <input
                ref={fileInputRef}
                id="logoUpload"
                type="file"
                accept={ALLOWED_IMAGE_TYPES.join(',')}
                onChange={handleFileChange}
                aria-label="Upload logo"
                aria-describedby={logoError ? 'logo-error' : 'logo-hint'}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 focus:outline-none"
              />
              <p id="logo-hint" className="mt-1 text-xs text-gray-500">
                Accepted formats: JPEG, PNG, GIF, WebP, SVG. Max size: 2MB.
              </p>
              {logoError && (
                <p id="logo-error" role="alert" className="mt-1 text-sm text-red-600">
                  {logoError}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Primary Color */}
        <div>
          <label htmlFor="primaryColorText" className="block text-sm font-medium text-gray-700 mb-1">
            Primary Color
          </label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              aria-label="Primary color picker"
              value={primaryColor}
              onChange={(e) => setValue('primaryColor', e.target.value, { shouldValidate: true })}
              className="h-10 w-14 cursor-pointer rounded border border-gray-300 p-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              id="primaryColorText"
              type="text"
              {...register('primaryColor')}
              aria-describedby={errors.primaryColor ? 'primaryColor-error' : undefined}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              placeholder="#3B82F6"
            />
          </div>
          {errors.primaryColor && (
            <p id="primaryColor-error" role="alert" className="mt-1 text-sm text-red-600">
              {errors.primaryColor.message}
            </p>
          )}
        </div>

        {/* Secondary Color */}
        <div>
          <label htmlFor="secondaryColorText" className="block text-sm font-medium text-gray-700 mb-1">
            Secondary Color
          </label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              aria-label="Secondary color picker"
              value={secondaryColor}
              onChange={(e) => setValue('secondaryColor', e.target.value, { shouldValidate: true })}
              className="h-10 w-14 cursor-pointer rounded border border-gray-300 p-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              id="secondaryColorText"
              type="text"
              {...register('secondaryColor')}
              aria-describedby={errors.secondaryColor ? 'secondaryColor-error' : undefined}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              placeholder="#6B7280"
            />
          </div>
          {errors.secondaryColor && (
            <p id="secondaryColor-error" role="alert" className="mt-1 text-sm text-red-600">
              {errors.secondaryColor.message}
            </p>
          )}
        </div>

        {/* Submit */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
