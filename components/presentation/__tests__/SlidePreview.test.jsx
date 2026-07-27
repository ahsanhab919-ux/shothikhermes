import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import SlidePreview from '../SlidePreview';

// Mock dynamic imports to render a component that triggers onSave
vi.mock('next/dynamic', () => ({
  default: () => {
    return (props) => (
      <div data-testid="dynamic-component">
        {/* Render save button if onSave prop is present (expected for EditingToolbar) */}
        {props.onSave && (
          <button data-testid="save-btn" onClick={props.onSave}>
            Save
          </button>
        )}
      </div>
    );
  }
}));

// Mock hooks
const mockSaveSlide = vi.fn();

vi.mock('@/hooks/presentation/useAutoSave', () => ({
  useAutoSave: () => ({
    saveStatus: 'idle',
    saveSlide: mockSaveSlide,
    errorMessage: null,
    lastSavedAt: null,
    hasUnsavedChanges: false
  })
}));

vi.mock('@/hooks/presentation/useSlideEditor', () => ({
  useSlideEditor: () => ({
    isEditing: true, // Force edit mode
    selectedElement: { id: 'el-1', elementPath: 'body', tagName: 'DIV' }, // Force element selected
    startEditMode: vi.fn(),
    stopEditMode: vi.fn(),
    editingMode: 'position',
    setMode: vi.fn(),
    clearSelection: vi.fn()
  })
}));

// Mock html2canvas
vi.mock('html2canvas', () => ({
  default: vi.fn(() => Promise.resolve({ toDataURL: () => 'data:image/png;base64,...' }))
}));

// Mock ResizeObserver
global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock UI components
vi.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children, value }) => <div>{children}</div>,
  TabsList: ({ children }) => <div>{children}</div>,
  TabsTrigger: ({ children }) => <button>{children}</button>,
  TabsContent: ({ children, value }) => value === 'preview' ? <div>{children}</div> : null,
}));

vi.mock('@/components/ui/card', () => ({
  Card: ({ children }) => <div>{children}</div>,
  CardContent: ({ children }) => <div>{children}</div>,
}));

vi.mock('@/components/ui/skeleton', () => ({
  Skeleton: () => <div />,
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick }) => <button onClick={onClick}>{children}</button>,
}));

vi.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }) => <div>{children}</div>,
  TooltipContent: ({ children }) => <div>{children}</div>,
  TooltipProvider: ({ children }) => <div>{children}</div>,
  TooltipTrigger: ({ children }) => <div>{children}</div>,
}));

// Mock other internal components
vi.mock('../editing/EditingErrorBoundary', () => ({
  EditingErrorBoundary: ({ children }) => <div>{children}</div>,
}));

vi.mock('../editing/SaveStatusIndicator', () => ({
  SaveStatusIndicator: () => <div />,
}));

vi.mock('../editing/AlignmentGuidesSkeleton', () => ({ AlignmentGuidesSkeleton: () => <div /> }));
vi.mock('../editing/EditingToolbarSkeleton', () => ({ EditingToolbarSkeleton: () => <div /> }));
vi.mock('../editing/GridOverlaySkeleton', () => ({ GridOverlaySkeleton: () => <div /> }));
vi.mock('../editing/ResizeHandlesSkeleton', () => ({ ResizeHandlesSkeleton: () => <div /> }));

describe('SlidePreview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls autoSave.saveSlide when onSave is triggered in EditingToolbar', () => {
    const slide = {
      id: 'slide-1',
      html_content: '<div>Slide Content</div>',
      slideNumber: 1
    };

    render(
      <SlidePreview
        slide={slide}
        index={0}
        activeTab="preview"
        onTabChange={() => {}}
        totalSlides={1}
        presentationId="pres-1"
      />
    );

    // Verify save button (from mocked dynamic component) is present
    // This confirms that EditingToolbar is being rendered with onSave prop
    const saveBtn = screen.getByTestId('save-btn');
    expect(saveBtn).toBeDefined();

    // Trigger save
    fireEvent.click(saveBtn);

    // Expect saveSlide to be called
    expect(mockSaveSlide).toHaveBeenCalled();
  });
});
