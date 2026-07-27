"use client";

/**
 * usePresentationSpace Hook
 * 
 * Manages space-based presentation organization
 * Integrates with Stitch AI memory system
 */

import { useState, useEffect, useCallback } from 'react';
import { safeJsonParse } from '@/lib/mcp/config';
import { getStitchClient } from '@/lib/stitch/client';

export interface PresentationSpace {
  id: string;
  name: string;
  description?: string;
  presentationCount: number;
  lastModified: Date;
  createdAt: Date;
}

export interface SpaceMemory {
  id: string;
  type: 'style_preference' | 'template_choice' | 'content_pattern' | 'user_feedback';
  message: string;
  content: Record<string, any>;
  createdAt: Date;
}

function normalizeSpace(space: any): PresentationSpace {
  return {
    id: space.id ?? space.space_id ?? `local-${Date.now()}`,
    name: space.name ?? space.space_name ?? 'Untitled Space',
    description: space.description,
    presentationCount: Number(space.presentationCount ?? 0),
    lastModified: new Date(space.lastModified ?? space.updatedAt ?? space.createdAt ?? Date.now()),
    createdAt: new Date(space.createdAt ?? Date.now()),
  };
}

function parseMemoryPayload(memory: any): Record<string, any> {
  if (typeof memory === 'string') {
    return safeJsonParse<Record<string, any>>(memory, {});
  }
  return memory ?? {};
}

export function usePresentationSpace() {
  const [spaces, setSpaces] = useState<PresentationSpace[]>([]);
  const [currentSpace, setCurrentSpace] = useState<PresentationSpace | null>(null);
  const [memories, setMemories] = useState<SpaceMemory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load all spaces
  const loadSpaces = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const stitchClient = getStitchClient();
      const remoteSpaces = await stitchClient.getAllSpaces();
      const parsedSpaces = remoteSpaces.map(normalizeSpace);
      setSpaces(parsedSpaces);
      localStorage.setItem('shothik-presentation-spaces', JSON.stringify(parsedSpaces));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load spaces');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create new space
  const createSpace = useCallback(async (
    name: string, 
    description?: string
  ): Promise<PresentationSpace> => {
    setIsLoading(true);
    
    try {
      const stitchClient = getStitchClient();
      const spaceId = await stitchClient.createSpace(name, 'presentation');
      
      const newSpace: PresentationSpace = {
        id: spaceId || `local-${Date.now()}`,
        name,
        description,
        presentationCount: 0,
        lastModified: new Date(),
        createdAt: new Date(),
      };
      
      const updatedSpaces = [...spaces, newSpace];
      setSpaces(updatedSpaces);
      localStorage.setItem('shothik-presentation-spaces', JSON.stringify(updatedSpaces));
      
      return newSpace;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create space');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [spaces]);

  // Select space and load its memories
  const selectSpace = useCallback(async (spaceId: string) => {
    const space = spaces.find(s => s.id === spaceId);
    if (!space) return;
    
    setCurrentSpace(space);
    
    // Load memories for this space
    try {
      const stitchClient = getStitchClient();
      const spaceMemories = await stitchClient.getAllMemories(spaceId);
      
      const parsedMemories: SpaceMemory[] = spaceMemories.map((m: any) => ({
        id: m.id,
        type: parseMemoryPayload(m.memory).type || 'user_feedback',
        message: m.message,
        content: parseMemoryPayload(m.memory),
        createdAt: new Date(m.createdAt),
      }));
      
      setMemories(parsedMemories);
    } catch (err) {
      console.error('Failed to load memories:', err);
    }
  }, [spaces]);

  // Save memory to space
  const saveMemory = useCallback(async (
    type: SpaceMemory['type'],
    message: string,
    content: Record<string, any>
  ): Promise<boolean> => {
    if (!currentSpace) return false;
    
    try {
      const stitchClient = getStitchClient();
      const success = await stitchClient.uploadMemory(
        currentSpace.id,
        message,
        { ...content, type }
      );
      
      if (success) {
        // Reload memories
        await selectSpace(currentSpace.id);
      }
      
      return success;
    } catch (err) {
      console.error('Failed to save memory:', err);
      return false;
    }
  }, [currentSpace, selectSpace]);

  // Get aggregated style preferences
  const getStylePreferences = useCallback(() => {
    const styleMemories = memories.filter(m => m.type === 'style_preference');
    
    const colors = new Set<string>();
    const fonts = new Set<string>();
    const layouts = new Set<string>();
    
    styleMemories.forEach(m => {
      m.content.preferredColors?.forEach((c: string) => colors.add(c));
      m.content.preferredFonts?.forEach((f: string) => fonts.add(f));
      m.content.preferredLayouts?.forEach((l: string) => layouts.add(l));
    });
    
    return {
      colors: Array.from(colors),
      fonts: Array.from(fonts),
      layouts: Array.from(layouts),
    };
  }, [memories]);

  // Get content patterns
  const getContentPatterns = useCallback(() => {
    const contentMemories = memories.filter(m => m.type === 'content_pattern');
    
    const topics = new Set<string>();
    const writingStyles = new Set<string>();
    const audienceTypes = new Set<string>();
    
    contentMemories.forEach(m => {
      m.content.commonTopics?.forEach((t: string) => topics.add(t));
      if (m.content.writingStyle) writingStyles.add(m.content.writingStyle);
      if (m.content.audienceType) audienceTypes.add(m.content.audienceType);
    });
    
    return {
      topics: Array.from(topics),
      writingStyles: Array.from(writingStyles),
      audienceTypes: Array.from(audienceTypes),
    };
  }, [memories]);

  // Update space presentation count
  const updateSpaceStats = useCallback((spaceId: string, increment: number = 1) => {
    setSpaces(prev => {
      const updated = prev.map(s => {
        if (s.id === spaceId) {
          return {
            ...s,
            presentationCount: s.presentationCount + increment,
            lastModified: new Date(),
          };
        }
        return s;
      });
      
      localStorage.setItem('shothik-presentation-spaces', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Load spaces on mount
  useEffect(() => {
    loadSpaces();
  }, [loadSpaces]);

  return {
    spaces,
    currentSpace,
    memories,
    isLoading,
    error,
    createSpace,
    selectSpace,
    saveMemory,
    getStylePreferences,
    getContentPatterns,
    updateSpaceStats,
    refreshSpaces: loadSpaces,
  };
}

export default usePresentationSpace;
