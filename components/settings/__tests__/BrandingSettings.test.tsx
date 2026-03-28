/**
 * BrandingSettings Component Tests
 *
 * Requirements: 13.7, 13.9, 13.10, 4.3
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { BrandingSettings, BRANDING_SETTINGS_KEY } from '../BrandingSettings';

vi.mock('sonner');

// Mock FileReader for logo upload tests
class MockFileReader {
  result: string | null = null;
  onload: ((ev: { target: { result: string } }) => void) | null = null;

  readAsDataURL(file: File) {
    this.result = `data:${file.type};base64,mockbase64data`;
    if (this.onload) {
      this.onload({ target: { result: this.result } });
    }
  }
}

describe('BrandingSettings', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    // @ts-expect-error mock FileReader
    global.FileReader = MockFileReader;
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Renders all fields', () => {
    it('renders the logo upload input', () => {
      render(<BrandingSettings />);
      expect(screen.getByLabelText(/upload logo/i)).toBeInTheDocument();
    });

    it('renders primary color inputs', () => {
      render(<BrandingSettings />);
      expect(screen.getByLabelText(/primary color picker/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^primary color$/i)).toBeInTheDocument();
    });

    it('renders secondary color inputs', () => {
      render(<BrandingSettings />);
      expect(screen.getByLabelText(/secondary color picker/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^secondary color$/i)).toBeInTheDocument();
    });

    it('renders a save button', () => {
      render(<BrandingSettings />);
      expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
    });

    it('shows "No logo" placeholder when no logo is set', () => {
      render(<BrandingSettings />);
      expect(screen.getByText(/no logo/i)).toBeInTheDocument();
    });
  });

  describe('Saves to localStorage on submit', () => {
    it('saves color settings to localStorage with correct key', async () => {
      const user = userEvent.setup();
      render(<BrandingSettings />);

      const primaryInput = screen.getByLabelText(/^primary color$/i);
      await user.clear(primaryInput);
      await user.type(primaryInput, '#FF5733');

      await user.click(screen.getByRole('button', { name: /save changes/i }));

      await waitFor(() => {
        const stored = localStorage.getItem(BRANDING_SETTINGS_KEY);
        expect(stored).not.toBeNull();
        const parsed = JSON.parse(stored!);
        expect(parsed.primaryColor).toBe('#FF5733');
      });
    });
  });

  describe('Shows success toast on save', () => {
    it('calls toast.success after successful save', async () => {
      const user = userEvent.setup();
      render(<BrandingSettings />);

      await user.click(screen.getByRole('button', { name: /save changes/i }));

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Branding settings saved successfully');
      });
    });
  });

  describe('Loads saved values on mount', () => {
    it('pre-fills form with values from localStorage', async () => {
      const saved = {
        primaryColor: '#123456',
        secondaryColor: '#ABCDEF',
        logo: 'data:image/png;base64,abc123',
      };
      localStorage.setItem(BRANDING_SETTINGS_KEY, JSON.stringify(saved));

      render(<BrandingSettings />);

      await waitFor(() => {
        expect(screen.getByLabelText(/^primary color$/i)).toHaveValue('#123456');
        expect(screen.getByLabelText(/^secondary color$/i)).toHaveValue('#ABCDEF');
        // Logo preview image should be shown
        expect(screen.getByAltText(/logo preview/i)).toBeInTheDocument();
      });
    });
  });

  describe('Validates color fields', () => {
    it('shows error for invalid hex color in primary color', async () => {
      const user = userEvent.setup();
      render(<BrandingSettings />);

      const primaryInput = screen.getByLabelText(/^primary color$/i);
      await user.clear(primaryInput);
      await user.type(primaryInput, 'notacolor');
      await user.click(screen.getByRole('button', { name: /save changes/i }));

      await waitFor(() => {
        expect(screen.getByText(/must be a valid hex color/i)).toBeInTheDocument();
      });
    });
  });

  describe('Logo upload validation', () => {
    it('shows error for non-image file', async () => {
      render(<BrandingSettings />);

      const file = new File(['content'], 'document.pdf', { type: 'application/pdf' });
      const input = screen.getByLabelText(/upload logo/i);
      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText(/only image files are allowed/i)).toBeInTheDocument();
      });
    });

    it('shows error for file exceeding 2MB', async () => {
      render(<BrandingSettings />);

      // Create a file larger than 2MB
      const largeContent = new Uint8Array(3 * 1024 * 1024);
      const file = new File([largeContent], 'large.png', { type: 'image/png' });
      const input = screen.getByLabelText(/upload logo/i);
      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText(/file size must be 2mb or less/i)).toBeInTheDocument();
      });
    });

    it('shows logo preview for valid image upload', async () => {
      render(<BrandingSettings />);

      const file = new File(['img'], 'logo.png', { type: 'image/png' });
      const input = screen.getByLabelText(/upload logo/i);
      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByAltText(/logo preview/i)).toBeInTheDocument();
      });
    });
  });

  describe('Applies CSS custom properties on save', () => {
    it('sets CSS custom properties on document root after save', async () => {
      const user = userEvent.setup();
      render(<BrandingSettings />);

      const primaryInput = screen.getByLabelText(/^primary color$/i);
      await user.clear(primaryInput);
      await user.type(primaryInput, '#AA1122');

      await user.click(screen.getByRole('button', { name: /save changes/i }));

      await waitFor(() => {
        expect(
          document.documentElement.style.getPropertyValue('--color-primary')
        ).toBe('#AA1122');
      });
    });
  });
});
