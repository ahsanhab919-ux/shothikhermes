"use client";

import { PresentationMode } from "@/components/presentation/PresentationMode";
import { SlideCard } from "@/components/presentation/SlideCard";
import { usePresentation } from "@/components/slide/context/SlideContextProvider";
import SlidePreviewNavbar from "@/components/slide/SlidePreviewNavbar";
import { Spinner } from "@/components/ui/spinner";
import PresentationAPIService from "@/services/presentation/PresentationApiSlice";
import { parseHistoryData } from "@/utils/presentation/presentationHistoryDataParser";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";

// --- Component that uses useSearchParams ---
function SlidesPreviewContent() {
  const [slidesData, setSlidesData] = useState(null);
  const [slidesLoading, setSlidesLoading] = useState(true);
  const [slidesError, setSlidesError] = useState(null);
  const searchParams = useSearchParams();
  const projectId = searchParams.get("project_id");
  const { isPresentationOpen, closePresentation } = usePresentation();
  const apiServiceRef = useRef(null);

  // Initialize API service
  useEffect(() => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL + "/slide";
    apiServiceRef.current = new PresentationAPIService(baseUrl);
  }, []);

  // Fetch and parse history data
  const fetchSlidesData = useCallback(async () => {
    if (!projectId || !apiServiceRef.current) return;

    try {
      setSlidesError(null);
      // Fetch history data from /logs endpoint
      const rawHistoryData = await apiServiceRef.current.getHistory(projectId);

      // Parse history data using the same parser used elsewhere
      const parsedData = parseHistoryData(rawHistoryData);

      if (!parsedData) {
        throw new Error("Failed to parse history data");
      }

      // Transform slides to match SlideCard expectations
      // SlideCard expects: { body, slide_index, ... }
      // Parsed slides have: { htmlContent, slideNumber, ... }
      const normalizedSlides = (parsedData.slides || []).map((slide) => ({
        ...slide,
        // Map htmlContent to body (SlideCard expects 'body')
        body: slide.htmlContent || slide.html_content || slide.body || "",
        // Map slideNumber to slide_index (SlideCard uses slide_index)
        slide_index:
          slide.slideNumber || slide.slide_number || slide.slide_index || 0,
        // Keep original fields for compatibility
        html_content: slide.htmlContent || slide.html_content,
        htmlContent: slide.htmlContent || slide.html_content,
      }));

      // Construct slidesData object matching the expected structure
      const transformedData = {
        slides: normalizedSlides,
        status: parsedData.presentationStatus || parsedData.status || "unknown",
        title: parsedData.title || "Presentation",
        totalSlides: normalizedSlides.length,
      };

      setSlidesData(transformedData);
    } catch (error) {
      console.error("[SlidesPage] Error fetching slides:", error);
      setSlidesError(error.message || "Failed to load slides");
      setSlidesLoading(false);
    } finally {
      setSlidesLoading(false);
    }
  }, [projectId]);

  // Fetch slides data once on mount
  useEffect(() => {
    if (projectId) {
      setSlidesLoading(true);
      fetchSlidesData();
    }
  }, [projectId, fetchSlidesData]);

  if (slidesLoading && !slidesData) {
    return (
      <>
        <SlidePreviewNavbar slidesData={null} projectId={projectId} />
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-2">
          <Spinner className="text-primary" />
          <p className="text-foreground">Loading slides...</p>
        </div>
      </>
    );
  }

  if (slidesError) {
    return (
      <>
        <SlidePreviewNavbar slidesData={null} projectId={projectId} />
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-2">
          <p className="text-destructive">
            Error loading slides: {slidesError}
          </p>
          <button
            onClick={() => {
              setSlidesError(null);
              setSlidesLoading(true);
              fetchSlidesData();
            }}
            className="text-primary hover:underline"
          >
            Retry
          </button>
        </div>
      </>
    );
  }

  if (!slidesData?.slides || slidesData.slides.length === 0) {
    return (
      <>
        <SlidePreviewNavbar slidesData={slidesData} projectId={projectId} />
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-2">
          <p className="text-foreground">No slides available</p>
        </div>
      </>
    );
  }

  return (
    <>
      <SlidePreviewNavbar slidesData={slidesData} projectId={projectId} />
      <PresentationMode
        slides={slidesData?.slides || []}
        open={isPresentationOpen && slidesData?.slides?.length > 0}
        onClose={closePresentation}
      />
      <div className="bg-muted flex min-h-screen flex-col items-center px-2 py-4">
        <div className="mb-3 w-full max-w-[90vw] sm:max-w-[60vw]">
          <h1 className="mb-2 text-lg font-bold md:text-xl lg:text-2xl">
            Slides Preview
          </h1>
          {slidesData.slides.map((slide, index) => (
            <SlideCard
              key={slide.slide_index || index}
              slide={slide}
              index={index}
              totalSlides={slidesData.slides.length}
            />
          ))}
        </div>
      </div>
    </>
  );
}

// --- Main Page Component ---
export default function SlidesPreviewPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-2">
          <Spinner className="text-primary" />
          <p className="text-foreground">Loading slides...</p>
        </div>
      }
    >
      <SlidesPreviewContent />
    </Suspense>
  );
}
