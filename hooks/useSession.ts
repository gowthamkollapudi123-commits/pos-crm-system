/**
 * useSession Hook
 * 
 * Provides session validation and automatic refresh functionality.
 * Monitors session expiration and triggers refresh when needed.
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { authService } from '@/services/auth.service';

interface SessionState {
  isValid: boolean;
  isChecking: boolean;
  expiresAt: string | null;
}

export function useSession() {
  const [sessionState, setSessionState] = useState<SessionState>({
    isValid: false,
    isChecking: true,
    expiresAt: null,
  });

  const validateSession = useCallback(async () => {
    try {
      setSessionState((prev) => ({ ...prev, isChecking: true }));
      
      const response = await authService.me();
      
      if (response.success) {
        setSessionState({
          isValid: true,
          isChecking: false,
          expiresAt: response.data.expiresAt,
        });
        return true;
      } else {
        setSessionState({
          isValid: false,
          isChecking: false,
          expiresAt: null,
        });
        return false;
      }
    } catch {
      setSessionState({
        isValid: false,
        isChecking: false,
        expiresAt: null,
      });
      return false;
    }
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      const response = await authService.refresh();
      
      if (response.success) {
        setSessionState((prev) => ({
          ...prev,
          isValid: true,
          expiresAt: response.data.expiresAt,
        }));
        return true;
      } else {
        setSessionState((prev) => ({
          ...prev,
          isValid: false,
          expiresAt: null,
        }));
        return false;
      }
    } catch {
      setSessionState((prev) => ({
        ...prev,
        isValid: false,
        expiresAt: null,
      }));
      return false;
    }
  }, []);

  // Validate session on mount
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    validateSession();
  }, [validateSession]);

  // Set up automatic session refresh before expiration
  useEffect(() => {
    if (!sessionState.expiresAt) return;

    const expiresAt = new Date(sessionState.expiresAt).getTime();
    const now = Date.now();
    const timeUntilExpiry = expiresAt - now;

    // Refresh 5 minutes before expiration
    const refreshTime = timeUntilExpiry - 5 * 60 * 1000;

    if (refreshTime > 0) {
      const timeoutId = setTimeout(() => {
        refreshSession();
      }, refreshTime);

      return () => clearTimeout(timeoutId);
    }
  }, [sessionState.expiresAt, refreshSession]);

  return {
    isValid: sessionState.isValid,
    isChecking: sessionState.isChecking,
    expiresAt: sessionState.expiresAt,
    validateSession,
    refreshSession,
  };
}
