'use client';

import { Toaster } from 'sonner';

/**
 * ToasterProvider wraps the Sonner toast notification system
 * Configures global toast behavior and styling
 * 
 * Requirements: 1.11, 18.10, 29.5, 29.6, 29.7, 29.8, 29.9
 */
export function ToasterProvider() {
  return (
    <Toaster
      position="top-right"
      expand={false}
      richColors
      closeButton
      visibleToasts={3}
      toastOptions={{
        duration: 3000,
        classNames: {
          toast: 'group toast',
          title: 'text-sm font-medium',
          description: 'text-sm opacity-90',
          actionButton: 'bg-primary text-primary-foreground',
          cancelButton: 'bg-muted text-muted-foreground',
          closeButton: 'bg-background border border-border',
          error: 'border-destructive',
          success: 'border-green-500',
          warning: 'border-yellow-500',
          info: 'border-blue-500',
        },
      }}
    />
  );
}
