/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { 
  notifySuccess, 
  notifyError, 
  notifyWarning, 
  notifyInfo,
  notifyLoading,
  notifyPromise,
  dismissAllNotifications
} from '@/utils/notifications';
import { useState } from 'react';

/**
 * Test page for notification system
 * Demonstrates all notification types and features
 */
export default function TestNotificationsPage() {
  const [counter, setCounter] = useState(0);

  const handleSuccess = () => {
    notifySuccess('Operation completed successfully!', {
      description: 'Your changes have been saved.',
    });
  };

  const handleError = () => {
    notifyError('Failed to complete operation', {
      description: 'Please try again or contact support.',
      action: {
        label: 'Retry',
        onClick: () => console.log('Retry clicked'),
      },
    });
  };

  const handleWarning = () => {
    notifyWarning('Low stock alert', {
      description: 'Product ABC123 has only 5 units remaining.',
    });
  };

  const handleInfo = () => {
    notifyInfo('Sync in progress', {
      description: '3 items are being synchronized.',
    });
  };

  const handleLoading = () => {
    const toastId = notifyLoading('Processing payment...');
    
    // Simulate async operation
    setTimeout(() => {
      notifySuccess('Payment completed', {
        description: 'Transaction ID: TXN123456',
      });
    }, 2000);
  };

  const handlePromise = async () => {
    const mockPromise = new Promise((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() > 0.5) {
          resolve({ id: 123, name: 'Test Product' });
        } else {
          reject(new Error('Network error'));
        }
      }, 2000);
    });

    await notifyPromise(mockPromise, {
      loading: 'Saving product...',
      success: 'Product saved successfully!',
      error: 'Failed to save product',
    });
  };

  const handleMultiple = () => {
    notifySuccess('First notification');
    setTimeout(() => notifyInfo('Second notification'), 100);
    setTimeout(() => notifyWarning('Third notification'), 200);
    setTimeout(() => notifyError('Fourth notification (should queue)'), 300);
  };

  const handleDismissAll = () => {
    dismissAllNotifications();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Notification System Test</h1>
        <p className="text-gray-600 mb-8">
          Test all notification types and features. Maximum 3 concurrent notifications.
        </p>

        <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={handleSuccess}
              className="px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              Success Notification
              <span className="block text-xs mt-1 opacity-80">Auto-dismiss: 3s</span>
            </button>

            <button
              onClick={handleError}
              className="px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              Error Notification
              <span className="block text-xs mt-1 opacity-80">Manual dismiss</span>
            </button>

            <button
              onClick={handleWarning}
              className="px-4 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
            >
              Warning Notification
              <span className="block text-xs mt-1 opacity-80">Auto-dismiss: 5s</span>
            </button>

            <button
              onClick={handleInfo}
              className="px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Info Notification
              <span className="block text-xs mt-1 opacity-80">Auto-dismiss: 4s</span>
            </button>

            <button
              onClick={handleLoading}
              className="px-4 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
            >
              Loading Notification
              <span className="block text-xs mt-1 opacity-80">Updates after 2s</span>
            </button>

            <button
              onClick={handlePromise}
              className="px-4 py-3 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
            >
              Promise Notification
              <span className="block text-xs mt-1 opacity-80">Random success/error</span>
            </button>

            <button
              onClick={handleMultiple}
              className="px-4 py-3 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
            >
              Multiple Notifications
              <span className="block text-xs mt-1 opacity-80">Tests 3-toast limit</span>
            </button>

            <button
              onClick={handleDismissAll}
              className="px-4 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Dismiss All
              <span className="block text-xs mt-1 opacity-80">Clear all toasts</span>
            </button>
          </div>
        </div>

        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Features Implemented</h2>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span>Success notifications auto-dismiss after 3 seconds</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span>Error notifications require manual dismissal</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span>Maximum 3 concurrent notifications (others queue)</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span>Support for success, error, warning, info types</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span>Loading and promise-based notifications</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span>Action buttons and descriptions</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span>Accessible with proper ARIA labels</span>
            </li>
          </ul>
        </div>

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-blue-900">Usage Examples</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-blue-900 mb-2">Basic Success</h3>
              <pre className="bg-white p-3 rounded border border-blue-200 text-sm overflow-x-auto">
{`notifySuccess('Transaction completed');`}
              </pre>
            </div>
            <div>
              <h3 className="font-medium text-blue-900 mb-2">Error with Action</h3>
              <pre className="bg-white p-3 rounded border border-blue-200 text-sm overflow-x-auto">
{`notifyError('Failed to save', {
  description: 'Network error occurred',
  action: { label: 'Retry', onClick: retry }
});`}
              </pre>
            </div>
            <div>
              <h3 className="font-medium text-blue-900 mb-2">Promise-based</h3>
              <pre className="bg-white p-3 rounded border border-blue-200 text-sm overflow-x-auto">
{`await notifyPromise(saveData(), {
  loading: 'Saving...',
  success: 'Saved!',
  error: 'Failed to save'
});`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
