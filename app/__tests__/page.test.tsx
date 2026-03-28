import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Home from '@/app/page';

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

describe('Home page', () => {
  it('redirects to /login and shows loading spinner', () => {
    render(<Home />);

    expect(mockPush).toHaveBeenCalledWith('/login');
    expect(document.querySelector('.animate-spin')).not.toBeNull();
    expect(screen.queryByText('Get started by editing')).toBeNull();
  });
});
