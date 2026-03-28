/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Inventory Settings Component
 *
 * Form for configuring inventory thresholds and behavior.
 * Saves to localStorage and validates with React Hook Form + Zod.
 *
 * Requirements: 13.6, 13.9
 */

'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import type { InventorySettings as InventorySettingsType } from '@/types/entities';

export const INVENTORY_SETTINGS_KEY = 'inventory_settings';

const inventorySettingsSchema = z.object({
  lowStockThreshold: z.number().min(0, 'Threshold must be 0 or greater'),
  autoReorder: z.boolean(),
  autoReorderQuantity: z.number().min(1, 'Reorder quantity must be at least 1').optional(),
  trackInventoryMovements: z.boolean(),
  allowNegativeStock: z.boolean(),
});

type InventorySettingsFormData = z.infer<typeof inventorySettingsSchema>;

function loadSavedSettings(): Partial<InventorySettingsFormData> {
  try {
    const raw = localStorage.getItem(INVENTORY_SETTINGS_KEY);
    if (raw) return JSON.parse(raw) as Partial<InventorySettingsFormData>;
  } catch {
    // ignore parse errors
  }
  return {};
}

interface ToggleFieldProps {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function ToggleField({ id, label, description, checked, onChange }: ToggleFieldProps) {
  return (
    <div className="flex items-start justify-between">
      <div className="flex-1 pr-4">
        <label htmlFor={id} className="text-sm font-medium text-gray-900 cursor-pointer">
          {label}
        </label>
        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
      </div>
      <button
        type="button"
        id={id}
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
          checked ? 'bg-blue-600' : 'bg-gray-200'
        }`}
      >
        <span
          aria-hidden="true"
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}

export function InventorySettings() {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InventorySettingsFormData>({
    resolver: zodResolver(inventorySettingsSchema),
    defaultValues: {
      lowStockThreshold: 10,
      autoReorder: false,
      autoReorderQuantity: 50,
      trackInventoryMovements: true,
      allowNegativeStock: false,
    },
  });

  const autoReorder = watch('autoReorder');

  // Load saved values on mount
  useEffect(() => {
    const saved = loadSavedSettings();
    if (Object.keys(saved).length > 0) {
      reset(saved as InventorySettingsFormData);
    }
  }, [reset]);

  const onSubmit = async (data: InventorySettingsFormData) => {
    const settings: InventorySettingsType = {
      lowStockThreshold: data.lowStockThreshold,
      autoReorder: data.autoReorder,
      autoReorderQuantity: data.autoReorder ? (data.autoReorderQuantity ?? 50) : undefined,
      trackInventoryMovements: data.trackInventoryMovements,
      allowNegativeStock: data.allowNegativeStock,
    };
    localStorage.setItem(INVENTORY_SETTINGS_KEY, JSON.stringify(settings));
    toast.success('Inventory settings saved successfully');
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Inventory Settings</h3>
        <p className="mt-1 text-sm text-gray-500">
          Configure low stock thresholds, auto-reorder behavior, and inventory tracking.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
        {/* Low Stock Threshold */}
        <div>
          <label
            htmlFor="lowStockThreshold"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Default Low Stock Threshold{' '}
            <span className="text-red-500" aria-hidden="true">
              *
            </span>
          </label>
          <input
            id="lowStockThreshold"
            type="number"
            min={0}
            {...register('lowStockThreshold')}
            aria-required="true"
            aria-describedby={errors.lowStockThreshold ? 'lowStockThreshold-error' : undefined}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="10"
          />
          {errors.lowStockThreshold && (
            <p id="lowStockThreshold-error" role="alert" className="mt-1 text-sm text-red-600">
              {errors.lowStockThreshold.message}
            </p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Products with stock at or below this value will trigger low stock alerts.
          </p>
        </div>

        {/* Toggles */}
        <div className="space-y-4">
          <ToggleField
            id="autoReorder"
            label="Auto-Reorder"
            description="Automatically create reorder requests when stock falls below threshold"
            checked={autoReorder}
            onChange={(v) => setValue('autoReorder', v)}
          />

          {/* Auto-reorder quantity — only shown when auto-reorder is on */}
          {autoReorder && (
            <div className="ml-0 pl-4 border-l-2 border-blue-200">
              <label
                htmlFor="autoReorderQuantity"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Auto-Reorder Quantity
              </label>
              <input
                id="autoReorderQuantity"
                type="number"
                min={1}
                {...register('autoReorderQuantity')}
                aria-describedby={
                  errors.autoReorderQuantity ? 'autoReorderQuantity-error' : undefined
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="50"
              />
              {errors.autoReorderQuantity && (
                <p
                  id="autoReorderQuantity-error"
                  role="alert"
                  className="mt-1 text-sm text-red-600"
                >
                  {errors.autoReorderQuantity.message}
                </p>
              )}
            </div>
          )}

          <ToggleField
            id="trackInventoryMovements"
            label="Track Inventory Movements"
            description="Record a history of all stock changes for auditing"
            checked={watch('trackInventoryMovements')}
            onChange={(v) => setValue('trackInventoryMovements', v)}
          />

          <ToggleField
            id="allowNegativeStock"
            label="Allow Negative Stock"
            description="Allow transactions even when stock would go below zero"
            checked={watch('allowNegativeStock')}
            onChange={(v) => setValue('allowNegativeStock', v)}
          />
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
