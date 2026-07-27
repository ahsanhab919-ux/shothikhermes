import { beforeEach, describe, expect, it, vi } from "vitest";
import { HermesClient, HermesClientError } from "./client";

describe("HermesClient", () => {
  let client: HermesClient;
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.fetch = mockFetch;
    client = new HermesClient("/api/hermes");
  });

  describe("createSession", () => {
    it("sends POST request to /sessions and returns session data", async () => {
      const mockSession = { id: "session-1", title: "Test Session" };
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: { session: mockSession } }),
      });

      const result = await client.createSession({
        workspaceId: "ws-1",
        title: "Test Session",
      });

      expect(mockFetch).toHaveBeenCalledWith("/api/hermes/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId: "ws-1", title: "Test Session" }),
      });
      expect(result).toEqual(mockSession);
    });

    it("throws HermesClientError when response is not ok", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: async () => ({
          code: "HERMES_AUTH_REQUIRED",
          message: "Auth required",
        }),
      });

      await expect(
        client.createSession({ workspaceId: "ws-1", title: "Test" })
      ).rejects.toThrow(HermesClientError);
    });
  });

  describe("listSessions", () => {
    it("sends GET request to /sessions with search params", async () => {
      const mockSessions = [{ id: "session-1" }];
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: { sessions: mockSessions } }),
      });

      const result = await client.listSessions({
        workspaceId: "ws-1",
        limit: 10,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        "/api/hermes/sessions?workspaceId=ws-1&limit=10",
        {
          headers: { "Content-Type": "application/json" },
        }
      );
      expect(result).toEqual(mockSessions);
    });
  });

  describe("controlSession", () => {
    it("sends POST request to control session state", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      await client.controlSession("session-1", { action: "pause" });

      expect(mockFetch).toHaveBeenCalledWith("/api/hermes/sessions/session-1", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "pause" }),
      });
    });
  });

  describe("createRun", () => {
    it("sends POST request to /runs and returns run & streamUrl", async () => {
      const mockRunResponse = {
        run: { id: "run-1", domain: "slides" },
        streamUrl: "/api/hermes/runs/run-1",
      };
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: mockRunResponse }),
      });

      const result = await client.createRun({
        workspaceId: "ws-1",
        domain: "slides",
      });

      expect(mockFetch).toHaveBeenCalledWith("/api/hermes/runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId: "ws-1", domain: "slides" }),
      });
      expect(result).toEqual(mockRunResponse);
    });
  });

  describe("controlRun", () => {
    it("sends POST request to control run state", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      await client.controlRun("run-1", { action: "pause" });

      expect(mockFetch).toHaveBeenCalledWith("/api/hermes/runs/run-1", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "pause" }),
      });
    });
  });

  describe("generateSlides", () => {
    it("sends POST request to /slides/generate", async () => {
      const mockResponse = { runId: "r-slides-1", streamUrl: "/api/hermes/runs/r-slides-1", workspaceId: "ws-1" };
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: mockResponse }),
      });

      const result = await client.generateSlides({ workspaceId: "ws-1", topic: "Machine Learning" });

      expect(mockFetch).toHaveBeenCalledWith("/api/hermes/slides/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId: "ws-1", topic: "Machine Learning" }),
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe("controlSlides", () => {
    it("sends POST request to /slides/control/[action]", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      const body = { runId: "r-1", jobId: "j-1", workspaceId: "w-1", requestId: "req-1" };
      const result = await client.controlSlides("pause", body);

      expect(mockFetch).toHaveBeenCalledWith("/api/hermes/slides/control/pause", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      expect(result).toEqual({ success: true });
    });
  });

  describe("generateSheets", () => {
    it("sends POST request to /sheets/generate", async () => {
      const mockResponse = { runId: "r-sheet-1", streamUrl: "/api/hermes/runs/r-sheet-1", workspaceId: "ws-1" };
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: mockResponse }),
      });

      const result = await client.generateSheets({ workspaceId: "ws-1", title: "Budget", prompt: "Generate sales" });

      expect(mockFetch).toHaveBeenCalledWith("/api/hermes/sheets/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId: "ws-1", title: "Budget", prompt: "Generate sales" }),
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe("controlSheets", () => {
    it("sends POST request to /sheets/control/[action]", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      const body = { runId: "r-1", workspaceId: "w-1", requestId: "req-1" };
      const result = await client.controlSheets("pause", body);

      expect(mockFetch).toHaveBeenCalledWith("/api/hermes/sheets/control/pause", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      expect(result).toEqual({ success: true });
    });
  });

  describe("generateResearch", () => {
    it("sends POST request to /research/generate", async () => {
      const mockResponse = { runId: "r-res-1", streamUrl: "/api/hermes/runs/r-res-1", workspaceId: "ws-1" };
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: mockResponse }),
      });

      const result = await client.generateResearch({ workspaceId: "ws-1", topic: "Quantum Computing" });

      expect(mockFetch).toHaveBeenCalledWith("/api/hermes/research/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId: "ws-1", topic: "Quantum Computing" }),
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe("controlResearch", () => {
    it("sends POST request to /research/control/[action]", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      const body = { runId: "r-1", workspaceId: "w-1", requestId: "req-1" };
      const result = await client.controlResearch("pause", body);

      expect(mockFetch).toHaveBeenCalledWith("/api/hermes/research/control/pause", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      expect(result).toEqual({ success: true });
    });
  });

  describe("generateWriting", () => {
    it("sends POST request to /writing/generate", async () => {
      const mockResponse = { runId: "r-w-1", streamUrl: "/api/hermes/runs/r-w-1", workspaceId: "ws-1" };
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: mockResponse }),
      });

      const result = await client.generateWriting({ workspaceId: "ws-1", title: "Article", prompt: "Draft post" });

      expect(mockFetch).toHaveBeenCalledWith("/api/hermes/writing/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId: "ws-1", title: "Article", prompt: "Draft post" }),
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe("generateBook", () => {
    it("sends POST request to /books/generate", async () => {
      const mockResponse = { runId: "r-b-1", streamUrl: "/api/hermes/runs/r-b-1", workspaceId: "ws-1" };
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: mockResponse }),
      });

      const result = await client.generateBook({ workspaceId: "ws-1", title: "Novel" });

      expect(mockFetch).toHaveBeenCalledWith("/api/hermes/books/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId: "ws-1", title: "Novel" }),
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe("generateAIDetector", () => {
    it("sends POST request to /ai-detector/generate", async () => {
      const mockResponse = { runId: "r-ai-1", streamUrl: "/api/hermes/runs/r-ai-1", workspaceId: "ws-1" };
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: mockResponse }),
      });

      const result = await client.generateAIDetector({ workspaceId: "ws-1", text: "Check text content" });

      expect(mockFetch).toHaveBeenCalledWith("/api/hermes/ai-detector/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId: "ws-1", text: "Check text content" }),
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe("generatePlagiarism", () => {
    it("sends POST request to /plagiarism/generate", async () => {
      const mockResponse = { runId: "r-plag-1", streamUrl: "/api/hermes/runs/r-plag-1", workspaceId: "ws-1" };
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: mockResponse }),
      });

      const result = await client.generatePlagiarism({ workspaceId: "ws-1", text: "Check text content" });

      expect(mockFetch).toHaveBeenCalledWith("/api/hermes/plagiarism/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId: "ws-1", text: "Check text content" }),
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe("generatePublish", () => {
    it("sends POST request to /publish/generate", async () => {
      const mockResponse = { runId: "r-pub-1", streamUrl: "/api/hermes/runs/r-pub-1", workspaceId: "ws-1" };
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: mockResponse }),
      });

      const result = await client.generatePublish({ workspaceId: "ws-1", artifactId: "art-1" });

      expect(mockFetch).toHaveBeenCalledWith("/api/hermes/publish/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId: "ws-1", artifactId: "art-1" }),
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe("handoff", () => {
    it("sends POST request to /handoff", async () => {
      const mockResponse = {
        handoffId: "h-1",
        targetRunId: "r-target-1",
        streamUrl: "/api/hermes/runs/r-target-1",
        sourceDomain: "research",
        targetDomain: "slides",
        workspaceId: "ws-1",
      };
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: mockResponse }),
      });

      const body = {
        workspaceId: "ws-1",
        sourceDomain: "research",
        targetDomain: "slides",
        contextSummary: "Findings summary",
      };
      const result = await client.handoff(body);

      expect(mockFetch).toHaveBeenCalledWith("/api/hermes/handoff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      expect(result).toEqual(mockResponse);
    });
  });
});


