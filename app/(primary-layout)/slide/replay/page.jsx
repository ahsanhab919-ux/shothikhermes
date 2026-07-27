"use client";

import ChatArea from "@/components/presentation/ChatArea";
import PreviewPanel from "@/components/presentation/PreviewPanel";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function SlideReplay() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const [slides, setSlides] = useState([]);
  const [title, setTitle] = useState(null);
  const [status, setStatus] = useState("idle");
  const [slideDataLoading, setSlideDataLoading] = useState(false);
  const [totalSlides, setTotalSlides] = useState(0);

  const [logsStatus, setLogsStatus] = useState("processing");
  const [logsData, setLogsData] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const chatEndRef = useRef(null);

  const [previewOpen, setPreviewOpen] = useState(false);

  const [simulationCompleted, setSimulationCompleted] = useState(false);

  const [showModal, setShowModal] = useState(false);

  const handlePreviewOpen = () => setPreviewOpen(true);
  const handlePreviewClose = () => setPreviewOpen(false);

  useEffect(() => {
    runSlideSimulation(
      setSlides,
      setStatus,
      setSlideDataLoading,
      setTitle,
      setTotalSlides,
      id,
    );
    runLogsSimulation(
      setLogsData,
      setLogsStatus,
      setLogsLoading,
      id,
      setSimulationCompleted,
    );
  }, []);

  //   
  //   

  return (
    <div
      className={cn(
        "bg-background text-foreground flex flex-col overflow-hidden",
        "h-[90dvh] lg:h-[calc(100dvh-70px)]",
      )}
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {/* Mobile Layout */}
        <div className="flex flex-1 flex-col overflow-hidden lg:hidden">
          <div className="flex flex-1 flex-col overflow-hidden">
            <ChatArea
              currentAgentType={"slides"}
              chatHistory={[]}
              realLogs={logsData}
              isLoading={logsLoading}
              currentPhase={"planning"}
              completedPhases={[]}
              logsData={{ data: logsData, status: logsStatus }}
              chatEndRef={chatEndRef}
              inputValue={""}
              status={logsStatus}
              hideInputField={true}
              simulationCompleted={simulationCompleted}
              setShowModal={setShowModal}
              showModal={showModal}
              // these are for preview panel on mobile devices
              handlePreviewOpen={handlePreviewOpen}
              slides={slides}
            />
          </div>
        </div>

        <Dialog open={previewOpen} onOpenChange={handlePreviewClose}>
          <DialogContent
            className={cn(
              "relative h-[80vh] max-h-[80vh] overflow-hidden p-0",
              "max-w-[calc(100vw-2rem)]",
            )}
          >
            <PreviewPanel
              currentAgentType="presentation"
              slidesData={{
                data: slides,
                status: status,
                title: title || "Generating...",
                totalSlide: totalSlides || 0,
              }}
              slidesLoading={slideDataLoading}
              presentationId={"ahsdkjasfhkja"}
              title={title || "Generating..."}
            />
          </DialogContent>
        </Dialog>

        {/* Desktop Layout */}
        <div className="hidden min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid lg:grid-cols-2">
          <div className="flex min-h-0 flex-col overflow-hidden">
            <ChatArea
              currentAgentType={"slides"}
              chatHistory={[]}
              realLogs={logsData}
              isLoading={logsLoading}
              currentPhase={"planning"}
              completedPhases={[]}
              logsData={{ data: logsData, status: logsStatus }}
              chatEndRef={chatEndRef}
              inputValue={""}
              status={logsStatus}
              hideInputField={true}
              simulationCompleted={simulationCompleted}
              setShowModal={setShowModal}
              showModal={showModal}
            />
          </div>
          <div className="flex min-h-0 flex-col overflow-hidden">
            <PreviewPanel
              currentAgentType="presentation"
              slidesData={{
                data: slides,
                status: status,
                title: title || "Generating...",
                totalSlide: totalSlides || 0,
              }}
              slidesLoading={slideDataLoading}
              presentationId={"ahsdkjasfhkja"}
              title={title || "Generating..."}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

async function runSlideSimulation(
  setSlides,
  setStatus,
  setSlideDataLoading,
  setTitle,
  setTotalSlides,
  slideId,
) {
  const abortController = new AbortController();

  try {
    setStatus("processing");
    setSlideDataLoading(true);

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/${process.env.NEXT_PUBLIC_SLIDE_REDIRECT_PREFIX}/simulation_slides/${slideId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        signal: abortController.signal,
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error (${response.status}): ${errorText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (!line.trim()) continue;

        try {
          const data = JSON.parse(line);

          // Store slides in state
          if (data.slides) {
            setSlides((prev) => [...prev, data.slides]);
          }

          if (data.title) {
            setTitle(data.title);
          }

          if (data.total_slides) {
            setTotalSlides(data?.total_slides);
          }

          if (data.status === "completed") {
            // Watch for completion
            setStatus("completed");
            setSlideDataLoading(false);
            abortController.abort();
            return; // Stop reading
          }
        } catch (err) {
        }
      }
    }
  } catch (error) {
    setStatus("error");
    setSlideDataLoading(false);
    abortController.abort();
  }
}

async function runLogsSimulation(
  setLogsData,
  setLogsStatus,
  setLogsLoading,
  slideId,
  setSimulationCompleted,
) {
  const abortController = new AbortController();

  setLogsStatus("processing");
  setLogsLoading(true);

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/${process.env.NEXT_PUBLIC_SLIDE_REDIRECT_PREFIX}/simulation-logs/${slideId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        signal: abortController.signal,
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error (${response.status}): ${errorText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (!line.trim()) continue;

        try {
          const data = JSON.parse(line);
          //   
          // Store slides in state
          if (data.logs) {
            setLogsData((prev) => [...prev, data.logs]);
          }

          //   // Watch for completion
          if (data.status === "completed") {
            setLogsStatus("completed");
            setLogsLoading(false);
            setSimulationCompleted(true);
            abortController.abort();
            return; // Stop reading
          }
        } catch (err) {
        }
      }
    }
  } catch (error) {
    setLogsStatus("failed");
    setLogsLoading(false);
  }
}
