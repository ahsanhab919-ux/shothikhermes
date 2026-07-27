// downloadfile.js (patched)
// - Loads pdfMake (cdn), ensures vfs & fonts are available
// - Loads Bengali TTF fonts from /fonts/ and injects into pdfMake.vfs
// - Ensures Roboto exists for English fallback
// - Exports downloadFile(outputContent, toolName, format)

import { Document, Packer, Paragraph, TextRun } from "docx";
import { saveAs } from "file-saver";
// jsPDF was present previously; keep import in case other code expects it
import pdfMake from "pdfmake/build/pdfmake";

/* ---------------------------
   Text / Markdown helpers
   --------------------------- */
// const parseMarkdownText = (text) => {
//   // Split on double newlines into paragraphs, preserve single-line breaks inside paragraphs by converting them to spaces
//   const paragraphs = text.split(/\n\s*\n/);
//   return paragraphs
//     .map((paragraph) => paragraph.trim().replace(/\n/g, " "))
//     .filter((p) => p.length > 0);
// };

// Previous 👆.

const parseMarkdownText = (text) => {
  // Split on ANY newline into paragraphs (including single line breaks)
  const paragraphs = text.split(/\n+/);
  return paragraphs
    .map((paragraph) => paragraph.trim())
    .filter((p) => p.length > 0);
};

const markdownToPlainText = (text) => {
  return text
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .replace(/_(.*?)_/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
};

/* ---------------------------
   Exports: TXT & DOCX
   --------------------------- */
const downloadAsTxt = (outputContent, filename) => {
  const plainText = markdownToPlainText(outputContent);
  const blob = new Blob([plainText], { type: "text/plain;charset=utf-8" });
  saveAs(blob, filename);
};

const downloadAsDocx = (outputContent, filename) => {
  // const plainText = markdownToPlainText(outputContent);
  const paragraphs = parseMarkdownText(outputContent);

  const documentChildren = paragraphs.map(
    (paragraphText) =>
      new Paragraph({
        children: [
          new TextRun({
            text: paragraphText,
            size: 24, // 12pt
            font: "Arial",
          }),
        ],
        spacing: { after: 200 },
      }),
  );

  const doc = new Document({
    sections: [{ properties: {}, children: documentChildren }],
  });

  Packer.toBlob(doc).then((blob) => saveAs(blob, filename));
};

/* ---------------------------
   PDF: pdfMake loader + font injection
   --------------------------- */

// Chunked ArrayBuffer -> base64 to avoid stack limits
function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000; // 32KB
  let binary = "";
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, chunk);
  }
  return btoa(binary);
}

/**
 * loadBengaliFontForPDFMake(pdfMakeInstance)
 * - Attempts to fetch TTFs from static /fonts/ paths
 * - Injects each successful base64 into pdfMakeInstance.vfs keyed by filename
 * - Returns a mapping object suitable for pdfMake.fonts (e.g. { NotoSansBengali: { normal: 'NotoSansBengali.ttf', ... } })
 *
 * Place TTFs in /public/fonts/ (Next.js) or a static /fonts/ path:
 *   /fonts/NotoSansBengali-Regular.ttf
 *   /fonts/Kalpurush.ttf
 *   /fonts/SolaimanLipi.ttf
 */
const loadBengaliFontForPDFMake = async (pdfMakeInstance) => {
  if (!pdfMakeInstance) pdfMakeInstance = window.pdfMake;
  if (!pdfMakeInstance) throw new Error("pdfMake not loaded");

  // Map: familyName -> fetch URL (static /fonts/ path)
  const fontUrls = {
    NotoSansBengali: "/fonts/NotoSansBengali-Regular.ttf",
  };

  pdfMakeInstance.vfs = pdfMakeInstance.vfs || {};
  const fontsMapping = {};

  for (const [fontFamily, fontUrl] of Object.entries(fontUrls)) {
    try {
      const resp = await fetch(fontUrl);
      if (!resp.ok) {
        console.warn(`Font fetch returned ${resp.status} for ${fontUrl}`);
        continue;
      }
      const buffer = await resp.arrayBuffer();
      const base64 = arrayBufferToBase64(buffer);
      const fileName = `${fontFamily}.ttf`;

      // Inject into pdfMake.vfs
      pdfMakeInstance.vfs[fileName] = base64;

      // Map family -> filenames (pdfMake expects filenames here)
      fontsMapping[fontFamily] = {
        normal: fileName,
        bold: fileName,
        italics: fileName,
        bolditalics: fileName,
      };

      // Stop after first successful font to choose primary font quickly.
      // If you'd like to load all fonts, remove the break.
      break;
    } catch (err) {
      console.warn(`Failed to load font ${fontFamily} from ${fontUrl}:`, err);
      continue;
    }
  }

  return fontsMapping;
};

/**
 * ensureRoboto(pdfMakeInstance)
 * Ensures that a 'Roboto' mapping exists in pdfMake.fonts and referenced ttf files are present in pdfMake.vfs.
 * If original Roboto files are present in vfs (e.g. from vfs_fonts.js) reconstruct mapping.
 * If no Roboto files but some .ttf exists in vfs, alias Roboto -> that ttf.
 * Returns true if Roboto is valid after checking/aliasing; false otherwise.
 */
function ensureRoboto(pdfMakeInstance) {
  pdfMakeInstance.fonts = pdfMakeInstance.fonts || {};
  pdfMakeInstance.vfs = pdfMakeInstance.vfs || {};

  // If Roboto exists and its normal points to a file in vfs, we're done.
  if (
    pdfMakeInstance.fonts.Roboto &&
    typeof pdfMakeInstance.fonts.Roboto.normal === "string" &&
    pdfMakeInstance.vfs[pdfMakeInstance.fonts.Roboto.normal]
  ) {
    return true;
  }

  // Common Roboto filenames used by vfs_fonts.js
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

  // If roboto ttf not present, but there exists any ttf in vfs, alias Roboto -> that ttf file (fallback)
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
    console.warn(`Roboto not found; aliased Roboto -> ${pick}`);
    return true;
  }

  console.warn(
    "Roboto font not found and no TTFs present in pdfMake.vfs to alias.",
  );
  return false;
}

/* ---------------------------
   Bengali detection helper
   --------------------------- */
function containsBengaliText(text) {
  return /[\u0980-\u09FF\u200C\u200D]/.test(text);
}

/* ---------------------------
   Main PDF download flow
   --------------------------- */
const downloadAsPdf = async (outputContent, filename) => {
  try {

    // Load Bengali fonts (inject into pdfMake.vfs and return fontsMapping)
    const bengaliFonts = await loadBengaliFontForPDFMake(pdfMake);

    // Merge fonts mapping (do not clobber existing fonts)
    pdfMake.fonts = {
      ...(pdfMake.fonts || {}),
      ...(bengaliFonts || {}),
    };

    // Ensure Roboto exists for English fallback (reconstruct or alias if possible)
    const robotoReady = ensureRoboto(pdfMake);
    if (!robotoReady) {
      // If Roboto can't be prepared but bengaliFonts exist, alias Roboto -> first bengali font to avoid errors
      const bengaliFirst = Object.keys(bengaliFonts || {})[0];
      if (bengaliFirst && pdfMake.fonts[bengaliFirst]) {
        pdfMake.fonts.Roboto = pdfMake.fonts[bengaliFirst];
        console.warn(`Roboto missing; aliased Roboto -> ${bengaliFirst}`);
      } else {
        // As last resort we still set Roboto to some vfs ttf if available (attempt again)
        const anyTtf = Object.keys(pdfMake.vfs || {}).find((k) =>
          k.toLowerCase().endsWith(".ttf"),
        );
        if (anyTtf) {
          pdfMake.fonts.Roboto = {
            normal: anyTtf,
            bold: anyTtf,
            italics: anyTtf,
            bolditalics: anyTtf,
          };
          console.warn(
            `No Roboto or Bengali fonts; aliased Roboto -> ${anyTtf}`,
          );
        }
      }
    }

    // After merge check again

    // Now ensure we have at least one bengali font name to use if needed
    const bengaliFontName = Object.keys(bengaliFonts || {})[0] || null;

    if (!bengaliFontName) {
      console.warn(
        "No Bengali font loaded; PDF generation will still proceed for English content.",
      );
    }

    const plainText = markdownToPlainText(outputContent);
    const paragraphs = parseMarkdownText(plainText);
    const hasBengali = containsBengaliText(plainText);

    // choose fallback font for English content
    const defaultEnglishFont = "Roboto";

    // Create docDefinition — ensure 'fontName' is defined before map
    const chosenFont =
      hasBengali && bengaliFontName ? bengaliFontName : defaultEnglishFont;

    const docDefinition = {
      content: paragraphs.map((paragraph) => ({
        text: paragraph,
        font: chosenFont,
        fontSize: 12,
        lineHeight: 1.5,
        margin: [0, 0, 0, 10],
      })),
      defaultStyle: {
        font: chosenFont,
        fontSize: 12,
      },
      pageSize: "A4",
      pageMargins: [40, 60, 40, 60],
    };

    // Generate and download PDF (pdfMake will use pdfMake.vfs and pdfMake.fonts)
    const pdfDocGenerator = pdfMake.createPdf(docDefinition);
    // Use getBlob/download depending on environment; .download is fine here
    pdfDocGenerator.download(filename);

  } catch (error) {
    console.error("PDFMake generation failed:", error);
    throw error;
  }
};

/* ---------------------------
   downloadFile exported function
   --------------------------- */
export const downloadFile = async (
  outputContent,
  toolName,
  format = "docx",
) => {
  // 
  const now = new Date();
  const formattedDate = `${
    now.getMonth() + 1
  }_${now.getDate()}_${now.getFullYear()}`;
  const formattedTime = `${now.getHours()}_${now.getMinutes()}_${now.getSeconds()}`;
  const filename = `${toolName}_Text_${formattedDate}_${formattedTime}.${format}`;

  switch (format.toLowerCase()) {
    case "pdf":
      downloadAsPdf(outputContent, filename);
      break;
    case "txt":
      downloadAsTxt(outputContent, filename);
      break;
    case "docx":
    default:
      downloadAsDocx(outputContent, filename);
      break;
  }
};

/* ---------------------------
   End of file
   --------------------------- */
