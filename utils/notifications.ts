/* eslint-disable @typescript-eslint/no-explicit-any */
import { toast, type ExternalToast } from 'sonner';

/**
 * Notification utility functions using Sonner toast library
 * Provides consistent notification behavior across the application
 * 
 * Requirements: 1.11, 18.10, 24.1, 24.2, 24.3, 24.4, 24.8, 29.5, 29.6, 29.7, 29.8, 29.9
 */

export interface NotificationOptions {
  /**
   * Optional description text shown below the main message
   */
  description?: string;
  
  /**
   * Duration in milliseconds before auto-dismiss
   * Default: 3000ms for success, Infinity for errors
   */
  duration?: number;
  
  /**
   * Action button configuration
   */
  action?: {
    label: string;
    onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  };
  
  /**
   * Cancel button configuration
   */
  cancel?: {
    label: string;
    onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  };
}

/**
 * Display a success notification
 * Auto-dismisses after 3 seconds by default
 * 
 * @param message - Main notification message
 * @param options - Optional configuration
 * @returns Toast ID for programmatic control
 * 
 * @example
 * ```ts
 * notifySuccess('Transaction completed successfully');
 * notifySuccess('Product saved', { description: 'SKU: ABC123' });
 * ```
 */
export function notifySuccess(message: string, options?: NotificationOptions) {
  return toast.success(message, {
    description: options?.description,
    duration: options?.duration ?? 3000,
    action: options?.action,
    cancel: options?.cancel,
  });
}

/**
 * Display an error notification
 * Requires manual dismissal by default
 * 
 * @param message - Main error message
 * @param options - Optional configuration
 * @returns Toast ID for programmatic control
 * 
 * @example
 * ```ts
 * notifyError('Failed to save product');
 * notifyError('Network error', { 
 *   description: 'Please check your connection',
 *   action: { label: 'Retry', onClick: () => retryOperation() }
 * });
 * ```
 */
export function notifyError(message: string, options?: NotificationOptions) {
  return toast.error(message, {
    description: options?.description,
    duration: options?.duration ?? Infinity,
    action: options?.action,
    cancel: options?.cancel,
  });
}

/**
 * Display a warning notification
 * Auto-dismisses after 5 seconds by default
 * 
 * @param message - Main warning message
 * @param options - Optional configuration
 * @returns Toast ID for programmatic control
 * 
 * @example
 * ```ts
 * notifyWarning('Low stock alert');
 * notifyWarning('Product stock low', { description: 'Only 5 units remaining' });
 * ```
 */
export function notifyWarning(message: string, options?: NotificationOptions) {
  return toast.warning(message, {
    description: options?.description,
    duration: options?.duration ?? 5000,
    action: options?.action,
    cancel: options?.cancel,
  });
}

/**
 * Display an info notification
 * Auto-dismisses after 4 seconds by default
 * 
 * @param message - Main info message
 * @param options - Optional configuration
 * @returns Toast ID for programmatic control
 * 
 * @example
 * ```ts
 * notifyInfo('Sync in progress');
 * notifyInfo('Background sync started', { description: '5 items pending' });
 * ```
 */
export function notifyInfo(message: string, options?: NotificationOptions) {
  return toast.info(message, {
    description: options?.description,
    duration: options?.duration ?? 4000,
    action: options?.action,
    cancel: options?.cancel,
  });
}

/**
 * Display a loading notification
 * Does not auto-dismiss - must be manually dismissed or updated
 * 
 * @param message - Loading message
 * @param options - Optional configuration
 * @returns Toast ID for programmatic control
 * 
 * @example
 * ```ts
 * const toastId = notifyLoading('Processing payment...');
 * // Later, update or dismiss:
 * toast.success('Payment completed', { id: toastId });
 * ```
 */
export function notifyLoading(message: string, options?: Omit<NotificationOptions, 'duration'>) {
  return toast.loading(message, {
    description: options?.description,
  });
}

/**
 * Display a promise-based notification
 * Automatically shows loading, success, or error states
 * 
 * @param promise - Promise to track
 * @param messages - Messages for each state
 * @returns Promise result
 * 
 * @example
 * ```ts
 * await notifyPromise(
 *   saveProduct(data),
 *   {
 *     loading: 'Saving product...',
 *     success: 'Product saved successfully',
 *     error: 'Failed to save product'
 *   }
 * );
 * ```
 */
export function notifyPromise<T>(
  promise: Promise<T>,
  messages: {
    loading: string;
    success: string | ((data: T) => string);
    error: string | ((error: Error) => string);
  }
) {
  return toast.promise(promise, messages);
}

/**
 * Dismiss a specific notification by ID
 * 
 * @param toastId - Toast ID returned from notification functions
 * 
 * @example
 * ```ts
 * const id = notifyLoading('Processing...');
 * // Later:
 * dismissNotification(id);
 * ```
 */
export function dismissNotification(toastId: string | number) {
  toast.dismiss(toastId);
}

/**
 * Dismiss all active notifications
 * 
 * @example
 * ```ts
 * dismissAllNotifications();
 * ```
 */
export function dismissAllNotifications() {
  toast.dismiss();
}

/**
 * Custom notification with full control
 * Use this for advanced use cases not covered by other functions
 * 
 * @param message - Notification message
 * @param options - Full Sonner toast options
 * @returns Toast ID for programmatic control
 */
export function notify(message: string, options?: Parameters<typeof toast>[1]) {
  return toast(message, options);
}
