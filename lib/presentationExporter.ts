// /libs/presentationExporter.ts

import html2canvas from "html2canvas";
// Dynamically import pptxgenjs to avoid server-side rendering issues in Next.js
import PptxGenJS from "pptxgenjs";

interface SlideData {
  slide_index: number;
  body: string; // This is the full HTML content of the slide
  title?: string;
}

interface ExportOptions {
  fileName?: string;
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
    iframe.style.left = "-9999px"; // Position off-screen
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

      // Write the HTML body into the iframe. This includes all <style> and <script> tags.
      doc.open();
      doc.write(htmlBody);
      doc.close();

      // Give the browser a moment to process scripts (like Chart.js) and styles
      setTimeout(() => {
        // Wait for fonts inside the iframe to be ready
        doc.fonts.ready
          .then(() => {
            // Additional small delay for things like chart animations to complete
            setTimeout(() => {
              resolve(iframe);
            }, 1000); // 1 second for animations
          })
          .catch((err) => {
            console.warn("Font loading check failed, proceeding anyway.", err);
            // Still resolve, but the fonts might not be perfect
            resolve(iframe);
          });
      }, 500); // 500ms for initial script execution
    };

    iframe.onerror = (err) => {
      reject(new Error(`Iframe failed to load: ${err}`));
    };

    // Setting src to 'about:blank' is necessary to trigger the onload event
    iframe.src = "about:blank";
  });
};

/**
 * Captures a screenshot of the given HTML element using html2canvas.
 * @param element - The HTML element to capture.
 * @returns A promise that resolves with a base64 encoded PNG image data URI.
 */
const captureElementAsImage = async (element: HTMLElement): Promise<string> => {
  const canvas = await html2canvas(element, {
    scale: 2, // Capture at 2x resolution for high quality
    useCORS: true, // Important for loading external resources like fonts or images
    allowTaint: true,
    backgroundColor: "#121212", // Specify a default background
    logging: false, // Disable verbose logging
  });
  return canvas.toDataURL("image/png", 1.0);
};

/**
 * The main export function. It takes slide data, renders each slide in a hidden
 * iframe, captures it as an image, and adds it to a PPTX presentation.
 */
export const handleAdvancedPptxExport = async (
  slidesData: SlideData[],
  options: ExportOptions = {},
): Promise<{ success: boolean; message?: string; error?: string }> => {
  if (!slidesData || slidesData.length === 0) {
    return { success: false, error: "No slides available to export." };
  }

  // Initialize the presentation
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_16x9";

  try {
    for (const slide of slidesData) {
      let iframe: HTMLIFrameElement | null = null;
      try {
        // 1. Create iframe and render the slide HTML
        iframe = await createRenderIframe(slide.body);
        const container = iframe.contentWindow?.document.querySelector(
          ".slide-container",
        ) as HTMLElement;
        if (!container) {
          throw new Error(
            `Slide ${slide.slide_index}: .slide-container element not found.`,
          );
        }

        // 2. Capture the rendered slide as an image
        const imageDataUri = await captureElementAsImage(container);

        // 3. Add a new slide to the presentation and add the image to it
        const pptxSlide = pptx.addSlide();
        pptxSlide.addImage({
          data: imageDataUri,
          x: 0,
          y: 0,
          w: "100%",
          h: "100%",
        });
      } finally {
        // 4. Important: Clean up the iframe from the DOM
        if (iframe) {
          document.body.removeChild(iframe);
        }
      }
    }

    // 5. Save the presentation
    await pptx.writeFile({ fileName: options.fileName || "presentation.pptx" });

    return { success: true, message: "Presentation exported successfully!" };
  } catch (error) {
    console.error("An error occurred during PPTX export:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred.";
    return { success: false, error: errorMessage };
  }
};
