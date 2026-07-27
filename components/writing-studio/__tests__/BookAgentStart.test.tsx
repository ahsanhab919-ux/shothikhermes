import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { BookAgentStart } from '../BookAgentStart';

vi.mock('framer-motion', () => ({
  motion: new Proxy(
    {},
    {
      get: (_target, tag: string) => {
        const Component = ({ children, ...props }: React.HTMLAttributes<HTMLElement>) =>
          React.createElement(tag, props, children);
        Component.displayName = `motion.${tag}`;
        return Component;
      },
    }
  ),
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useReducedMotion: () => true,
}));

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('@/components/common/SvgColor', () => ({
  default: ({ className }: { className?: string }) => <span data-testid="svg-color" className={className} />,
}));

vi.mock('@/i18n', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('@/lib/projects-store', () => ({
  createProject: vi.fn(),
}));

vi.mock('@/lib/debug-log', () => ({
  debugLog: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('../SourceIntake', () => ({
  SourceIntake: () => <div>Source intake</div>,
}));

describe('BookAgentStart', () => {
  it('shows research guidance when research paper mode is selected', () => {
    render(<BookAgentStart onProjectCreated={vi.fn()} onCancel={vi.fn()} embedded />);

    expect(screen.getByText('Book manuscript plan')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Research Paper/i }));

    expect(screen.getByText('Research paper plan')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Generate a paper structure with sections, thesis framing, methodology cues, and source-aware notes.'
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText('Best for journal papers, conference submissions, theses, and literature reviews.')
    ).toBeInTheDocument();
  });

  it('updates selected state and assignment guidance when assignment mode is selected', () => {
    render(<BookAgentStart onProjectCreated={vi.fn()} onCancel={vi.fn()} embedded />);

    const assignmentButton = screen.getByRole('button', { name: /Assignment/i });
    fireEvent.click(assignmentButton);

    return waitFor(() => {
      expect(screen.getByRole('button', { name: /Assignment/i })).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByText('Assignment draft plan')).toBeInTheDocument();
      expect(
        screen.getByText(
          'Turn a prompt or brief into a structured assignment outline with evidence and marking-criteria guidance.'
        )
      ).toBeInTheDocument();
    });
  });
});
