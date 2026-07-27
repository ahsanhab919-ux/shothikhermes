// File: src/services/presentation/PresentationOrchestrator.js (UPDATED)

import PresentationAPIService from "./PresentationApiSlice";
import PresentationSSEService from "./PresentationSSEService";
import HistoryDataParser from "./SlideHistoryDataParser";

export default class PresentationOrchestrator {
  statusCheckTimer = null;
  abortController = null;
  currentPId = null;

  constructor(config) {
    this.config = config;
    this.apiService = new PresentationAPIService(config.baseUrl);
    this.sseService = new PresentationSSEService(config);
    this.historyParser = new HistoryDataParser();
  }

  async start(pId, onUpdate) {
    this.stop();
    this.currentPId = pId;
    this.abortController = new AbortController();

    try {
      // Initial status check
      onUpdate({ status: "checking" });
      const statusResponse = await this.apiService.checkStatus(pId);

      await this.handleStatus(pId, statusResponse.status, onUpdate);

      // Start periodic status checking only if not completed/failed
      if (
        statusResponse.status !== "completed" &&
        statusResponse.status !== "failed"
      ) {
        this.startStatusPolling(pId, onUpdate);
      }
    } catch (error) {
      console.error("Start error:", error);
      onUpdate({
        status: "error",
        error: error.message || "Failed to start presentation",
      });
    }
  }

  async handleStatus(pId, status, onUpdate) {
    onUpdate({ presentationStatus: status });

    switch (status) {
      case "queued":
        // Start streaming for queued presentations
        onUpdate({ status: "queued" });
        this.sseService.connect(pId, onUpdate, this.abortController?.signal);
        break;

      case "processing":
        // Restart streaming for processing presentations
        onUpdate({ status: "streaming" });
        this.sseService.disconnect();
        // Small delay before reconnecting
        setTimeout(() => {
          this.sseService.connect(pId, onUpdate, this.abortController?.signal);
        }, 500);
        break;

      case "completed":
        // Fetch history for completed presentations
        onUpdate({ status: "completed" });
        await this.loadHistory(pId, onUpdate);
        this.stop();
        break;

      case "failed":
        // Fetch history for failed presentations
        onUpdate({ status: "failed" });
        await this.loadHistory(pId, onUpdate);
        this.stop();
        break;

      default:
        console.warn("Unknown status:", status);
    }
  }

  async loadHistory(pId, onUpdate) {
    try {
      const history = await this.apiService.getHistory(pId);

      // Parse history data using HistoryDataParser
      const parsedHistory = this.historyParser.parseHistory(history);

      // Extract metadata (title, totalSlides)
      const metadata = this.historyParser.extractMetadata(parsedHistory.logs);

      // Update with parsed data
      onUpdate({
        logs: parsedHistory.logs,
        slides: parsedHistory.slides,
        title: metadata.title,
        totalSlides: metadata.totalSlides,
        _replaceArrays: true, // Signal to replace, not append
      });
    } catch (error) {
      console.error("History load error:", error);
      onUpdate({
        error: `Failed to load history: ${error.message}`,
      });
    }
  }

  startStatusPolling(pId, onUpdate) {
    const interval = this.config.statusCheckInterval || 5000;


    this.statusCheckTimer = setInterval(async () => {
      try {
        const statusResponse = await this.apiService.checkStatus(pId);


        // Only react to terminal status changes
        if (
          statusResponse.status === "completed" ||
          statusResponse.status === "failed"
        ) {
          await this.handleStatus(pId, statusResponse.status, onUpdate);
        }
      } catch (error) {
        console.error("Status check failed:", error);
        // Don't stop polling on single failure
      }
    }, interval);
  }

  stop() {

    if (this.statusCheckTimer) {
      clearInterval(this.statusCheckTimer);
      this.statusCheckTimer = null;
    }

    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }

    this.sseService.disconnect();
    this.currentPId = null;
  }

  getCurrentPId() {
    return this.currentPId;
  }
}
