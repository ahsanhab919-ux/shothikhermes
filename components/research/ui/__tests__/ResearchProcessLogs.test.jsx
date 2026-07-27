
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ResearchProcessLogs from '../ResearchProcessLogs';

// Mock scrollIntoView to avoid errors
window.HTMLElement.prototype.scrollIntoView = vi.fn();

const mockEvents = [
  {
    step: 'queued',
    timestamp: new Date().toISOString(),
    data: { message: 'Starting research...' }
  },
  {
    step: 'web_research',
    timestamp: new Date().toISOString(),
    data: { search_query: ['react performance'] }
  },
  {
    step: 'completed',
    timestamp: new Date().toISOString(),
    data: { output: 'Done' }
  }
];

describe('ResearchProcessLogs', () => {
  it('renders list of events', () => {
    render(<ResearchProcessLogs streamEvents={mockEvents} isStreaming={false} />);

    expect(screen.getByText('Starting research...')).toBeDefined();
    expect(screen.getByText('Queued')).toBeDefined();
    expect(screen.getByText('Web research')).toBeDefined();
    expect(screen.getByText('Completed')).toBeDefined();
  });

  it('handles empty events', () => {
    const { container } = render(<ResearchProcessLogs streamEvents={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders badges for queries', () => {
    render(<ResearchProcessLogs streamEvents={mockEvents} isStreaming={false} />);
    const badges = screen.getAllByText('react performance');
    expect(badges.length).toBeGreaterThan(0);
  });
});
