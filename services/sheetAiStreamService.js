class SheetAiStreamService {
  constructor() {
    this.eventSource = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectInterval = 1000;
    this.isManuallyDisconnected = false;
    this.conversationId = null;
    this.localConversationId = null;
    this.callbacks = {};
    this.abortController = null;
    this.isStreaming = false;
  }

  async startConversationStream(
    conversationId,
    chatId,
    prompt,
    userEmail,
    callbacks = {},
  ) {
    // Prevent multiple concurrent streams
    if (this.isStreaming) {
      console.warn("Stream already in progress");
      return { success: false, error: "Stream already in progress" };
    }

    this.conversationId = conversationId;
    this.callbacks = callbacks;
    this.isManuallyDisconnected = false;
    this.isStreaming = true;
    this.abortController = new AbortController();

    try {
      // Use fetch with streaming instead of EventSource
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL_WITH_PREFIX}/${process.env.NEXT_PUBLIC_SHEET_REDIRECT_PREFIX}/conversation/create-stream`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            "Content-Type": "application/json",
            Accept: "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive", // Help prevent buffering
          },
          body: JSON.stringify({
            chatId,
            prompt,
            userEmail,
          }),
          signal: this.abortController.signal,
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Handle the streaming response
      await this.handleStreamingResponse(response);

      return { success: true };
    } catch (error) {
      if (error.name === "AbortError") {
        return { success: false, error: "Stream aborted" };
      }

      console.error("Failed to start conversation stream:", error);
      this.callbacks.onError?.(error);
      return { success: false, error: error.message };
    } finally {
      this.isStreaming = false;
    }
  }

  async handleStreamingResponse(response) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      // Signal connection opened
      this.callbacks.onOpen?.();
      this.reconnectAttempts = 0;

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          this.callbacks.onComplete?.({ type: "stream_ended" });
          break;
        }

        // Decode the chunk and add to buffer
        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;

        // Process complete lines immediately to prevent buffering
        let lines = buffer.split("\n");

        // Keep the last incomplete line in buffer
        buffer = lines.pop() || "";

        // Process each complete line
        for (const line of lines) {
          const trimmedLine = line.trim();
          if (trimmedLine === "") continue;

          try {
            this.processLine(trimmedLine);
          } catch (error) {
            console.error(
              "Error processing line:",
              error,
              "Line:",
              trimmedLine,
            );
          }
        }

        // Force a small delay to allow UI updates
        await new Promise((resolve) => setTimeout(resolve, 10));
      }

      // Process any remaining data in buffer
      if (buffer.trim()) {
        try {
          this.processLine(buffer.trim());
        } catch (error) {
          console.error("Error processing final buffer:", error);
        }
      }
    } catch (error) {
      if (error.name === "AbortError") {
        return;
      }

      console.error("Error reading stream:", error);
      this.callbacks.onError?.(error);

      if (!this.isManuallyDisconnected) {
        this.handleReconnect();
      }
    } finally {
      reader.releaseLock();
      this.isStreaming = false;
    }
  }

  processLine(line) {
    if (line.startsWith("data: ")) {
      const data = line.slice(6).trim();

      if (data === "[DONE]") {
        this.callbacks.onComplete?.({ type: "completion" });
        return;
      }

      if (data && data !== "") {
        try {
          const parsedData = JSON.parse(data);
          this.handleMessage(parsedData);
        } catch (parseError) {
          console.error("Failed to parse SSE data:", parseError, "Data:", data);
          this.callbacks.onError?.({
            type: "parse_error",
            error: parseError.message,
            rawData: data,
          });
        }
      }
    } else if (line.startsWith("event: ")) {
      // Handle event type if needed
      const eventType = line.slice(7).trim();
    } else if (line.startsWith("id: ")) {
      // Handle event ID if needed
      const eventId = line.slice(4).trim();
    } else if (line.startsWith("retry: ")) {
      // Handle retry interval
      const retryMs = parseInt(line.slice(7).trim());
      if (!isNaN(retryMs)) {
        this.reconnectInterval = retryMs;
      }
    }
  }

  handleMessage(data) {
    const { type, ...payload } = data;

    // Add timestamp to all messages for tracking
    const messageWithTimestamp = {
      ...data,
      receivedAt: Date.now(),
    };

    switch (type) {
      case "connection":
        this.callbacks.onConnection?.(payload);
        break;

      case "progress":
        // Handle progress updates with different steps
        this.callbacks.onProgress?.(payload);

        // Store local conversation ID for tracking
        if (payload.conversationId && !this.localConversationId) {
          this.localConversationId = payload.conversationId;
        }

        // Call specific step handlers if they exist
        switch (payload.step) {
          case "validation":
            this.callbacks.onValidation?.(payload);
            break;
          case "database_create":
            this.callbacks.onDatabaseCreate?.(payload);
            break;
          case "llm_processing":
            this.callbacks.onLLMProcessing?.(payload);
            break;
          case "formatting":
            this.callbacks.onFormatting?.(payload);
            break;
          case "memory_storage":
            this.callbacks.onMemoryStorage?.(payload);
            break;
          case "database_update":
            this.callbacks.onDatabaseUpdate?.(payload);
            break;
        }
        break;

      case "content":
        // Handle the main content response

        // Store conversation IDs
        if (payload.conversationId) {
          this.conversationId = payload.conversationId;
        }
        if (payload.localConversationId) {
          this.localConversationId = payload.localConversationId;
        }

        this.callbacks.onContent?.(payload);

        // Legacy compatibility - also call onData
        this.callbacks.onData?.(payload);
        break;

      case "completion":
        this.callbacks.onComplete?.(payload);
        this.disconnect();
        break;

      case "error":
        console.error("Stream error:", payload);
        this.callbacks.onError?.(payload);
        break;

      // Legacy handlers for backward compatibility
      case "data":
        this.callbacks.onData?.(payload);
        break;

      case "logs":
        this.callbacks.onLogs?.(payload);
        break;

      case "sheet_update":
        this.callbacks.onSheetUpdate?.(payload);
        break;

      // Handle streaming text content (for partial responses)
      case "text_chunk":
      case "chunk":
        this.callbacks.onTextChunk?.(payload);
        break;

      case "partial_content":
        this.callbacks.onPartialContent?.(payload);
        break;

      default:
        this.callbacks.onMessage?.(messageWithTimestamp);
    }
  }

  handleReconnect() {
    if (
      this.reconnectAttempts < this.maxReconnectAttempts &&
      !this.isManuallyDisconnected
    ) {
      this.reconnectAttempts++;
      const delay =
        this.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1);

      console.warn(
        `Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`,
      );

      setTimeout(() => {
        if (!this.isManuallyDisconnected) {
          this.callbacks.onReconnecting?.();
          // You would need to store the original parameters to reconnect
          // This is a simplified version - you might want to store these params
        }
      }, delay);
    } else {
      this.callbacks.onMaxReconnectAttemptsReached?.();
    }
  }

  disconnect() {
    this.isManuallyDisconnected = true;
    this.isStreaming = false;

    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }

    this.callbacks.onDisconnect?.();
  }

  // Method to stop/cancel a conversation
  async stopConversation(conversationId) {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL_WITH_PREFIX}/${process.env.NEXT_PUBLIC_SHEET_REDIRECT_PREFIX}/conversation/stop/${conversationId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      this.disconnect();
      return result;
    } catch (error) {
      console.error("Failed to stop conversation:", error);
      throw error;
    }
  }

  // Health check method
  async healthCheck() {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL_WITH_PREFIX}/${process.env.NEXT_PUBLIC_SHEET_REDIRECT_PREFIX}/health`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        },
      );

      return await response.json();
    } catch (error) {
      console.error("Health check failed:", error);
      return { success: false, error: error.message };
    }
  }

  // Get connection status
  getConnectionState() {
    if (!this.abortController) return "disconnected";
    if (this.abortController.signal.aborted) return "disconnected";
    if (this.isStreaming) return "streaming";
    return "connected";
  }

  // Get current conversation IDs
  getConversationIds() {
    return {
      conversationId: this.conversationId,
      localConversationId: this.localConversationId,
    };
  }

  // Check if currently streaming
  getIsStreaming() {
    return this.isStreaming;
  }
}

// Singleton instance
const sheetAiStreamService = new SheetAiStreamService();

export default sheetAiStreamService;
