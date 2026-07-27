// libs/pdfPresentationExporter.ts

import html2canvas from "html2canvas";

interface SlideData {
  slide_index: number;
  body: string;
  title?: string;
}

interface PDFExportOptions {
  fileName?: string;
  format?: "a4" | "letter" | "presentation"; // presentation = 16:9 aspect ratio
  orientation?: "landscape" | "portrait";
  quality?: number; // 0.1 to 1.0
  margin?: number; // margin in mm
}

/**
 * Creates a hidden iframe to render the slide's HTML content safely.
 * @param htmlBody - The HTML string for a single slide.
 * @returns A promise that resolves with the iframe element once it's fully loaded.
 */
const createRenderIframe = (htmlBody: string): Promise<HTMLIFrameElement> => {
  return new Promise((resolve, reject) => {
    const iframe = document.createElement("iframe");

    // Style the iframe to be hidden but have the correct dimensions for rendering
    iframe.style.position = "absolute";
    iframe.style.left = "-9999px";
    iframe.style.top = "0";
    iframe.style.width = "1280px"; // Standard 16:9 aspect ratio
    iframe.style.height = "720px";
    iframe.style.border = "0";

    document.body.appendChild(iframe);

    iframe.onload = () => {
      const doc = iframe.contentWindow?.document;
      if (!doc) {
        reject(new Error("Could not access iframe document."));
        return;
      }

      // Write the HTML body into the iframe
      doc.open();
      doc.write(htmlBody);
      doc.close();

      // Give the browser time to process scripts and styles
      setTimeout(() => {
        doc.fonts.ready
          .then(() => {
            setTimeout(() => {
              resolve(iframe);
            }, 1000);
          })
          .catch((err) => {
            console.warn("Font loading check failed, proceeding anyway.", err);
            resolve(iframe);
          });
      }, 500);
    };

    iframe.onerror = (err) => {
      reject(new Error(`Iframe failed to load: ${err}`));
    };

    iframe.src = "about:blank";
  });
};

/**
 * Captures a screenshot of the given HTML element using html2canvas.
 * @param element - The HTML element to capture.
 * @param quality - Image quality (0.1 to 1.0)
 * @returns A promise that resolves with a base64 encoded image data.
 */
const captureElementAsImage = async (
  element: HTMLElement,
  quality: number = 0.92,
): Promise<string> => {
  const canvas = await html2canvas(element, {
    scale: 2, // High resolution for crisp PDF output
    useCORS: true,
    allowTaint: true,
    backgroundColor: "#ffffff",
    logging: false,
  });

  return canvas.toDataURL("image/jpeg", quality);
};

/**
 * Calculate PDF dimensions based on format and orientation
 */
const getPDFDimensions = (format: string, orientation: string) => {
  const formats = {
    a4: { width: 210, height: 297 },
    letter: { width: 216, height: 279 },
    presentation: { width: 297, height: 167 }, // 16:9 aspect ratio in landscape
  };

  const dimensions =
    formats[format as keyof typeof formats] || formats.presentation;

  if (orientation === "portrait" && format !== "presentation") {
    return { width: dimensions.height, height: dimensions.width };
  }

  return dimensions;
};

/**
 * Main PDF export function
 */
export const handlePDFExport = async (
  slidesData: SlideData[],
  options: PDFExportOptions = {},
): Promise<{ success: boolean; message?: string; error?: string }> => {
  if (!slidesData || slidesData.length === 0) {
    return { success: false, error: "No slides available to export." };
  }

  const {
    fileName = "presentation.pdf",
    format = "presentation",
    orientation = "landscape",
    quality = 0.92,
    margin = 10,
  } = options;

  try {
    // Get PDF dimensions
    const { width: pageWidth, height: pageHeight } = getPDFDimensions(
      format,
      orientation,
    );

    const { default: jsPDF } = await import("jspdf");

    const pdf = new jsPDF({
      orientation: orientation as "landscape" | "portrait",
      unit: "mm",
      format:
        format === "presentation" ? [pageWidth, pageHeight] : (format as any),
    });

    // Calculate image dimensions with margins
    const imageWidth = pageWidth - margin * 2;
    const imageHeight = pageHeight - margin * 2;

    for (let i = 0; i < slidesData.length; i++) {
      const slide = slidesData[i];
      let iframe: HTMLIFrameElement | null = null;

      try {
        // Create iframe and render the slide HTML
        iframe = await createRenderIframe(slide.body);
        const container = iframe.contentWindow?.document.querySelector(
          ".slide-container",
        ) as HTMLElement;

        if (!container) {
          throw new Error(
            `Slide ${slide.slide_index}: .slide-container element not found.`,
          );
        }

        // Capture the slide as image
        const imageDataUri = await captureElementAsImage(container, quality);

        // Add new page for each slide (except the first one)
        if (i > 0) {
          pdf.addPage();
        }

        // Add slide number as header (optional)
        pdf.setFontSize(8);
        pdf.setTextColor(128, 128, 128);
        pdf.text(
          `Slide ${i + 1} of ${slidesData.length}`,
          pageWidth - margin,
          margin - 2,
          { align: "right" },
        );

        // Add the image to PDF
        pdf.addImage(
          imageDataUri,
          "JPEG",
          margin,
          margin,
          imageWidth,
          imageHeight,
          `slide-${i + 1}`,
          "FAST",
        );

        // Optional: Add slide title as footer if available
        if (slide.title) {
          pdf.setFontSize(10);
          pdf.setTextColor(64, 64, 64);
          pdf.text(slide.title, margin, pageHeight - margin + 5);
        }
      } finally {
        // Clean up iframe
        if (iframe) {
          document.body.removeChild(iframe);
        }
      }
    }

    // Add metadata
    pdf.setProperties({
      title: "Presentation Export",
      subject: "Slides exported to PDF",
      creator: "Slide Export Tool",
      keywords: "presentation, slides, pdf",
    });

    // Save the PDF
    pdf.save(fileName);

    return {
      success: true,
      message: `PDF exported successfully with ${slidesData.length} slides!`,
    };
  } catch (error) {
    console.error("PDF export error:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "An unknown error occurred during PDF export.";
    return { success: false, error: errorMessage };
  }
};
