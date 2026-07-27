// Updated to use SSEDataParser

import SSEDataParser from "./SSEDataParser";

export default class PresentationSSEService {
  abortController = null;
  reconnectCount = 0;
  lastEventId = null;
  heartbeatTimer = null;
  isManualClose = false;
  reader = null;
  parser = null;

  constructor(config) {
    this.config = config;
    this.parser = new SSEDataParser();
  }

  connect(pId, onUpdate, signal) {
    this.isManualClose = false;
    this.parser.reset(); // Reset parser for new connection

    const url = `${this.config.baseUrl}/stream/${pId}`;

    try {
      this.abortController = new AbortController();

      if (signal) {
        signal.addEventListener("abort", () => {
          this.disconnect();
        });
      }

      this.startFetchSSE(url, onUpdate);
      onUpdate({ status: "streaming" });
    } catch (error) {
      this.handleError(error, onUpdate);
    }
  }

  async startFetchSSE(url, onUpdate) {
    try {
      const accessToken = localStorage.getItem("accessToken");

      const headers = {
        Accept: "text/event-stream",
        Authorization: `Bearer ${accessToken}`,
      };

      if (this.lastEventId || localStorage.getItem("sse_last_event")) {
        headers["Last-Event-Id"] =
          this.lastEventId || localStorage.getItem("sse_last_event");
      }

      const response = await fetch(url, {
        method: "GET",
        headers,
        signal: this.abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error("No response body");
      }

      this.startHeartbeat(onUpdate);
      await this.processStream(response.body, onUpdate);
    } catch (error) {
      if (error.name === "AbortError") {
        return;
      }
      this.handleError(error, onUpdate);
    }
  }

  async processStream(body, onUpdate) {
    this.reader = body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await this.reader?.read();

        if (done) {
          // Flush any pending data before closing
          this.flushPendingData(onUpdate);
          break;
        }

        this.resetHeartbeat(onUpdate);

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          this.processSSELine(line, onUpdate);
        }
      }
    } catch (error) {
      if (error.name === "AbortError") {
        return;
      }
      this.handleError(error, onUpdate);
    }
  }

  processSSELine(line, onUpdate) {
    const trimmedLine = line.trim();

    if (!trimmedLine) {
      return;
    }

    if (trimmedLine.startsWith("id:")) {
      this.lastEventId = trimmedLine.substring(3).trim();
      localStorage.setItem(`sse_last_event`, this.lastEventId);
    } else if (trimmedLine.startsWith("event:")) {
      this.currentEventType = trimmedLine.substring(6).trim();
    } else if (trimmedLine.startsWith("data:")) {
      const data = trimmedLine.substring(5).trim();

      if (!data) return;

      try {
        const parsed = JSON.parse(data);
        this.handleData(parsed, onUpdate);
      } catch (e) {
        console.warn("Failed to parse SSE data:", data, e);
      }
    } else if (trimmedLine.startsWith("retry:")) {
      const retryMs = parseInt(trimmedLine.substring(6).trim(), 10);
      if (!isNaN(retryMs)) {
        this.config.reconnectDelay = retryMs;
      }
    }
  }

  handleData(data, onUpdate) {

    // Handle completion status
    if (data.status === "completed") {
      this.flushPendingData(onUpdate);
      onUpdate({ status: "completed", presentationStatus: "completed" });
      this.disconnect();
      return;
    }

    // Parse the event using SSEDataParser
    const parsedResult = this.parser.parseEvent(data);

    // 

    if (!parsedResult) {
      // Parser returned null (e.g., waiting for more data)
      return;
    }

    // Handle metadata updates (title, totalSlides)
    if (parsedResult.metadata) {
      onUpdate({
        title: parsedResult.metadata.title,
        totalSlides: parsedResult.metadata.totalSlides,
      });
    }

    // Emit parsed log or slide
    if (parsedResult.type === "log") {
      onUpdate({ logs: [parsedResult.log] });
    } else if (parsedResult.type === "slide") {
      onUpdate({ slides: [parsedResult.slide] });
    }

    // Handle progress updates
    if (data.progress) {
      onUpdate({ progress: data.progress });
    }
  }

  flushPendingData(onUpdate) {
    const pendingResults = this.parser.flushPending();

    pendingResults.forEach((result) => {
      if (result.type === "log") {
        onUpdate({ logs: [result.log] });
      } else if (result.type === "slide") {
        onUpdate({ slides: [result.slide] });
      }
    });
  }

  handleReconnect(onUpdate, pId) {
    if (this.isManualClose) {
      return;
    }

    if (this.reconnectCount >= (this.config.reconnectAttempts || 5)) {
      this.handleError(
        new Error("Max reconnection attempts reached"),
        onUpdate,
      );
      return;
    }

    const delay =
      (this.config.reconnectDelay || 1000) * Math.pow(2, this.reconnectCount);
    this.reconnectCount++;


    onUpdate({
      error: `Reconnecting... (attempt ${this.reconnectCount})`,
    });

    setTimeout(() => {
      if (!this.isManualClose) {
        this.connect(pId, onUpdate);
      }
    }, delay);
  }

  startHeartbeat(onUpdate) {
    const timeout = this.config.heartbeatTimeout || 30000;
    this.heartbeatTimer = setTimeout(() => {
      console.warn("Heartbeat timeout - no data received");
      this.handleError(
        new Error("Connection timeout - no data received"),
        onUpdate,
      );
    }, timeout);
  }

  resetHeartbeat(onUpdate) {
    if (this.heartbeatTimer) {
      clearTimeout(this.heartbeatTimer);
    }
    this.startHeartbeat(onUpdate);
  }

  handleError(error, onUpdate) {
    console.error("SSE Error:", error);

    if (!this.isManualClose) {
      this.flushPendingData(onUpdate);
      this.disconnect();
      onUpdate({
        status: "error",
        error: error.message || "Connection error occurred",
      });
    }
  }

  disconnect() {
    this.isManualClose = true;

    if (this.heartbeatTimer) {
      clearTimeout(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    if (this.reader) {
      this.reader
        .cancel()
        .catch((e) => console.warn("Reader cancel error:", e));
      this.reader = null;
    }

    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }

    this.reconnectCount = 0;
  }

  getLastEventId() {
    return this.lastEventId;
  }
}
