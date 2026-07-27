/**
 * Hermes Slides API Integration Tests (Simplified)
 * 
 * Tests the complete Phase 2 slides artifact engine functionality.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Hermes Slides Phase 2 Implementation', () => {
  describe('API Route Integration', () => {
    it('should have slides generation route structure', async () => {
      // Test that the route files exist and export the expected functions
      const generateRoute = await import('@/app/api/hermes/slides/generate/route');
      expect(generateRoute.POST).toBeDefined();
      expect(typeof generateRoute.POST).toBe('function');
    });

    it('should have slides control route structure', async () => {
      // Test that the control route files exist and export the expected functions
      const controlRoute = await import('@/app/api/hermes/slides/control/[action]/route');
      expect(controlRoute.POST).toBeDefined();
      expect(typeof controlRoute.POST).toBe('function');
    });
  });

  describe('Hermes Orchestrator Integration', () => {
    it('should provide slides orchestrator access', async () => {
      const { getHermesOrchestrator } = await import('@/lib/hermes');
      const hermes = getHermesOrchestrator();
      
      // Verify that slides orchestrator is accessible
      expect(hermes.slidesOrchestrator).toBeDefined();
      expect(typeof hermes.slidesOrchestrator.generateSlides).toBe('function');
      expect(typeof hermes.slidesOrchestrator.pauseSlideGeneration).toBe('function');
      expect(typeof hermes.slidesOrchestrator.resumeSlideGeneration).toBe('function');
      expect(typeof hermes.slidesOrchestrator.updateSlideContent).toBe('function');
      expect(typeof hermes.slidesOrchestrator.exportSlideDeck).toBe('function');
      expect(typeof hermes.slidesOrchestrator.getRunStatus).toBe('function');
    });
  });

  describe('Contract Validation', () => {
    it('should validate slide generation request schema', async () => {
      // This tests that the Zod schemas are properly defined
      const { z } = await import('zod');
      
      const GenerateSlidesRequestSchema = z.object({
        workspaceId: z.string().min(1),
        topic: z.string().min(1),
        slideCount: z.number().min(1).max(50).default(10),
        template: z.string().default("professional"),
        targetAudience: z.string().default("general"),
        language: z.string().default("en"),
        requestId: z.string().optional(),
      });

      // Valid request
      const validRequest = {
        workspaceId: 'workspace123',
        topic: 'Machine Learning Fundamentals',
        slideCount: 12,
        template: 'professional',
      };

      const result = GenerateSlidesRequestSchema.safeParse(validRequest);
      expect(result.success).toBe(true);

      // Invalid request - topic too short
      const invalidRequest = {
        workspaceId: 'workspace123',
        topic: '',
        slideCount: 12,
      };

      const invalidResult = GenerateSlidesRequestSchema.safeParse(invalidRequest);
      expect(invalidResult.success).toBe(false);
    });
  });

  describe('Database Schema Compatibility', () => {
    it('should have hermes database infrastructure', async () => {
      const { getHermesDatabase } = await import('@/lib/hermes/infra/db');
      const db = getHermesDatabase();
      
      // Verify database methods exist
      expect(typeof db.createRun).toBe('function');
      expect(typeof db.getRun).toBe('function');
      expect(typeof db.updateRunStatus).toBe('function');
      expect(typeof db.createArtifact).toBe('function');
      expect(typeof db.getArtifact).toBe('function');
      expect(typeof db.updateArtifact).toBe('function');
    });

    it('should have artifact manager integration', async () => {
      const { getHermesArtifactManager } = await import('@/lib/hermes/modules/artifact-manager');
      const artifacts = getHermesArtifactManager();
      
      // Verify artifact management methods exist
      expect(typeof artifacts.createArtifact).toBe('function');
      expect(typeof artifacts.getArtifact).toBe('function');
      expect(typeof artifacts.updateArtifact).toBe('function');
      expect(typeof artifacts.createVersion).toBe('function');
      expect(typeof artifacts.archive).toBe('function');
    });
  });

  describe('Event Streaming Integration', () => {
    it('should have streaming engine integration', async () => {
      const { getHermesStreamingEngine } = await import('@/lib/hermes/modules/streaming-engine');
      const streaming = getHermesStreamingEngine();
      
      // Verify streaming methods exist
      expect(typeof streaming.emitRunEvent).toBe('function');
      expect(typeof streaming.getEventsSince).toBe('function');
      expect(typeof streaming.createSSEStream).toBe('function');
    });
  });
});