/**
 * Utility Functions Index
 * 
 * Central export point for all utility functions
 */

// Sanitization utilities
export {
  sanitizeHtml,
  sanitizeText,
  sanitizeUrl,
  sanitizeCsvValue,
  sanitizeObject,
} from './sanitizer';

// File validation utilities
export {
  validateFile,
  validateFiles,
  validateFileType,
  validateFileSize,
  formatFileSize,
  MAX_FILE_SIZE,
  ALLOWED_FILE_TYPES,
  type FileValidationResult,
} from './file-validation';

// XSS prevention helpers
export {
  createSafeHtml,
  sanitizeUserInput,
  sanitizeSearchQuery,
  sanitizeFormData,
  containsXssPattern,
  sanitizeAttribute,
  sanitizeClassName,
  generateCspHeader,
  CSP_DIRECTIVES,
} from './xss-prevention';

// Permission utilities
export {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  hasRole,
  hasAnyRole,
  isAdmin,
  isManager,
  isStaff,
  PERMISSIONS,
  type Permission,
} from './permissions';

// Notification utilities
export {
  notifySuccess,
  notifyError,
  notifyWarning,
  notifyInfo,
  notifyLoading,
  notifyPromise,
  dismissNotification,
  dismissAllNotifications,
  notify,
  type NotificationOptions,
} from './notifications';
