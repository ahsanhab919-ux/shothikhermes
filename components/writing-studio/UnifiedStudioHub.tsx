'use client';

import { BookAgentStart } from './BookAgentStart';

interface UnifiedStudioHubProps {
  onProjectCreated: (project: any) => void;
  onCancel: () => void;
  initialProjectType?: 'book' | 'research' | 'assignment';
  initialDescription?: string;
}

export function UnifiedStudioHub({
  onProjectCreated,
  onCancel,
  initialProjectType,
  initialDescription,
}: UnifiedStudioHubProps) {
  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <div className="flex-1 overflow-hidden">
        <BookAgentStart
          embedded
          initialProjectType={initialProjectType}
          initialDescription={initialDescription}
          onProjectCreated={onProjectCreated}
          onCancel={onCancel}
        />
      </div>
    </div>
  );
}
