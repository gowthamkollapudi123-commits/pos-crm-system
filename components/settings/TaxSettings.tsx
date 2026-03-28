/**
 * Tax Settings Component
 *
 * Form for configuring tax rates and calculation rules.
 * Saves to localStorage and validates with React Hook Form + Zod.
 *
 * Requirements: 13.2, 13.9
 */

'use client';

import { useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { PlusIcon, TrashIcon } from 'lucide-react';
import type { TaxSettings as TaxSettingsType } from '@/types/entities';

export const TAX_SETTINGS_KEY = 'tax_settings';

const additionalRateSchema = z.object({
  name: z.string().min(1, 'Tax name is required'),
  rate: z
    .number()
    .min(0, 'Rate must be at least 0')
    .max(100, 'Rate must be at most 100'),
});

const taxSettingsSchema = z.object({
  defaultTaxRate: z
    .number()
    .min(0, 'Rate must be at least 0')
    .max(100, 'Rate must be at most 100'),
  taxName: z.string().min(1, 'Tax name is required'),
  taxCalculationMethod: z.enum(['inclusive', 'exclusive']),
  enableTax: z.boolean(),
  additionalRates: z.array(additionalRateSchema),
});

type TaxSettingsFormData = z.infer<typeof taxSettingsSchema>;

function loadSavedSettings(): Partial<TaxSettingsFormData> {
  try {
    const raw = localStorage.getItem(TAX_SETTINGS_KEY);
    if (raw) return JSON.parse(raw) as Partial<TaxSettingsFormData>;
  } catch {
    // ignore parse errors
  }
  return {};
}

const DEFAULT_VALUES: TaxSettingsFormData = {
  defaultTaxRate: 0,
  taxName: '',
  taxCalculationMethod: 'exclusive',
  enableTax: true,
  additionalRates: [],
};

export function TaxSettings() {
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<TaxSettingsFormData>({
    resolver: zodResolver(taxSettingsSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'additionalRates',
  });

  // Load saved values on mount
  useEffect(() => {
    const saved = loadSavedSettings();
    if (Object.keys(saved).length > 0) {
      reset({ ...DEFAULT_VALUES, ...saved } as TaxSettingsFormData);
    }
  }, [reset]);

  const onSubmit = async (data: TaxSettingsFormData) => {
    const settings: TaxSettingsType = {
      defaultTaxRate: data.defaultTaxRate,
      taxName: data.taxName,
      taxCalculationMethod: data.taxCalculationMethod,
      enableTax: data.enableTax,
      additionalRates: data.additionalRates,
    };
    localStorage.setItem(TAX_SETTINGS_KEY, JSON.stringify(settings));
    toast.success('Tax settings saved successfully');
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Tax Settings</h3>
        <p className="mt-1 text-sm text-gray-500">
          Configure tax rates and calculation rules for your business.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
        {/* Enable Tax Toggle */}
        <div className="flex items-center gap-3">
          <input
            id="enableTax"
            type="checkbox"
            {...register('enableTax')}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="enableTax" className="text-sm font-medium text-gray-700">
            Enable Tax
          </label>
        </div>

        {/* Tax Name */}
        <div>
          <label htmlFor="taxName" className="block text-sm font-medium text-gray-700 mb-1">
            Tax Name <span className="text-red-500" aria-hidden="true">*</span>
          </label>
          <input
            id="taxName"
            type="text"
            {...register('taxName')}
            aria-required="true"
            aria-describedby={errors.taxName ? 'taxName-error' : undefined}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., GST, VAT"
          />
          {errors.taxName && (
            <p id="taxName-error" role="alert" className="mt-1 text-sm text-red-600">
              {errors.taxName.message}
            </p>
          )}
        </div>

        {/* Default Tax Rate */}
        <div>
          <label htmlFor="defaultTaxRate" className="block text-sm font-medium text-gray-700 mb-1">
            Default Tax Rate (%) <span className="text-red-500" aria-hidden="true">*</span>
          </label>
          <input
            id="defaultTaxRate"
            type="number"
            step="0.01"
            min="0"
            max="100"
            {...register('defaultTaxRate', { valueAsNumber: true })}
            aria-required="true"
            aria-describedby={errors.defaultTaxRate ? 'defaultTaxRate-error' : undefined}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., 18"
          />
          {errors.defaultTaxRate && (
            <p id="defaultTaxRate-error" role="alert" className="mt-1 text-sm text-red-600">
              {errors.defaultTaxRate.message}
            </p>
          )}
        </div>

        {/* Tax Calculation Method */}
        <div>
          <label
            htmlFor="taxCalculationMethod"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Tax Calculation Method
          </label>
          <select
            id="taxCalculationMethod"
            {...register('taxCalculationMethod')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            <option value="exclusive">Exclusive (tax added on top of price)</option>
            <option value="inclusive">Inclusive (tax included in price)</option>
          </select>
        </div>

        {/* Additional Tax Rates */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Additional Tax Rates
            </label>
            <button
              type="button"
              onClick={() => append({ name: '', rate: 0 })}
              className="flex items-center gap-1 px-3 py-1 text-sm text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <PlusIcon className="h-3 w-3" aria-hidden="true" />
              Add Rate
            </button>
          </div>

          {fields.length === 0 && (
            <p className="text-sm text-gray-400 italic">
              No additional tax rates configured.
            </p>
          )}

          <div className="space-y-3">
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-start gap-3 p-3 border border-gray-200 rounded-md">
                <div className="flex-1">
                  <label
                    htmlFor={`additionalRates.${index}.name`}
                    className="block text-xs font-medium text-gray-600 mb-1"
                  >
                    Name
                  </label>
                  <input
                    id={`additionalRates.${index}.name`}
                    type="text"
                    {...register(`additionalRates.${index}.name`)}
                    aria-describedby={
                      errors.additionalRates?.[index]?.name
                        ? `additionalRates-${index}-name-error`
                        : undefined
                    }
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., CGST"
                  />
                  {errors.additionalRates?.[index]?.name && (
                    <p
                      id={`additionalRates-${index}-name-error`}
                      role="alert"
                      className="mt-1 text-xs text-red-600"
                    >
                      {errors.additionalRates[index]?.name?.message}
                    </p>
                  )}
                </div>
                <div className="w-28">
                  <label
                    htmlFor={`additionalRates.${index}.rate`}
                    className="block text-xs font-medium text-gray-600 mb-1"
                  >
                    Rate (%)
                  </label>
                  <input
                    id={`additionalRates.${index}.rate`}
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    {...register(`additionalRates.${index}.rate`, { valueAsNumber: true })}
                    aria-describedby={
                      errors.additionalRates?.[index]?.rate
                        ? `additionalRates-${index}-rate-error`
                        : undefined
                    }
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 9"
                  />
                  {errors.additionalRates?.[index]?.rate && (
                    <p
                      id={`additionalRates-${index}-rate-error`}
                      role="alert"
                      className="mt-1 text-xs text-red-600"
                    >
                      {errors.additionalRates[index]?.rate?.message}
                    </p>
                  )}
                </div>
                <div className="pt-5">
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    aria-label={`Remove tax rate ${index + 1}`}
                    className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <TrashIcon className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            ))}
          </div>
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
