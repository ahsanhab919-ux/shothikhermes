'use client';

/**
 * Create Session Dialog
 * 
 * Form for creating new Hermes sessions.
 * Uses backend API via hooks, no local orchestration.
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Plus, Loader2 } from 'lucide-react';
import { useCreateHermesRun, useCreateHermesSession } from '@/lib/hermes/hooks';
import type { WorkspaceId } from '@/lib/hermes/contracts/core';

const createSessionSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title too long'),
  description: z.string().max(500, 'Description too long').optional(),
});

type CreateSessionFormData = z.infer<typeof createSessionSchema>;

interface CreateSessionDialogProps {
  workspaceId: WorkspaceId;
  onSessionCreated?: (sessionId: string) => void;
  trigger?: React.ReactNode;
}

export function CreateSessionDialog({ 
  workspaceId, 
  onSessionCreated,
  trigger 
}: CreateSessionDialogProps) {
  const [open, setOpen] = useState(false);
  const createSessionMutation = useCreateHermesSession();

  const form = useForm<CreateSessionFormData>({
    resolver: zodResolver(createSessionSchema),
    defaultValues: {
      title: '',
      description: '',
    },
  });

  const onSubmit = async (data: CreateSessionFormData) => {
    try {
      const session = await createSessionMutation.mutateAsync({
        workspaceId,
        title: data.title,
        description: data.description || undefined,
      });

      setOpen(false);
      form.reset();
      onSessionCreated?.(session.id);
    } catch (error) {
      console.error('Failed to create session:', error);
      // Error is handled by the mutation and will show in the form
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Session
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Session</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter session title..." 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe what this session is for..."
                      className="resize-none"
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {createSessionMutation.error && (
              <div className="text-sm text-destructive">
                Failed to create session: {createSessionMutation.error.message}
              </div>
            )}
            
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createSessionMutation.isPending}
              >
                {createSessionMutation.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Create Session
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Create Run Dialog
 * 
 * Form for creating new Hermes runs within a session or workspace.
 */

const createRunSchema = z.object({
  domain: z.enum(['slides', 'sheets', 'research', 'writing', 'books', 'ai-detector', 'plagiarism', 'publish']),
  description: z.string().max(500, 'Description too long').optional(),
});

type CreateRunFormData = z.infer<typeof createRunSchema>;

interface CreateRunDialogProps {
  workspaceId: WorkspaceId;
  sessionId?: string;
  onRunCreated?: (runId: string, streamUrl: string) => void;
  trigger?: React.ReactNode;
}

export function CreateRunDialog({ 
  workspaceId, 
  sessionId,
  onRunCreated,
  trigger 
}: CreateRunDialogProps) {
  const [open, setOpen] = useState(false);
  const createRunMutation = useCreateHermesRun();

  const form = useForm<CreateRunFormData>({
    resolver: zodResolver(createRunSchema),
    defaultValues: {
      domain: 'slides',
      description: '',
    },
  });

  const onSubmit = async (data: CreateRunFormData) => {
    try {
      const response = await createRunMutation.mutateAsync({
        workspaceId,
        sessionId: sessionId || undefined,
        domain: data.domain,
        metadata: {
          description: data.description || undefined,
        },
      });

      setOpen(false);
      form.reset();
      onRunCreated?.(response.run.id, response.streamUrl);
    } catch (error) {
      console.error('Failed to create run:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Run
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Run</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="domain"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Domain</FormLabel>
                  <FormControl>
                    <select 
                      className="w-full p-2 border border-input rounded-md bg-background"
                      {...field}
                    >
                      <option value="slides">Slides</option>
                      <option value="sheets">Sheets</option>
                      <option value="research">Research</option>
                      <option value="writing">Writing</option>
                      <option value="books">Books</option>
                      <option value="ai-detector">AI Detector</option>
                      <option value="plagiarism">Plagiarism</option>
                      <option value="publish">Publish</option>
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe what this run should do..."
                      className="resize-none"
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {createRunMutation.error && (
              <div className="text-sm text-destructive">
                Failed to create run: {createRunMutation.error.message}
              </div>
            )}
            
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createRunMutation.isPending}
              >
                {createRunMutation.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Create Run
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
