// generateAiDetectorPDF.js
import pdfMake from "pdfmake/build/pdfmake";
import {
  countCharacters,
  countWords,
  createColorLegend,
  createSentencesTable,
  formatDisplayDate,
  formatHighlightedText,
  formatTimestamp,
  generateCircularChartImage,
  getFullText,
} from "./pdfHelper";
import { pageConfig, pdfStyles } from "./pdfStyles";

// Register base vfs (from vfs_fonts import)
pdfMake.vfs = pdfMake.vfs || {};

/* ---------------------------
   Helpers: font injection + detection
   --------------------------- */

// Convert ArrayBuffer -> base64 safely (chunked)
function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = "";
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, chunk);
  }
  return btoa(binary);
}

/**
 * Try to load Bengali fonts from /fonts/ and inject into pdfMake.vfs.
 * Returns a mapping object usable by pdfMake.fonts, e.g. { NotoSansBengali: { normal: 'NotoSansBengali.ttf', ... } }
 *
 * Place TTFs in your public/static /fonts/ path:
 *   /fonts/NotoSansBengali-Regular.ttf
 *   /fonts/SolaimanLipi.ttf
 *   /fonts/Kalpurush.ttf
 */
const loadBengaliFontForPDFMake = async (pdfMakeInstance) => {
  if (!pdfMakeInstance) pdfMakeInstance = window.pdfMake;
  if (!pdfMakeInstance)
    throw new Error("pdfMake not available for font loading");

  pdfMakeInstance.vfs = pdfMakeInstance.vfs || {};
  const fontsMapping = {};

  // Ordered preference — try each until one loads
  const fontCandidates = {
    NotoSansBengali: "/fonts/NotoSansBengali-Regular.ttf",
    SolaimanLipi: "/fonts/SolaimanLipi.ttf",
    Kalpurush: "/fonts/Kalpurush.ttf",
  };

  for (const [family, url] of Object.entries(fontCandidates)) {
    try {
      const resp = await fetch(url);
      if (!resp.ok) {
        // skip and try next
        continue;
      }
      const buf = await resp.arrayBuffer();
      const base64 = arrayBufferToBase64(buf);
      const fileName = `${family}.ttf`;

      // inject if not already present
      if (!pdfMakeInstance.vfs[fileName]) {
        pdfMakeInstance.vfs[fileName] = base64;
      }

      fontsMapping[family] = {
        normal: fileName,
        bold: fileName,
        italics: fileName,
        bolditalics: fileName,
      };

      // stop after first successful font to keep bundle small; comment out `break` to load all
      break;
    } catch (err) {
      // try next font
      continue;
    }
  }

  return fontsMapping;
};

/**
 * Ensure Roboto mapping exists (reconstruct from vfs if possible; otherwise alias to an available TTF)
 * Returns true when Roboto mapping was created/available, false otherwise.
 */
function ensureRoboto(pdfMakeInstance) {
  pdfMakeInstance.fonts = pdfMakeInstance.fonts || {};
  pdfMakeInstance.vfs = pdfMakeInstance.vfs || {};

  if (
    pdfMakeInstance.fonts.Roboto &&
    typeof pdfMakeInstance.fonts.Roboto.normal === "string" &&
    pdfMakeInstance.vfs[pdfMakeInstance.fonts.Roboto.normal]
  ) {
    return true;
  }

  const robotoFiles = {
    normal: "Roboto-Regular.ttf",
    bold: "Roboto-Medium.ttf",
    italics: "Roboto-Italic.ttf",
    bolditalics: "Roboto-MediumItalic.ttf",
  };

  const hasAllRoboto = Object.values(robotoFiles).every(
    (fn) => !!pdfMakeInstance.vfs[fn],
  );
  if (hasAllRoboto) {
    pdfMakeInstance.fonts.Roboto = { ...robotoFiles };
    return true;
  }

  // fallback: if any TTF exists in vfs alias Roboto -> that file
  const vfsTtfKeys = Object.keys(pdfMakeInstance.vfs || {}).filter((k) =>
    k.toLowerCase().endsWith(".ttf"),
  );
  if (vfsTtfKeys.length > 0) {
    const pick = vfsTtfKeys[0];
    pdfMakeInstance.fonts.Roboto = {
      normal: pick,
      bold: pick,
      italics: pick,
      bolditalics: pick,
    };
    return true;
  }

  return false;
}

// Simple Bengali detection (Unicode range)
function containsBengaliText(text) {
  return /[\u0980-\u09FF\u200C\u200D]/.test(text);
}

/* ---------------------------
   Main PDF generation
   --------------------------- */

export const generateAiDetectorPDF = async (
  outputContend,
  logoDataUrl = null,
) => {
  try {
    // Chart image
    const chartImage = await generateCircularChartImage(
      outputContend.ai_percentage,
    );

    // Full text + stats
    const fullText = getFullText(outputContend.sentences);
    const wordCount = countWords(fullText);
    const charCount = countCharacters(fullText);
    const sentenceCount = outputContend.sentences.length;
    const scanDate = formatDisplayDate();

    // ---------- FONT LOADING ----------
    // Attempt to load Bengali fonts and register them
    let bengaliFonts = {};
    try {
      bengaliFonts = await loadBengaliFontForPDFMake(pdfMake);
      // merge into pdfMake.fonts
      pdfMake.fonts = {
        ...(pdfMake.fonts || {}),
        ...(bengaliFonts || {}),
      };
    } catch (fontErr) {
      console.warn("Bengali font load failed:", fontErr);
    }

    // Ensure Roboto fallback exists (reconstruct/alias from vfs if needed)
    const robotoOk = ensureRoboto(pdfMake);
    if (!robotoOk) {
      // if Roboto can't be built but we loaded a bengali font, alias Roboto to it
      const bengaliFirst = Object.keys(bengaliFonts || {})[0];
      if (bengaliFirst && pdfMake.fonts[bengaliFirst]) {
        pdfMake.fonts.Roboto = pdfMake.fonts[bengaliFirst];
        console.warn(`Roboto not available; aliased Roboto -> ${bengaliFirst}`);
      }
    }

    // Choose font based on content
    const hasBengali = containsBengaliText(fullText);
    const bengaliFontName = Object.keys(bengaliFonts || {})[0] || null;
    const defaultEnglishFont = "Roboto";
    const chosenFont =
      hasBengali && bengaliFontName ? bengaliFontName : defaultEnglishFont;

    // ---------- DOC DEFINITION (same as before but set defaultStyle.font) ----------
    const docDefinition = {
      ...pageConfig,

      header: (currentPage) => {
        if (currentPage === 1) {
          return {
            columns: [
              {
                width: "auto",
                stack: [
                  logoDataUrl
                    ? {
                        image: logoDataUrl,
                        width: 120,
                        margin: [40, 12, 0, 0],
                        alignment: "left",
                      }
                    : { text: "" },
                  {
                    text: "AI Detection Report",
                    fontSize: 16,
                    bold: true,
                    color: "#637381",
                    margin: [40, 8, 0, 0],
                    alignment: "left",
                  },
                ],
              },
              { width: "*", text: "" }, // filler column to keep the logo+title on the left
            ],
            margin: [0, 0, 0, 10],
          };
        }
        return null;
      },

      footer: (currentPage, pageCount) => {
        return {
          columns: [
            {
              text: `Generated by Shothik AI | ${scanDate}`,
              style: "footer",
              alignment: "left",
              margin: [40, 0, 0, 0],
            },
            {
              text: `Page ${currentPage} of ${pageCount}`,
              style: "footer",
              alignment: "right",
              margin: [0, 0, 40, 0],
            },
          ],
        };
      },

      content: [
        { text: "Results", style: "subheader", margin: [0, 20, 0, 15] },

        {
          image: chartImage,
          width: 150,
          alignment: "center",
          margin: [0, 0, 0, 15],
        },

        {
          text: [
            { text: "We are ", style: "bodyText" },
            { text: "highly confident ", style: "bodyText", bold: true },
            { text: "this text is", style: "bodyText" },
          ],
          alignment: "center",
          margin: [0, 0, 0, 10],
        },

        {
          text: outputContend.assessment,
          style: "badge",
          background: "#7c3aed1a",
          margin: [0, 0, 0, 15],
        },

        {
          table: {
            widths: ["*", "*", "*"],
            body: [
              [
                {
                  stack: [
                    { text: "AI Probability", style: "statsLabel" },
                    {
                      text: `${parseInt(outputContend.ai_percentage)}%`,
                      style: "statsValue",
                      color:
                        outputContend.ai_percentage > 50
                          ? "#f5c33b"
                          : "#10b91d",
                    },
                  ],
                  alignment: "center",
                },
                {
                  stack: [
                    { text: "Word Count", style: "statsLabel" },
                    { text: wordCount.toString(), style: "statsValue" },
                  ],
                  alignment: "center",
                },
                {
                  stack: [
                    { text: "Sentences", style: "statsLabel" },
                    { text: sentenceCount.toString(), style: "statsValue" },
                  ],
                  alignment: "center",
                },
              ],
            ],
          },
          layout: "noBorders",
          margin: [0, 10, 0, 20],
        },

        // createColorLegend(),

        // {
        //   columns: [
        //     {
        //       text: "AI",
        //       style: "legendText",
        //       bold: true,
        //       color: "#f5c33b",
        //       alignment: "left",
        //     },
        //     {
        //       text: "Human",
        //       style: "legendText",
        //       bold: true,
        //       color: "#10b91d",
        //       alignment: "right",
        //     },
        //   ],
        //   margin: [0, 0, 0, 20],
        // },

        // { text: "Analyzed Text", style: "sectionTitle", pageBreak: "before" },
        {
          // Keep legend + title together so the title doesn't get orphaned at the bottom of a page.
          // If there's room, the analyzed text that follows will start on the same page.
          stack: [
            { text: "Enhanced Sentence Detection", style: "sectionTitle" },
            {
              text: "Sentences are highlighted based on their probability of being AI or human-written.",
              style: "bodyText",
              margin: [0, 0, 0, 10],
            },
            createColorLegend(),
            {
              columns: [
                {
                  text: "AI",
                  style: "legendText",
                  bold: true,
                  color: "#f5c33b",
                  alignment: "left",
                },
                {
                  text: "Human",
                  style: "legendText",
                  bold: true,
                  color: "#10b91d",
                  alignment: "right",
                },
              ],
              margin: [0, 8, 0, 12],
            },
            {
              text: "Analyzed Text",
              style: "sectionTitle",
              margin: [0, 6, 0, 8], // spacing after the legend and before the analyzed text
            },
          ],
          unbreakable: true, // keep legend + title together (prevents title orphaning)
        },
        {
          text: formatHighlightedText(outputContend.sentences),
          style: "sentenceText",
          margin: [0, 0, 0, 20],
          lineHeight: 1.6,
        },

        ...(outputContend.aiSentences && outputContend.aiSentences.length > 0
          ? [
              {
                text: "Top Sentences Driving AI Probability",
                style: "sectionTitle",
                pageBreak:
                  outputContend.sentences.length > 500 ? "before" : undefined,
              },
              {
                text: `These ${Math.min(outputContend.aiSentences.length, 7)} sentences have the highest probability of being AI-generated.`,
                style: "bodyText",
                margin: [0, 0, 0, 10],
              },
              createSentencesTable(outputContend.aiSentences, 7),
            ]
          : []),

        ...(outputContend.humanSentences &&
        outputContend.humanSentences.length > 0
          ? [
              {
                text: "Top Sentences Driving Human Probability",
                style: "sectionTitle",
              },
              {
                text: `These ${Math.min(outputContend.humanSentences.length, 7)} sentences have the highest probability of being human-written.`,
                style: "bodyText",
                margin: [0, 0, 0, 10],
              },
              createSentencesTable(outputContend.humanSentences, 7),
            ]
          : []),
      ],

      // override defaultStyle to ensure chosen font is used
      defaultStyle: {
        ...(pageConfig.defaultStyle || {}),
        font: chosenFont,
      },

      styles: pdfStyles,
    };

    const timestamp = formatTimestamp();
    const filename = `AI-Detection-Report-${timestamp}.pdf`;

    pdfMake.createPdf(docDefinition).download(filename);

    return { success: true, filename };
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw error;
  }
};

/**
 * Helper function to convert logo image to base64 data URL
 * @param {string} logoPath - Path to the logo image
 * @returns {Promise<string>} Base64 data URL
 */
export const convertLogoToDataURL = (logoPath) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      const dataURL = canvas.toDataURL("image/png");
      resolve(dataURL);
    };

    img.onerror = (error) => {
      console.error("Error loading logo:", error);
      reject(error);
    };

    img.src = logoPath;
  });
};
