/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Receipt Template Settings Component
 *
 * Form for configuring receipt layout and content with a live preview panel.
 * Saves to localStorage and validates with React Hook Form + Zod.
 *
 * Requirements: 13.3, 13.9
 */

'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import type { ReceiptTemplateSettings as ReceiptTemplateSettingsType } from '@/types/entities';

export const RECEIPT_TEMPLATE_SETTINGS_KEY = 'receipt_template_settings';

const receiptTemplateSchema = z.object({
  headerText: z.string().max(500, 'Header text must be at most 500 characters'),
  footerText: z.string().max(500, 'Footer text must be at most 500 characters'),
  showLogo: z.boolean(),
  showBusinessAddress: z.boolean(),
  showTaxBreakdown: z.boolean(),
  showOrderNumber: z.boolean(),
  receiptTitle: z.string().min(1, 'Receipt title is required'),
  paperSize: z.enum(['58mm', '80mm', 'A4']),
});

type ReceiptTemplateFormData = z.infer<typeof receiptTemplateSchema>;

const DEFAULT_VALUES: ReceiptTemplateFormData = {
  headerText: '',
  footerText: 'Thank you for your purchase!',
  showLogo: true,
  showBusinessAddress: true,
  showTaxBreakdown: true,
  showOrderNumber: true,
  receiptTitle: 'RECEIPT',
  paperSize: '80mm',
};

function loadSavedSettings(): Partial<ReceiptTemplateFormData> {
  try {
    const raw = localStorage.getItem(RECEIPT_TEMPLATE_SETTINGS_KEY);
    if (raw) return JSON.parse(raw) as Partial<ReceiptTemplateFormData>;
  } catch {
    // ignore parse errors
  }
  return {};
}

// ─── Live Preview ────────────────────────────────────────────────────────────

interface ReceiptPreviewProps {
  values: ReceiptTemplateFormData;
}

function ReceiptPreview({ values }: ReceiptPreviewProps) {
  const widthClass =
    values.paperSize === 'A4'
      ? 'max-w-md'
      : values.paperSize === '80mm'
        ? 'max-w-xs'
        : 'max-w-[220px]';

  return (
    <div
      aria-label="Receipt preview"
      className={`${widthClass} mx-auto bg-white border border-gray-200 rounded shadow-sm p-4 font-mono text-xs text-gray-800 space-y-2`}
    >
      {/* Logo placeholder */}
      {values.showLogo && (
        <div className="flex justify-center mb-1">
          <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-[10px]">
            LOGO
          </div>
        </div>
      )}

      {/* Receipt title */}
      <p className="text-center font-bold text-sm tracking-widest">
        {values.receiptTitle || 'RECEIPT'}
      </p>

      {/* Header text */}
      {values.headerText && (
        <p className="text-center text-[10px] text-gray-500 whitespace-pre-wrap">
          {values.headerText}
        </p>
      )}

      <hr className="border-dashed border-gray-300" />

      {/* Business address placeholder */}
      {values.showBusinessAddress && (
        <div className="text-[10px] text-gray-500 space-y-0.5">
          <p>123 Business Street</p>
          <p>City, State 00000</p>
          <p>Tel: +1 (555) 000-0000</p>
        </div>
      )}

      <hr className="border-dashed border-gray-300" />

      {/* Order number */}
      {values.showOrderNumber && (
        <div className="flex justify-between text-[10px]">
          <span className="text-gray-500">Order #</span>
          <span>ORD-00001</span>
        </div>
      )}

      <div className="flex justify-between text-[10px]">
        <span className="text-gray-500">Date</span>
        <span>{new Date().toLocaleDateString()}</span>
      </div>

      <hr className="border-dashed border-gray-300" />

      {/* Sample line items */}
      <div className="space-y-1">
        <div className="flex justify-between">
          <span>Sample Item x1</span>
          <span>$10.00</span>
        </div>
        <div className="flex justify-between">
          <span>Another Item x2</span>
          <span>$20.00</span>
        </div>
      </div>

      <hr className="border-dashed border-gray-300" />

      {/* Tax breakdown */}
      {values.showTaxBreakdown && (
        <div className="space-y-0.5 text-[10px]">
          <div className="flex justify-between text-gray-500">
            <span>Subtotal</span>
            <span>$30.00</span>
          </div>
          <div className="flex justify-between text-gray-500">
            <span>Tax (18%)</span>
            <span>$5.40</span>
          </div>
        </div>
      )}

      <div className="flex justify-between font-bold text-sm border-t border-gray-300 pt-1">
        <span>TOTAL</span>
        <span>$35.40</span>
      </div>

      <hr className="border-dashed border-gray-300" />

      {/* Footer text */}
      {values.footerText && (
        <p className="text-center text-[10px] text-gray-500 whitespace-pre-wrap">
          {values.footerText}
        </p>
      )}

      <p className="text-center text-[9px] text-gray-400">
        Paper: {values.paperSize}
      </p>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ReceiptTemplateSettings() {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ReceiptTemplateFormData>({
    resolver: zodResolver(receiptTemplateSchema),
    defaultValues: DEFAULT_VALUES,
  });

  // Watch all values for live preview
  const formValues = watch();

  // Load saved values on mount
  useEffect(() => {
    const saved = loadSavedSettings();
    if (Object.keys(saved).length > 0) {
      reset({ ...DEFAULT_VALUES, ...saved } as ReceiptTemplateFormData);
    }
  }, [reset]);

  const onSubmit = async (data: ReceiptTemplateFormData) => {
    const settings: ReceiptTemplateSettingsType = {
      headerText: data.headerText,
      footerText: data.footerText,
      showLogo: data.showLogo,
      showBusinessAddress: data.showBusinessAddress,
      showTaxBreakdown: data.showTaxBreakdown,
      showOrderNumber: data.showOrderNumber,
      receiptTitle: data.receiptTitle,
      paperSize: data.paperSize,
    };
    localStorage.setItem(RECEIPT_TEMPLATE_SETTINGS_KEY, JSON.stringify(settings));
    toast.success('Receipt template saved successfully');
  };

  return (
    <div>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Receipt Templates</h3>
        <p className="mt-1 text-sm text-gray-500">
          Customize the layout and content of your printed receipts.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* ── Form ── */}
        <div className="flex-1 min-w-0">
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
            {/* Receipt Title */}
            <div>
              <label
                htmlFor="receiptTitle"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Receipt Title <span className="text-red-500" aria-hidden="true">*</span>
              </label>
              <input
                id="receiptTitle"
                type="text"
                {...register('receiptTitle')}
                aria-required="true"
                aria-describedby={errors.receiptTitle ? 'receiptTitle-error' : undefined}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., RECEIPT, TAX INVOICE"
              />
              {errors.receiptTitle && (
                <p id="receiptTitle-error" role="alert" className="mt-1 text-sm text-red-600">
                  {errors.receiptTitle.message}
                </p>
              )}
            </div>

            {/* Paper Size */}
            <div>
              <label
                htmlFor="paperSize"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Paper Size
              </label>
              <select
                id="paperSize"
                {...register('paperSize')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="58mm">58mm (Small thermal)</option>
                <option value="80mm">80mm (Standard thermal)</option>
                <option value="A4">A4 (Full page)</option>
              </select>
            </div>

            {/* Header Text */}
            <div>
              <label
                htmlFor="headerText"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Header Text
              </label>
              <textarea
                id="headerText"
                rows={3}
                {...register('headerText')}
                aria-describedby={errors.headerText ? 'headerText-error' : undefined}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Text shown at the top of the receipt"
              />
              {errors.headerText && (
                <p id="headerText-error" role="alert" className="mt-1 text-sm text-red-600">
                  {errors.headerText.message}
                </p>
              )}
            </div>

            {/* Footer Text */}
            <div>
              <label
                htmlFor="footerText"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Footer Text
              </label>
              <textarea
                id="footerText"
                rows={3}
                {...register('footerText')}
                aria-describedby={errors.footerText ? 'footerText-error' : undefined}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Text shown at the bottom of the receipt"
              />
              {errors.footerText && (
                <p id="footerText-error" role="alert" className="mt-1 text-sm text-red-600">
                  {errors.footerText.message}
                </p>
              )}
            </div>

            {/* Toggle options */}
            <fieldset className="space-y-3">
              <legend className="text-sm font-medium text-gray-700">Display Options</legend>

              <div className="flex items-center gap-3">
                <input
                  id="showLogo"
                  type="checkbox"
                  {...register('showLogo')}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="showLogo" className="text-sm text-gray-700">
                  Show Logo
                </label>
              </div>

              <div className="flex items-center gap-3">
                <input
                  id="showBusinessAddress"
                  type="checkbox"
                  {...register('showBusinessAddress')}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="showBusinessAddress" className="text-sm text-gray-700">
                  Show Business Address
                </label>
              </div>

              <div className="flex items-center gap-3">
                <input
                  id="showTaxBreakdown"
                  type="checkbox"
                  {...register('showTaxBreakdown')}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="showTaxBreakdown" className="text-sm text-gray-700">
                  Show Tax Breakdown
                </label>
              </div>

              <div className="flex items-center gap-3">
                <input
                  id="showOrderNumber"
                  type="checkbox"
                  {...register('showOrderNumber')}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="showOrderNumber" className="text-sm text-gray-700">
                  Show Order Number
                </label>
              </div>
            </fieldset>

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

        {/* ── Live Preview ── */}
        <div className="lg:w-80 flex-shrink-0">
          <p className="text-sm font-medium text-gray-700 mb-3">Live Preview</p>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 overflow-auto max-h-[600px]">
            <ReceiptPreview values={formValues} />
          </div>
        </div>
      </div>
    </div>
  );
}
