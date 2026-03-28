/**
 * Notification Settings Component
 *
 * Form for configuring notification preferences and channels.
 * Saves to localStorage and validates with React Hook Form + Zod.
 *
 * Requirements: 13.5, 13.9
 */

'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import type { NotificationSettings as NotificationSettingsType } from '@/types/entities';

export const NOTIFICATION_SETTINGS_KEY = 'notification_settings';

const notificationSettingsSchema = z.object({
  lowStockAlerts: z.boolean(),
  failedSyncNotifications: z.boolean(),
  transactionCompletion: z.boolean(),
  overdueFollowUpTasks: z.boolean(),
  emailNotifications: z.boolean(),
  browserNotifications: z.boolean(),
  notificationEmail: z
    .string()
    .optional()
    .refine((val) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), {
      message: 'Invalid email address',
    }),
});

type NotificationSettingsFormData = z.infer<typeof notificationSettingsSchema>;

function loadSavedSettings(): Partial<NotificationSettingsFormData> {
  try {
    const raw = localStorage.getItem(NOTIFICATION_SETTINGS_KEY);
    if (raw) return JSON.parse(raw) as Partial<NotificationSettingsFormData>;
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
    <div className="flex items-start justify-between py-4 border-b border-gray-100 last:border-0">
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

export function NotificationSettings() {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<NotificationSettingsFormData>({
    resolver: zodResolver(notificationSettingsSchema),
    defaultValues: {
      lowStockAlerts: true,
      failedSyncNotifications: true,
      transactionCompletion: true,
      overdueFollowUpTasks: true,
      emailNotifications: false,
      browserNotifications: false,
      notificationEmail: '',
    },
  });

  const values = watch();

  // Load saved values on mount
  useEffect(() => {
    const saved = loadSavedSettings();
    if (Object.keys(saved).length > 0) {
      reset({ ...values, ...saved } as NotificationSettingsFormData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reset]);

  const onSubmit = async (data: NotificationSettingsFormData) => {
    const settings: NotificationSettingsType = {
      lowStockAlerts: data.lowStockAlerts,
      failedSyncNotifications: data.failedSyncNotifications,
      transactionCompletion: data.transactionCompletion,
      overdueFollowUpTasks: data.overdueFollowUpTasks,
      emailNotifications: data.emailNotifications,
      browserNotifications: data.browserNotifications,
      notificationEmail: data.notificationEmail ?? '',
    };
    localStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(settings));
    toast.success('Notification preferences saved successfully');
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Notification Preferences</h3>
        <p className="mt-1 text-sm text-gray-500">
          Configure which notifications you receive and how they are delivered.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
        {/* Alert Types */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Alert Types</h4>
          <div className="bg-gray-50 rounded-lg px-4">
            <ToggleField
              id="lowStockAlerts"
              label="Low Stock Alerts"
              description="Get notified when product stock falls below the threshold"
              checked={values.lowStockAlerts}
              onChange={(v) => setValue('lowStockAlerts', v)}
            />
            <ToggleField
              id="failedSyncNotifications"
              label="Failed Sync Notifications"
              description="Get notified when offline transactions fail to sync"
              checked={values.failedSyncNotifications}
              onChange={(v) => setValue('failedSyncNotifications', v)}
            />
            <ToggleField
              id="transactionCompletion"
              label="Transaction Completion"
              description="Get notified when a transaction is completed"
              checked={values.transactionCompletion}
              onChange={(v) => setValue('transactionCompletion', v)}
            />
            <ToggleField
              id="overdueFollowUpTasks"
              label="Overdue Follow-up Tasks"
              description="Get notified when follow-up tasks are overdue"
              checked={values.overdueFollowUpTasks}
              onChange={(v) => setValue('overdueFollowUpTasks', v)}
            />
          </div>
        </div>

        {/* Delivery Channels */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Delivery Channels</h4>
          <div className="bg-gray-50 rounded-lg px-4">
            <ToggleField
              id="emailNotifications"
              label="Email Notifications"
              description="Receive notifications via email"
              checked={values.emailNotifications}
              onChange={(v) => setValue('emailNotifications', v)}
            />
            <ToggleField
              id="browserNotifications"
              label="Browser Notifications"
              description="Receive notifications in the browser"
              checked={values.browserNotifications}
              onChange={(v) => setValue('browserNotifications', v)}
            />
          </div>
        </div>

        {/* Notification Email */}
        <div>
          <label
            htmlFor="notificationEmail"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Notification Email Address
          </label>
          <input
            id="notificationEmail"
            type="email"
            {...register('notificationEmail')}
            aria-describedby={errors.notificationEmail ? 'notificationEmail-error' : undefined}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="notifications@business.com"
          />
          {errors.notificationEmail && (
            <p id="notificationEmail-error" role="alert" className="mt-1 text-sm text-red-600">
              {errors.notificationEmail.message}
            </p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Email address where notifications will be delivered when email notifications are enabled.
          </p>
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
