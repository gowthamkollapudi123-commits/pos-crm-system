/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Settings Page
 *
 * System settings with tabbed navigation for all configuration areas.
 *
 * Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7, 13.8
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/components/providers/AuthProvider';
import { useAuth } from '@/hooks';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { OfflineIndicator } from '@/components/offline/OfflineIndicator';
import {
  BuildingIcon,
  ReceiptIcon,
  CreditCardIcon,
  BellIcon,
  PackageIcon,
  PaletteIcon,
  UsersIcon,
  PercentIcon,
} from 'lucide-react';
import { BusinessInfoSettings } from '@/components/settings/BusinessInfoSettings';
import { TaxSettings } from '@/components/settings/TaxSettings';
import { ReceiptTemplateSettings } from '@/components/settings/ReceiptTemplateSettings';
import { PaymentGatewaySettings } from '@/components/settings/PaymentGatewaySettings';
import { NotificationSettings } from '@/components/settings/NotificationSettings';
import { InventorySettings } from '@/components/settings/InventorySettings';
import { BrandingSettings } from '@/components/settings/BrandingSettings';

// Tab definitions
type SettingsTab =
  | 'business-info'
  | 'tax-settings'
  | 'receipt-templates'
  | 'payment-gateway'
  | 'notifications'
  | 'inventory'
  | 'branding'
  | 'users-roles';

interface TabConfig {
  id: SettingsTab;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const TABS: TabConfig[] = [
  {
    id: 'business-info',
    label: 'Business Info',
    icon: <BuildingIcon className="h-4 w-4" />,
    description: 'Configure business name, address, contact details, and tax ID',
  },
  {
    id: 'tax-settings',
    label: 'Tax Settings',
    icon: <PercentIcon className="h-4 w-4" />,
    description: 'Configure tax rates and calculation rules',
  },
  {
    id: 'receipt-templates',
    label: 'Receipt Templates',
    icon: <ReceiptIcon className="h-4 w-4" />,
    description: 'Customize receipt layout and content',
  },
  {
    id: 'payment-gateway',
    label: 'Payment Gateway',
    icon: <CreditCardIcon className="h-4 w-4" />,
    description: 'Configure Razorpay API keys and payment settings',
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: <BellIcon className="h-4 w-4" />,
    description: 'Configure notification preferences and channels',
  },
  {
    id: 'inventory',
    label: 'Inventory',
    icon: <PackageIcon className="h-4 w-4" />,
    description: 'Configure low stock thresholds and inventory settings',
  },
  {
    id: 'branding',
    label: 'Branding',
    icon: <PaletteIcon className="h-4 w-4" />,
    description: 'Upload logo and configure color scheme',
  },
  {
    id: 'users-roles',
    label: 'Users & Roles',
    icon: <UsersIcon className="h-4 w-4" />,
    description: 'Manage users and role-based permissions',
  },
];

export default function SettingsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuthContext();
  const { logout } = useAuth();
  const { isOnline } = useNetworkStatus();

  const [activeTab, setActiveTab] = useState<SettingsTab>('business-info');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  const currentTab = TABS.find((t) => t.id === activeTab)!;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="text-sm text-gray-600 hover:text-gray-900 focus:outline-none focus:underline"
                aria-label="Back to Dashboard"
              >
                ← Back to Dashboard
              </button>
              <h1 className="text-xl font-bold text-gray-900">Settings</h1>
            </div>
            <div className="flex items-center space-x-4">
              <OfflineIndicator />
              <span className="text-sm text-gray-700">
                Welcome, <span className="font-medium">{user.name}</span>
              </span>
              <button
                onClick={logout}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Page Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">System Settings</h2>
            <p className="mt-1 text-sm text-gray-600">
              Configure your business settings and preferences
            </p>
          </div>

          {/* Tabbed Navigation — scrolls horizontally on mobile */}
          <div className="bg-white rounded-lg shadow">
            <div className="border-b border-gray-200 overflow-x-auto">
              <nav
                className="-mb-px flex min-w-max"
                aria-label="Settings tabs"
                role="tablist"
              >
                {TABS.map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      role="tab"
                      aria-selected={isActive}
                      aria-controls={`panel-${tab.id}`}
                      id={`tab-${tab.id}`}
                      onClick={() => setActiveTab(tab.id)}
                      className={`
                        flex items-center gap-2 px-4 py-4 text-sm font-medium border-b-2 whitespace-nowrap
                        focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500
                        transition-colors
                        ${
                          isActive
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }
                      `}
                    >
                      {tab.icon}
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Tab Panel */}
            <div
              role="tabpanel"
              id={`panel-${activeTab}`}
              aria-labelledby={`tab-${activeTab}`}
              className="p-6"
            >
              {activeTab === 'business-info' ? (
                <BusinessInfoSettings />
              ) : activeTab === 'tax-settings' ? (
                <TaxSettings />
              ) : activeTab === 'receipt-templates' ? (
                <ReceiptTemplateSettings />
              ) : activeTab === 'payment-gateway' ? (
                <PaymentGatewaySettings />
              ) : activeTab === 'notifications' ? (
                <NotificationSettings />
              ) : activeTab === 'inventory' ? (
                <InventorySettings />
              ) : activeTab === 'branding' ? (
                <BrandingSettings />
              ) : (
                /* Placeholder content — remaining tabs will be implemented in tasks 14.3–14.8 */
                <div className="text-center py-16">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                    <span className="text-gray-400">{currentTab.icon}</span>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {currentTab.label}
                  </h3>
                  <p className="text-sm text-gray-500 max-w-md mx-auto">
                    {currentTab.description}
                  </p>
                  <p className="mt-4 text-xs text-gray-400">
                    This section will be implemented in a subsequent task.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
