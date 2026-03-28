/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Payment Gateway Settings Component
 *
 * Form for configuring Razorpay API keys and payment mode.
 * Saves to localStorage and validates with React Hook Form + Zod.
 *
 * Requirements: 13.4, 13.9
 */

'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { EyeIcon, EyeOffIcon, AlertTriangleIcon } from 'lucide-react';
import type { PaymentGatewaySettings } from '@/types/entities';

export const PAYMENT_GATEWAY_SETTINGS_KEY = 'payment_gateway_settings';

const paymentGatewaySchema = z
  .object({
    mode: z.enum(['test', 'live']),
    testKeyId: z.string().optional(),
    testKeySecret: z.string().optional(),
    liveKeyId: z.string().optional(),
    liveKeySecret: z.string().optional(),
    currency: z.enum(['INR', 'USD', 'EUR', 'GBP']),
    enableRazorpay: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (data.mode === 'test') {
      if (!data.testKeyId || data.testKeyId.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Test Key ID is required in test mode',
          path: ['testKeyId'],
        });
      }
      if (!data.testKeySecret || data.testKeySecret.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Test Key Secret is required in test mode',
          path: ['testKeySecret'],
        });
      }
    } else {
      if (!data.liveKeyId || data.liveKeyId.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Live Key ID is required in live mode',
          path: ['liveKeyId'],
        });
      }
      if (!data.liveKeySecret || data.liveKeySecret.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Live Key Secret is required in live mode',
          path: ['liveKeySecret'],
        });
      }
    }
  });

type PaymentGatewayFormData = z.infer<typeof paymentGatewaySchema>;

function loadSavedSettings(): Partial<PaymentGatewayFormData> {
  try {
    const raw = localStorage.getItem(PAYMENT_GATEWAY_SETTINGS_KEY);
    if (raw) return JSON.parse(raw) as Partial<PaymentGatewayFormData>;
  } catch {
    // ignore parse errors
  }
  return {};
}

export function PaymentGatewaySettings() {
  const [showTestSecret, setShowTestSecret] = useState(false);
  const [showLiveSecret, setShowLiveSecret] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PaymentGatewayFormData>({
    resolver: zodResolver(paymentGatewaySchema),
    defaultValues: {
      mode: 'test',
      testKeyId: '',
      testKeySecret: '',
      liveKeyId: '',
      liveKeySecret: '',
      currency: 'INR',
      enableRazorpay: false,
    },
  });

  const mode = watch('mode');

  // Load saved values on mount
  useEffect(() => {
    const saved = loadSavedSettings();
    if (Object.keys(saved).length > 0) {
      reset(saved as PaymentGatewayFormData);
    }
  }, [reset]);

  const onSubmit = async (data: PaymentGatewayFormData) => {
    const settings: PaymentGatewaySettings = {
      mode: data.mode,
      testKeyId: data.testKeyId ?? '',
      testKeySecret: data.testKeySecret ?? '',
      liveKeyId: data.liveKeyId ?? '',
      liveKeySecret: data.liveKeySecret ?? '',
      currency: data.currency,
      enableRazorpay: data.enableRazorpay,
    };
    localStorage.setItem(PAYMENT_GATEWAY_SETTINGS_KEY, JSON.stringify(settings));
    toast.success('Payment gateway settings saved successfully');
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Payment Gateway</h3>
        <p className="mt-1 text-sm text-gray-500">
          Configure Razorpay API keys and payment settings.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
        {/* Enable Razorpay toggle */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div>
            <p className="text-sm font-medium text-gray-900">Enable Razorpay</p>
            <p className="text-xs text-gray-500 mt-0.5">
              Activate Razorpay as a payment method
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer" aria-label="Enable Razorpay">
            <input
              id="enableRazorpay"
              type="checkbox"
              {...register('enableRazorpay')}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* Mode toggle */}
        <fieldset>
          <legend className="block text-sm font-medium text-gray-700 mb-2">
            Payment Mode
          </legend>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value="test"
                {...register('mode')}
                className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Test Mode</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value="live"
                {...register('mode')}
                className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Live Mode</span>
            </label>
          </div>
        </fieldset>

        {/* Live mode warning */}
        {mode === 'live' && (
          <div
            role="alert"
            className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-300 rounded-lg"
          >
            <AlertTriangleIcon className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="text-sm font-medium text-amber-800">Live Mode Active</p>
              <p className="text-xs text-amber-700 mt-0.5">
                You are using live credentials. Real transactions will be processed. Ensure your
                keys are correct before saving.
              </p>
            </div>
          </div>
        )}

        {/* Test Keys */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-800">Test Credentials</h4>

          <div>
            <label htmlFor="testKeyId" className="block text-sm font-medium text-gray-700 mb-1">
              Test Key ID
              {mode === 'test' && (
                <span className="text-red-500 ml-1" aria-hidden="true">*</span>
              )}
            </label>
            <input
              id="testKeyId"
              type="text"
              {...register('testKeyId')}
              aria-describedby={errors.testKeyId ? 'testKeyId-error' : undefined}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="rzp_test_xxxxxxxxxxxx"
            />
            {errors.testKeyId && (
              <p id="testKeyId-error" role="alert" className="mt-1 text-sm text-red-600">
                {errors.testKeyId.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="testKeySecret" className="block text-sm font-medium text-gray-700 mb-1">
              Test Key Secret
              {mode === 'test' && (
                <span className="text-red-500 ml-1" aria-hidden="true">*</span>
              )}
            </label>
            <div className="relative">
              <input
                id="testKeySecret"
                type={showTestSecret ? 'text' : 'password'}
                {...register('testKeySecret')}
                aria-describedby={errors.testKeySecret ? 'testKeySecret-error' : undefined}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="••••••••••••••••"
              />
              <button
                type="button"
                onClick={() => setShowTestSecret((v) => !v)}
                aria-label={showTestSecret ? 'Hide test key secret' : 'Show test key secret'}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                {showTestSecret ? (
                  <EyeOffIcon className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <EyeIcon className="h-4 w-4" aria-hidden="true" />
                )}
              </button>
            </div>
            {errors.testKeySecret && (
              <p id="testKeySecret-error" role="alert" className="mt-1 text-sm text-red-600">
                {errors.testKeySecret.message}
              </p>
            )}
          </div>
        </div>

        {/* Live Keys */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-800">Live Credentials</h4>

          <div>
            <label htmlFor="liveKeyId" className="block text-sm font-medium text-gray-700 mb-1">
              Live Key ID
              {mode === 'live' && (
                <span className="text-red-500 ml-1" aria-hidden="true">*</span>
              )}
            </label>
            <input
              id="liveKeyId"
              type="text"
              {...register('liveKeyId')}
              aria-describedby={errors.liveKeyId ? 'liveKeyId-error' : undefined}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="rzp_live_xxxxxxxxxxxx"
            />
            {errors.liveKeyId && (
              <p id="liveKeyId-error" role="alert" className="mt-1 text-sm text-red-600">
                {errors.liveKeyId.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="liveKeySecret" className="block text-sm font-medium text-gray-700 mb-1">
              Live Key Secret
              {mode === 'live' && (
                <span className="text-red-500 ml-1" aria-hidden="true">*</span>
              )}
            </label>
            <div className="relative">
              <input
                id="liveKeySecret"
                type={showLiveSecret ? 'text' : 'password'}
                {...register('liveKeySecret')}
                aria-describedby={errors.liveKeySecret ? 'liveKeySecret-error' : undefined}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="••••••••••••••••"
              />
              <button
                type="button"
                onClick={() => setShowLiveSecret((v) => !v)}
                aria-label={showLiveSecret ? 'Hide live key secret' : 'Show live key secret'}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                {showLiveSecret ? (
                  <EyeOffIcon className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <EyeIcon className="h-4 w-4" aria-hidden="true" />
                )}
              </button>
            </div>
            {errors.liveKeySecret && (
              <p id="liveKeySecret-error" role="alert" className="mt-1 text-sm text-red-600">
                {errors.liveKeySecret.message}
              </p>
            )}
          </div>
        </div>

        {/* Currency */}
        <div>
          <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-1">
            Currency
          </label>
          <select
            id="currency"
            {...register('currency')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            <option value="INR">INR — Indian Rupee</option>
            <option value="USD">USD — US Dollar</option>
            <option value="EUR">EUR — Euro</option>
            <option value="GBP">GBP — British Pound</option>
          </select>
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
