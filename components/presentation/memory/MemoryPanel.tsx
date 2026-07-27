"use client";

/**
 * MemoryPanel
 * 
 * Displays AI-learned preferences and memories for a space
 * Inspired by Stitch AI's memory management
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Brain, 
  Palette, 
  Type, 
  Layout, 
  ThumbsUp, 
  ThumbsDown, 
  Trash2,
  Sparkles,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import { safeJsonParse } from "@/lib/mcp/config";
import { getStitchClient } from "@/lib/stitch/client";

interface Memory {
  id: string;
  type: 'style_preference' | 'template_choice' | 'content_pattern' | 'user_feedback';
  message: string;
  content: Record<string, any>;
  createdAt: Date;
}

interface MemoryPanelProps {
  spaceId: string;
  className?: string;
}

function parseMemoryPayload(memory: any): Record<string, any> {
  if (typeof memory === 'string') {
    return safeJsonParse<Record<string, any>>(memory, {});
  }

  return memory ?? {};
}

export function MemoryPanel({ spaceId, className }: MemoryPanelProps) {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['style', 'content'])
  );

  useEffect(() => {
    loadMemories();
  }, [spaceId]);

  const loadMemories = async () => {
    setIsLoading(true);
    try {
      const stitchClient = getStitchClient();
      const spaceMemories = await stitchClient.getAllMemories(spaceId);
      
      const parsedMemories: Memory[] = spaceMemories.map((m: any) => ({
        id: m.id,
        type: parseMemoryPayload(m.memory).type || 'user_feedback',
        message: m.message,
        content: parseMemoryPayload(m.memory),
        createdAt: new Date(m.createdAt),
      }));

      setMemories(parsedMemories);
    } catch (error) {
      console.error('Failed to load memories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const deleteMemory = async (memoryId: string) => {
    // Remove from local state
    setMemories(memories.filter(m => m.id !== memoryId));
    
    // Update localStorage
    const savedMemories = localStorage.getItem(`shothik-memories-${spaceId}`);
    if (savedMemories) {
      const parsed = JSON.parse(savedMemories);
      const filtered = parsed.filter((m: any) => m.id !== memoryId);
      localStorage.setItem(`shothik-memories-${spaceId}`, JSON.stringify(filtered));
    }
  };

  const styleMemories = memories.filter(m => m.type === 'style_preference');
  const contentMemories = memories.filter(m => m.type === 'content_pattern');
  const templateMemories = memories.filter(m => m.type === 'template_choice');
  const feedbackMemories = memories.filter(m => m.type === 'user_feedback');

  const getAggregatedStyle = () => {
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
  };

  const aggregatedStyle = getAggregatedStyle();

  return (
    <Card className={cn("h-full", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">AI Memory</CardTitle>
          </div>
          <Badge variant="secondary">{memories.length} memories</Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          AI learns your preferences from each presentation
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Style Preferences */}
        <div className="border rounded-lg overflow-hidden">
          <button
            className="w-full flex items-center justify-between p-3 bg-muted/50 hover:bg-muted transition-colors"
            onClick={() => toggleSection('style')}
          >
            <div className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              <span className="font-medium">Style Preferences</span>
            </div>
            {expandedSections.has('style') ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
          
          {expandedSections.has('style') && (
            <div className="p-3 space-y-3">
              {aggregatedStyle.colors.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Preferred Colors</p>
                  <div className="flex flex-wrap gap-2">
                    {aggregatedStyle.colors.map((color, i) => (
                      <div
                        key={i}
                        className="w-6 h-6 rounded-full border shadow-sm"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              )}

              {aggregatedStyle.fonts.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Preferred Fonts</p>
                  <div className="flex flex-wrap gap-2">
                    {aggregatedStyle.fonts.map((font, i) => (
                      <Badge key={i} variant="outline">{font}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {aggregatedStyle.layouts.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Preferred Layouts</p>
                  <div className="flex flex-wrap gap-2">
                    {aggregatedStyle.layouts.map((layout, i) => (
                      <Badge key={i} variant="outline">{layout}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {aggregatedStyle.colors.length === 0 && (
                <p className="text-sm text-muted-foreground italic">
                  No style preferences learned yet. Generate presentations to build memory.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Content Patterns */}
        <div className="border rounded-lg overflow-hidden">
          <button
            className="w-full flex items-center justify-between p-3 bg-muted/50 hover:bg-muted transition-colors"
            onClick={() => toggleSection('content')}
          >
            <div className="flex items-center gap-2">
              <Type className="h-4 w-4" />
              <span className="font-medium">Content Patterns</span>
            </div>
            {expandedSections.has('content') ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
          
          {expandedSections.has('content') && (
            <ScrollArea className="max-h-48">
              <div className="p-3 space-y-2">
                {contentMemories.length > 0 ? (
                  contentMemories.map((memory) => (
                    <div
                      key={memory.id}
                      className="flex items-start justify-between p-2 bg-muted/30 rounded"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{memory.message}</p>
                        {memory.content.writingStyle && (
                          <Badge variant="secondary" className="mt-1">
                            {memory.content.writingStyle}
                          </Badge>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0"
                        onClick={() => deleteMemory(memory.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    No content patterns learned yet.
                  </p>
                )}
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Recent Feedback */}
        {feedbackMemories.length > 0 && (
          <div className="border rounded-lg overflow-hidden">
            <button
              className="w-full flex items-center justify-between p-3 bg-muted/50 hover:bg-muted transition-colors"
              onClick={() => toggleSection('feedback')}
            >
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                <span className="font-medium">Recent Feedback</span>
              </div>
              {expandedSections.has('feedback') ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
            
            {expandedSections.has('feedback') && (
              <ScrollArea className="max-h-32">
                <div className="p-3 space-y-2">
                  {feedbackMemories.slice(0, 5).map((memory) => (
                    <div
                      key={memory.id}
                      className="flex items-center gap-2 p-2 bg-muted/30 rounded"
                    >
                      {memory.content.feedback === 'positive' ? (
                        <ThumbsUp className="h-4 w-4 text-green-500" />
                      ) : (
                        <ThumbsDown className="h-4 w-4 text-red-500" />
                      )}
                      <p className="text-sm truncate flex-1">{memory.message}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        )}

        <Button 
          variant="outline" 
          className="w-full"
          onClick={loadMemories}
        >
          <Sparkles className="h-4 w-4 mr-2" />
          Refresh Memories
        </Button>
      </CardContent>
    </Card>
  );
}

export default MemoryPanel;
