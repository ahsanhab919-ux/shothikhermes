import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import ButtonCopyText from '../ButtonCopyText';
import ButtonDownloadText from '../ButtonDownloadText';
import ButtonPasteText from '../ButtonPasteText';
import ButtonSampleText from '../ButtonSampleText';

afterEach(() => {
  cleanup();
});

// Mock imports
vi.mock('react-toastify', () => ({
  toast: {
    success: vi.fn(),
  },
}));

vi.mock('../tools/common/downloadfile', () => ({
  downloadFile: vi.fn().mockResolvedValue(true),
}));

// Mock clipboard
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn().mockResolvedValue(true),
    readText: vi.fn().mockResolvedValue('Clipboard sample'),
  },
});

// Mock Tooltip UI component to avoid Radix UI complexity in JSDOM
vi.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }) => <div>{children}</div>,
  TooltipTrigger: ({ children }) => <div>{children}</div>,
  TooltipContent: ({ children }) => <div data-testid="tooltip-content">{children}</div>,
  TooltipProvider: ({ children }) => <div>{children}</div>,
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }) => <button {...props}>{children}</button>,
}));

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  Check: () => <span data-testid="icon-check" />,
  Copy: () => <span data-testid="icon-copy" />,
  Download: () => <span data-testid="icon-download" />,
  ClipboardPaste: () => <span data-testid="icon-paste" />,
  FileText: () => <span data-testid="icon-file-text" />,
}));

describe('ButtonCopyText', () => {
  it('renders with correct aria-label', () => {
    render(<ButtonCopyText text="Hello World" />);
    const button = screen.getByRole('button', { name: /copy text/i });
    expect(button).toBeTruthy();
  });

  it('renders tooltip content', () => {
    render(<ButtonCopyText text="Hello World" />);
    const tooltip = screen.getByTestId('tooltip-content');
    expect(tooltip.textContent).toBe('Copy text');
  });

  it('changes state on click', async () => {
    render(<ButtonCopyText text="Hello World" />);
    const button = screen.getByRole('button', { name: /copy text/i });

    fireEvent.click(button);

    // Expect clipboard write
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Hello World');

    // The aria-label should update to "Copied"
    const copiedButton = await screen.findByRole('button', { name: /copied/i });
    expect(copiedButton).toBeTruthy();

    // Tooltip text should update
    const tooltip = screen.getByTestId('tooltip-content');
    expect(tooltip.textContent).toBe('Copied!');
  });
});

describe('ButtonDownloadText', () => {
  it('renders with correct aria-label', () => {
    render(<ButtonDownloadText text="Hello World" name="test.txt" />);
    const button = screen.getByRole('button', { name: /download text/i });
    expect(button).toBeTruthy();
  });

  it('renders tooltip content', () => {
    render(<ButtonDownloadText text="Hello World" name="test.txt" />);
    const tooltip = screen.getByTestId('tooltip-content');
    expect(tooltip.textContent).toBe('Download text');
  });
});

describe('ButtonPasteText', () => {
  it('renders with paste text label', () => {
    render(<ButtonPasteText />);
    expect(screen.getByRole('button', { name: /paste text/i })).toBeTruthy();
  });

  it('applies clipboard text on click', async () => {
    const onApply = vi.fn();
    render(<ButtonPasteText onApply={onApply} />);

    fireEvent.click(screen.getByRole('button', { name: /paste text/i }));

    expect(navigator.clipboard.readText).toHaveBeenCalled();
    await waitFor(() => {
      expect(onApply).toHaveBeenCalledWith('Clipboard sample');
    });
  });
});

describe('ButtonSampleText', () => {
  it('renders with sample button label', () => {
    render(<ButtonSampleText sample="Example" />);
    expect(screen.getByRole('button', { name: /try sample/i })).toBeTruthy();
  });

  it('applies provided sample text on click', async () => {
    const onApply = vi.fn();
    render(<ButtonSampleText sample="Example sample" onApply={onApply} />);

    fireEvent.click(screen.getByRole('button', { name: /try sample/i }));

    expect(onApply).toHaveBeenCalledWith('Example sample');
  });
});
