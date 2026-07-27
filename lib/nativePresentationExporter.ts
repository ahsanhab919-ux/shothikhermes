"use client";

// libs/nativePresentationExporter.ts

import PptxGenJS from "pptxgenjs";
import html2canvas from "html2canvas";

// --- TYPE DEFINITIONS ---
interface SlideData {
  slide_index: number;
  body: string;
}

interface ExportOptions {
  fileName?: string;
}

// --- HELPER FUNCTIONS ---

const pxToPt = (px: number): number => px * 0.75;
const pxToInches = (px: number): number => px / 96;

const parseColor = (colorStr: string): string => {
  if (
    !colorStr ||
    colorStr === "transparent" ||
    colorStr.includes("rgba(0, 0, 0, 0)")
  ) {
    return "";
  }
  const ctx = document.createElement("canvas").getContext("2d");
  if (!ctx) return "000000";
  ctx.fillStyle = colorStr;
  return ctx.fillStyle.substring(1);
};

const captureElementAsImage = async (element: HTMLElement): Promise<string> => {
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: null,
    logging: false,
  });
  return canvas.toDataURL("image/png", 1.0);
};

/**
 * **RELIABLE CHART INTERCEPTION SCRIPT**
 * This script is injected into the iframe to monkey-patch Chart.js.
 * It intercepts the chart configuration object upon creation and stores it on the canvas element.
 */
const chartInterceptorScript = `
  const originalChart = window.Chart;
  window.Chart = function(context, config) {
    const canvasElement = context.canvas;
    if (canvasElement) {
      canvasElement.__chartConfig = JSON.parse(JSON.stringify(config, (key, value) => 
        typeof value === 'function' ? 'function' : value
      ));
    }
    return new originalChart(context, config);
  };
  Object.assign(window.Chart, originalChart);
`;

const createRenderIframe = (htmlBody: string): Promise<HTMLIFrameElement> => {
  return new Promise((resolve, reject) => {
    const iframe = document.createElement("iframe");
    iframe.style.position = "absolute";
    iframe.style.left = "-9999px";
    iframe.style.top = "0";
    iframe.style.width = "1280px";
    iframe.style.height = "720px";
    iframe.style.border = "0";

    document.body.appendChild(iframe);

    iframe.onload = () => {
      const doc = iframe.contentWindow?.document;
      if (!doc) {
        reject(new Error("Could not access iframe document."));
        return;
      }
      doc.open();
      // Inject the chart interceptor BEFORE writing the rest of the body
      doc.write(`<script>${chartInterceptorScript}<\/script>`);
      doc.write(htmlBody);
      doc.close();

      setTimeout(() => {
        doc.fonts.ready
          .then(() => setTimeout(() => resolve(iframe), 1000))
          .catch((err) => {
            console.warn("Font loading check failed.", err);
            resolve(iframe);
          });
      }, 500);
    };

    iframe.onerror = (err) =>
      reject(new Error(`Iframe failed to load: ${err}`));
    iframe.src = "about:blank";
  });
};

// --- CORE RENDERING ENGINE ---

/**
 * **IMPROVED TEXT PROCESSOR**
 * Processes a node and its children to generate an array of formatted text runs.
 * This correctly handles nested styles (e.g., <strong> inside a <p>).
 */
function processTextNode(
  node: Node,
  defaultStyle: CSSStyleDeclaration,
): PptxGenJS.TextProps[] {
  let textRuns: PptxGenJS.TextProps[] = [];

  if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
    textRuns.push({
      text: node.textContent,
      options: {
        fontFace: defaultStyle.fontFamily
          .split(",")[0]
          .trim()
          .replace(/"/g, ""),
        fontSize: pxToPt(parseFloat(defaultStyle.fontSize)),
        color: parseColor(defaultStyle.color),
        bold: parseInt(defaultStyle.fontWeight) >= 600,
        italic: defaultStyle.fontStyle === "italic",
      },
    });
  } else if (node.nodeType === Node.ELEMENT_NODE) {
    const element = node as HTMLElement;
    const elementStyle = window.getComputedStyle(element);

    for (const child of Array.from(element.childNodes)) {
      textRuns = textRuns.concat(processTextNode(child, elementStyle));
    }
  }
  return textRuns;
}

async function renderNodeToPptx(
  node: Element,
  slide: PptxGenJS.Slide,
  slideRect: DOMRect,
) {
  if (!(node instanceof HTMLElement)) return;

  const style = window.getComputedStyle(node);
  const rect = node.getBoundingClientRect();

  if (
    style.display === "none" ||
    style.visibility === "hidden" ||
    node.tagName === "SCRIPT" ||
    node.tagName === "STYLE" ||
    rect.width <= 1 ||
    rect.height <= 1 ||
    node.classList.contains("glass-orb")
  ) {
    return;
  }

  const relRect = {
    x: rect.left - slideRect.left,
    y: rect.top - slideRect.top,
    w: rect.width,
    h: rect.height,
  };

  const nodeTag = node.tagName.toUpperCase();
  let stopRecursion = false;

  // Handle Text Elements (Corrected Logic)
  if (["H1", "H2", "P", "BLOCKQUOTE", "LI", "SPAN"].includes(nodeTag)) {
    const textRuns = processTextNode(node, style);
    if (textRuns.length > 0) {
      slide.addText(textRuns, {
        x: pxToInches(relRect.x),
        y: pxToInches(relRect.y),
        w: pxToInches(relRect.w),
        h: pxToInches(relRect.h),
        align: style.textAlign as any,
        valign: style.display === "flex" ? "middle" : "top",
      });
      stopRecursion = true;
    }
  }

  // Handle DIVs as Shapes
  else if (nodeTag === "DIV") {
    const bgColor = parseColor(style.backgroundColor);
    if (bgColor) {
      slide.addShape(PptxGenJS.shapes.RECTANGLE, {
        x: pxToInches(relRect.x),
        y: pxToInches(relRect.y),
        w: pxToInches(relRect.w),
        h: pxToInches(relRect.h),
        fill: { color: bgColor },
      });
    }
  }

  // Handle Icons (Rasterize as fallback)
  else if (nodeTag === "I" && node.className.includes("fa-")) {
    const imageData = await captureElementAsImage(node);
    slide.addImage({
      data: imageData,
      x: pxToInches(relRect.x),
      y: pxToInches(relRect.y),
      w: pxToInches(relRect.w),
      h: pxToInches(relRect.h),
    });
    stopRecursion = true;
  }

  // Handle Canvas/Charts (Corrected Logic)
  else if (nodeTag === "CANVAS") {
    const chartConfig = (node as any).__chartConfig;
    let nativeChartRendered = false;

    if (chartConfig) {
      console.log(
        "Native Chart Export: Found chart config, attempting to render.",
        chartConfig,
      );
      try {
        const chartData = chartConfig.data.datasets.map((ds: any) => ({
          name: ds.label,
          labels: chartConfig.data.labels,
          values: ds.data,
        }));
        const chartType = ((configType) => {
          switch (configType) {
            case "bar":
              return PptxGenJS.charts.BAR;
            case "line":
              return PptxGenJS.charts.LINE;
            case "pie":
              return PptxGenJS.charts.PIE;
            default:
              return PptxGenJS.charts.BAR;
          }
        })(chartConfig.type);

        slide.addChart(chartType, chartData, {
          x: pxToInches(relRect.x),
          y: pxToInches(relRect.y),
          w: pxToInches(relRect.w),
          h: pxToInches(relRect.h),
          barDir: chartConfig.options?.indexAxis === "y" ? "bar" : "col",
          showLegend: chartConfig.options?.plugins?.legend?.display ?? false,
          title: chartConfig.options?.plugins?.title?.text ?? "",
        });
        nativeChartRendered = true;
      } catch (e) {
        console.error(
          "Native Chart Export: Failed to parse or render native chart, falling back to image.",
          e,
        );
      }
    }

    if (!nativeChartRendered) {
      console.warn(
        "Native Chart Export: No config found or native render failed. Falling back to image capture.",
      );
      const imageData = await captureElementAsImage(node);
      slide.addImage({
        data: imageData,
        x: pxToInches(relRect.x),
        y: pxToInches(relRect.y),
        w: pxToInches(relRect.w),
        h: pxToInches(relRect.h),
      });
    }
    stopRecursion = true;
  }

  if (!stopRecursion) {
    for (const child of Array.from(node.children)) {
      await renderNodeToPptx(child, slide, slideRect);
    }
  }
}

/**
 * Main export function to generate a native-object PowerPoint presentation.
 */
export const handleNativePptxExport = async (
  slidesData: SlideData[],
  options: ExportOptions = {},
): Promise<{ success: boolean; error?: string }> => {
  if (!slidesData || slidesData.length === 0) {
    return { success: false, error: "No slides available to export." };
  }

  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_16x9";

  try {
    for (const slideData of slidesData) {
      let iframe: HTMLIFrameElement | null = null;
      try {
        iframe = await createRenderIframe(slideData.body);
        const doc = iframe.contentWindow!.document;
        const slideContainer = doc.querySelector(
          ".slide-container",
        ) as HTMLElement;
        const slideRoot = doc.querySelector(".slide") as HTMLElement;
        if (!slideContainer || !slideRoot)
          throw new Error(
            `Slide ${slideData.slide_index}: .slide-container or .slide not found.`,
          );

        const pptxSlide = pptx.addSlide();
        const slideRect = slideContainer.getBoundingClientRect();
        const slideRootStyle = window.getComputedStyle(slideRoot);

        if (slideRootStyle.backgroundImage.includes("gradient")) {
          console.log(
            `Slide ${slideData.slide_index}: Complex background detected, capturing as image.`,
          );
          const bgImageData = await captureElementAsImage(slideRoot);
          pptxSlide.addImage({
            data: bgImageData,
            x: 0,
            y: 0,
            w: "100%",
            h: "100%",
          });

          const contentWrapper =
            slideRoot.querySelector(".quote-wrapper") ||
            slideRoot.querySelector(".content-wrapper");
          if (contentWrapper) {
            await renderNodeToPptx(contentWrapper, pptxSlide, slideRect);
          }
        } else {
          pptxSlide.background = {
            color: parseColor(slideRootStyle.backgroundColor),
          };
          await renderNodeToPptx(slideRoot, pptxSlide, slideRect);
        }
      } finally {
        if (iframe) document.body.removeChild(iframe);
      }
    }

    await pptx.writeFile({
      fileName: options.fileName || "presentation-native.pptx",
    });
    return { success: true };
  } catch (error) {
    console.error("An error occurred during Native PPTX export:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred.";
    return { success: false, error: errorMessage };
  }
};
