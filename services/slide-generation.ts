// Slide Generation Frontend Service
// Connects to backend service on port 3004

const SLIDE_API_URL = process.env.NEXT_PUBLIC_SLIDE_API_URL || "http://localhost:3004";

export interface CreateSlideRequest {
  topic: string;
  slideCount: number;
  template: string;
  targetAudience?: string;
  language?: string;
  userId: string;
}

export interface SlideJob {
  id: string;
  status: "outline" | "design" | "content" | "formatting" | "review" | "paused" | "completed" | "failed";
  progress: number;
  currentStep: string;
  slides?: any[];
  error?: string;
}

// Create slide generation job
export const createSlideJob = async (request: CreateSlideRequest): Promise<{ jobId: string } | null> => {
  try {
    const response = await fetch(`${SLIDE_API_URL}/slides`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
    
    const data = await response.json();
    if (data.success) {
      return { jobId: data.jobId };
    }
    return null;
  } catch (error) {
    console.error("Failed to create slide job:", error);
    return null;
  }
};

// Get job status
export const getSlideJobStatus = async (jobId: string): Promise<SlideJob | null> => {
  try {
    const response = await fetch(`${SLIDE_API_URL}/slides/${jobId}`);
    const data = await response.json();
    if (data.success) {
      return data.data;
    }
    return null;
  } catch (error) {
    console.error("Failed to get job status:", error);
    return null;
  }
};

// Subscribe to job progress via SSE
export const subscribeToJobProgress = (
  jobId: string,
  onProgress: (job: SlideJob) => void,
  onError?: (error: Error) => void
): (() => void) => {
  const eventSource = new EventSource(`${SLIDE_API_URL}/slides/${jobId}/stream`);
  
  eventSource.onmessage = (event) => {
    try {
      const job = JSON.parse(event.data);
      onProgress(job);
      
      // Close connection if job is complete
      if (job.status === "completed" || job.status === "failed") {
        eventSource.close();
      }
    } catch (error) {
      console.error("Failed to parse SSE data:", error);
    }
  };
  
  eventSource.onerror = (error) => {
    console.error("SSE error:", error);
    onError?.(new Error("Connection failed"));
    eventSource.close();
  };
  
  // Return cleanup function
  return () => {
    eventSource.close();
  };
};

// Pause job
export const pauseSlideJob = async (jobId: string): Promise<boolean> => {
  try {
    const response = await fetch(`${SLIDE_API_URL}/slides/${jobId}/pause`, {
      method: "POST",
    });
    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error("Failed to pause job:", error);
    return false;
  }
};

// Resume job
export const resumeSlideJob = async (jobId: string): Promise<boolean> => {
  try {
    const response = await fetch(`${SLIDE_API_URL}/slides/${jobId}/resume`, {
      method: "POST",
    });
    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error("Failed to resume job:", error);
    return false;
  }
};

// Get user's jobs
export const getUserSlideJobs = async (userId: string): Promise<SlideJob[]> => {
  try {
    const response = await fetch(`${SLIDE_API_URL}/slides?userId=${userId}`);
    const data = await response.json();
    return data.jobs || [];
  } catch (error) {
    console.error("Failed to get user jobs:", error);
    return [];
  }
};
