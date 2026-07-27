"use client";

/**
 * PresentationSpaceSelector
 * 
 * Space-based organization for presentations
 * Inspired by Stitch AI's memory space pattern
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Folder, Plus, Settings, Clock, FileText, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { getStitchClient } from "@/lib/stitch/client";

interface PresentationSpace {
  id: string;
  name: string;
  description?: string;
  presentationCount: number;
  lastModified: Date;
  thumbnail?: string;
}

interface PresentationSpaceSelectorProps {
  onSelectSpace: (spaceId: string) => void;
  selectedSpaceId?: string;
  className?: string;
}

function normalizeSpace(space: any): PresentationSpace {
  return {
    id: space.id ?? space.space_id ?? `local-${Date.now()}`,
    name: space.name ?? space.space_name ?? 'Untitled Space',
    description: space.description,
    presentationCount: Number(space.presentationCount ?? 0),
    lastModified: new Date(space.lastModified ?? space.updatedAt ?? space.createdAt ?? Date.now()),
    thumbnail: space.thumbnail,
  };
}

export function PresentationSpaceSelector({
  onSelectSpace,
  selectedSpaceId,
  className,
}: PresentationSpaceSelectorProps) {
  const [spaces, setSpaces] = useState<PresentationSpace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newSpaceName, setNewSpaceName] = useState('');
  const [newSpaceDescription, setNewSpaceDescription] = useState('');

  useEffect(() => {
    loadSpaces();
  }, []);

  const loadSpaces = async () => {
    setIsLoading(true);
    try {
      const stitchClient = getStitchClient();
      const remoteSpaces = await stitchClient.getAllSpaces();

      if (remoteSpaces.length > 0) {
        const parsedSpaces = remoteSpaces.map(normalizeSpace);
        setSpaces(parsedSpaces);
        localStorage.setItem('shothik-presentation-spaces', JSON.stringify(parsedSpaces));
      } else {
        // Default spaces
        const defaultSpaces: PresentationSpace[] = [
          {
            id: 'personal',
            name: 'Personal',
            description: 'Your personal presentations',
            presentationCount: 0,
            lastModified: new Date(),
          },
          {
            id: 'work',
            name: 'Work',
            description: 'Professional presentations',
            presentationCount: 0,
            lastModified: new Date(),
          },
        ];
        setSpaces(defaultSpaces);
        localStorage.setItem('shothik-presentation-spaces', JSON.stringify(defaultSpaces));
      }
    } catch (error) {
      console.error('Failed to load spaces:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createSpace = async () => {
    if (!newSpaceName.trim()) return;

    const stitchClient = getStitchClient();
    const spaceId = await stitchClient.createSpace(newSpaceName, 'presentation');

    const newSpace: PresentationSpace = {
      id: spaceId || `local-${Date.now()}`,
      name: newSpaceName,
      description: newSpaceDescription,
      presentationCount: 0,
      lastModified: new Date(),
    };

    const updatedSpaces = [...spaces, newSpace];
    setSpaces(updatedSpaces);
    localStorage.setItem('shothik-presentation-spaces', JSON.stringify(updatedSpaces));

    setNewSpaceName('');
    setNewSpaceDescription('');
    setIsCreateDialogOpen(false);
  };

  const filteredSpaces = spaces.filter(
    (space) =>
      space.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      space.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatLastModified = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search spaces..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Space
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Space</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Space Name</label>
                <Input
                  placeholder="e.g., Client Projects"
                  value={newSpaceName}
                  onChange={(e) => setNewSpaceName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description (optional)</label>
                <Input
                  placeholder="What kind of presentations?"
                  value={newSpaceDescription}
                  onChange={(e) => setNewSpaceDescription(e.target.value)}
                />
              </div>
              <Button 
                onClick={createSpace} 
                disabled={!newSpaceName.trim()}
                className="w-full"
              >
                Create Space
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSpaces.map((space) => (
          <Card
            key={space.id}
            className={cn(
              "cursor-pointer transition-all hover:shadow-md",
              selectedSpaceId === space.id && "ring-2 ring-primary"
            )}
            onClick={() => onSelectSpace(space.id)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Folder className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{space.name}</CardTitle>
                    {space.description && (
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {space.description}
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Open settings
                  }}
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  <span>{space.presentationCount} presentations</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{formatLastModified(space.lastModified)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredSpaces.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <Folder className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No spaces found</p>
          <p className="text-sm text-muted-foreground">Create a new space to get started</p>
        </div>
      )}
    </div>
  );
}

export default PresentationSpaceSelector;
