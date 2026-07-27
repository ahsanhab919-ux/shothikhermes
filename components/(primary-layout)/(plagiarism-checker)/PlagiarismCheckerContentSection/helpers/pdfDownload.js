// generatePlagiarismPDF.js
import {
  checkBengali,
  checkRoboto,
  loadBengaliFontForPDFMake,
} from "@/components/(primary-layout)/(ai-detector-page)/AiDetectorContentSection/helpers/pdfDownload";
import {
  convertLogoToDataURL,
  countCharacters,
  countWords,
  formatDisplayDate,
  formatTimestamp,
} from "@/components/(primary-layout)/(ai-detector-page)/AiDetectorContentSection/helpers/pdfHelper";
import { pdfPageConfig, pdfStyles } from "@/components/(primary-layout)/(ai-detector-page)/AiDetectorContentSection/helpers/pdfStyles";
import pdfMake from "pdfmake/build/pdfmake";

// Register base vfs and fonts (from vfs_fonts import)
pdfMake.vfs = pdfMake.vfs || {};
pdfMake.fonts = pdfMake.fonts || {};

// Helper to get risk level color
const getRiskColor = (riskLevel) => {
  switch (riskLevel) {
    case "HIGH":
      return "#ef4444"; // red
    case "MEDIUM":
      return "#f59e0b"; // amber
    case "LOW":
      return "#10b981"; // green
    default:
      return "#6b7280"; // gray
  }
};

// Helper to get risk level label
const getRiskLabel = (riskLevel) => {
  switch (riskLevel) {
    case "HIGH":
      return "High Risk";
    case "MEDIUM":
      return "Medium Risk";
    case "LOW":
      return "Low Risk";
    default:
      return "Unknown";
  }
};

// Generate similarity chart image
const generateSimilarityChart = async (score) => {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    const size = 300;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");

    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2 - 20;
    const lineWidth = 20;

    // Clear canvas
    ctx.clearRect(0, 0, size, size);

    // Draw background circle (0% - full circle)
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = "#e5e7eb";
    ctx.lineWidth = lineWidth;
    ctx.stroke();

    // Draw similarity percentage arc
    const scoreValue = parseFloat(score);
    const endAngle = (scoreValue / 100) * 2 * Math.PI - Math.PI / 2;

    // Determine color based on score
    let strokeColor = "#10b981"; // green for low
    if (scoreValue >= 70) {
      strokeColor = "#ef4444"; // red for high
    } else if (scoreValue >= 40) {
      strokeColor = "#f59e0b"; // amber for medium
    }

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, -Math.PI / 2, endAngle);
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = lineWidth;
    ctx.stroke();

    // Draw center text
    ctx.fillStyle = strokeColor;
    ctx.font = "bold 48px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`${Math.round(scoreValue)}%`, centerX, centerY);

    // Convert canvas to dataURL
    const dataURL = canvas.toDataURL("image/png");
    resolve(dataURL);
  });
};

// Format text with highlights for sections and exact matches
const formatHighlightedText = (inputText, sections = [], exactMatches = []) => {
  // Create a sorted array of all highlights
  const highlights = [];

  // Add sections (paraphrased content)
  sections.forEach((section) => {
    if (section.span?.start != null && section.span?.end != null) {
      highlights.push({
        start: section.span.start,
        end: section.span.end,
        similarity: section.similarity,
        type: "paraphrased",
      });
    }
  });

  // Add exact matches
  exactMatches.forEach((match) => {
    if (match.span?.start != null && match.span?.end != null) {
      highlights.push({
        start: match.span.start,
        end: match.span.end,
        similarity: 100,
        type: "exact",
      });
    }
  });

  // Sort by start position
  highlights.sort((a, b) => a.start - b.start);

  // Build text array with highlights
  const textArray = [];
  let lastIndex = 0;

  highlights.forEach((highlight) => {
    // Add text before highlight
    if (highlight.start > lastIndex) {
      textArray.push({
        text: inputText.substring(lastIndex, highlight.start),
      });
    }

    // Add highlighted text
    const highlightedText = inputText.substring(highlight.start, highlight.end);
    let backgroundColor = "#fef3c7"; // light yellow for paraphrased
    if (highlight.type === "exact") {
      backgroundColor = "#fee2e2"; // light red for exact matches
    } else if (highlight.similarity >= 70) {
      backgroundColor = "#fde68a"; // darker yellow for high similarity
    }

    textArray.push({
      text: highlightedText,
      background: backgroundColor,
    });

    lastIndex = highlight.end;
  });

  // Add remaining text
  if (lastIndex < inputText.length) {
    textArray.push({
      text: inputText.substring(lastIndex),
    });
  }

  return textArray.length > 0 ? textArray : [{ text: inputText }];
};

// Create sources table
const createSourcesTable = (sources) => {
  if (!sources || sources.length === 0) {
    return null;
  }

  const tableBody = [
    [
      { text: "Source", style: "tableHeader", alignment: "left" },
      { text: "Similarity", style: "tableHeader", alignment: "center" },
      { text: "URL", style: "tableHeader", alignment: "left" },
    ],
  ];

  sources.slice(0, 10).forEach((source) => {
    if (!source) return; // Skip invalid sources
    
    tableBody.push([
      {
        text: source.title || "Unknown",
        style: "tableCell",
        alignment: "left",
      },
      {
        text: `${Math.round(source.similarity || 0)}%`,
        style: "tableCell",
        alignment: "center",
      },
      {
        text: source.url || "N/A",
        style: "tableCell",
        alignment: "left",
        ...(source.url ? { link: source.url, color: "#1976d2" } : {}),
      },
    ]);
  });

  return {
    table: {
      headerRows: 1,
      widths: ["*", 80, "*"],
      body: tableBody,
    },
    layout: {
      hLineWidth: (i) => (i === 1 ? 1 : 0.5),
      vLineWidth: () => 0.5,
      hLineColor: () => "#E0E0E0",
      vLineColor: () => "#E0E0E0",
    },
    margin: [0, 5, 0, 15],
  };
};

// Generate and download Plagiarism PDF
export const pdfDownload = async ({ report, inputText, logo = "/shothik_light_logo.png" }) => {
  try {
    if (!report) {
      throw new Error("Report data is required");
    }

    // Logo data url
    let logoDataUrl = null;
    try {
      logoDataUrl = await convertLogoToDataURL(logo);
    } catch (error) {
      console.warn("Logo could not be loaded, proceeding without logo");
    }

    // Chart image
    const chartImage = await generateSimilarityChart(report.score);

    // Stats
    const fullText = inputText || "";
    const wordCount = countWords(fullText);
    const charCount = countCharacters(fullText);
    const scanDate = formatDisplayDate();
    const riskColor = getRiskColor(report.riskLevel);
    const riskLabel = getRiskLabel(report.riskLevel);

    // Format highlighted text
    const highlightedText = formatHighlightedText(
      fullText,
      report.sections || [],
      report.exactMatches || []
    );

    // Build content sections
    const contentSections = [];

    // Results section
    contentSections.push({ text: "Results", style: "subheader", margin: [0, 20, 0, 15] });

    // Chart
    contentSections.push({
      image: chartImage,
      width: 150,
      alignment: "center",
      margin: [0, 0, 0, 15],
    });

    // Risk assessment
    contentSections.push({
      text: [
        { text: "Similarity score: ", style: "bodyText" },
        { text: `${report.score}%`, style: "bodyText", bold: true },
      ],
      alignment: "center",
      margin: [0, 0, 0, 10],
    });

    contentSections.push({
      text: riskLabel,
      style: "badge",
      background: `${riskColor}1a`,
      color: riskColor,
      margin: [0, 0, 0, 15],
    });

    // Stats table - build rows ensuring consistent column count
    // Determine if we need 4 columns (if exactPlagiarismPercentage exists)
    const hasExactPlagiarism = report.exactPlagiarismPercentage != null;
    const tableWidths = hasExactPlagiarism ? ["*", "*", "*", "*"] : ["*", "*", "*"];

    // Build first row
    const firstRow = [
      {
        stack: [
          { text: "Similarity Score", style: "statsLabel" },
          { text: `${report.score}%`, style: "statsValue", color: riskColor },
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
          { text: "Character Count", style: "statsLabel" },
          { text: charCount.toString(), style: "statsValue" },
        ],
        alignment: "center",
      },
    ];

    // Add 4th column to first row if exactPlagiarismPercentage exists
    if (hasExactPlagiarism) {
      firstRow.push({
        text: "", // Empty cell - exactPlagiarismPercentage goes in second row
        alignment: "center",
      });
    }

    const statsTableBody = [firstRow];

    // Add summary stats if available
    if (report.summary) {
      const summaryRow = [
        {
          stack: [
            { text: "Paraphrased Sections", style: "statsLabel" },
            { text: report.summary.paraphrasedCount?.toString() || "0", style: "statsValue" },
          ],
          alignment: "center",
        },
        {
          stack: [
            { text: "Paraphrased Similarity", style: "statsLabel" },
            { text: `${report.summary.paraphrasedPercentage || 0}%`, style: "statsValue" },
          ],
          alignment: "center",
        },
        {
          stack: [
            { text: "Exact Matches", style: "statsLabel" },
            { text: report.summary.exactMatchCount?.toString() || "0", style: "statsValue" },
          ],
          alignment: "center",
        },
      ];

      // Add 4th column if exactPlagiarismPercentage exists
      if (hasExactPlagiarism) {
        summaryRow.push({
          stack: [
            { text: "Exact Plagiarism", style: "statsLabel" },
            { text: `${report.exactPlagiarismPercentage}%`, style: "statsValue" },
          ],
          alignment: "center",
        });
      }

      statsTableBody.push(summaryRow);
    }

    contentSections.push({
      table: {
        widths: tableWidths,
        body: statsTableBody,
      },
      layout: "noBorders",
      margin: [0, 10, 0, 20],
    });

    // Analyzed Text section
    if (fullText) {
      contentSections.push({
        stack: [
          { text: "Analyzed Text", style: "sectionTitle" },
          {
            text: "Text is highlighted based on similarity matches. Yellow indicates paraphrased content, red indicates exact matches.",
            style: "bodyText",
            margin: [0, 0, 0, 10],
          },
        ],
      });

      contentSections.push({
        text: highlightedText,
        style: "sentenceText",
        margin: [0, 0, 0, 20],
        lineHeight: 1.6,
      });
    }

    // Sections (Paraphrased Content)
    if (report.sections && report.sections.length > 0) {
      contentSections.push({
        text: "Paraphrased Sections",
        style: "sectionTitle",
        margin: [0, 20, 0, 10],
      });

      report.sections.slice(0, 10).forEach((section, index) => {
        contentSections.push({
          stack: [
            {
              text: `Section ${index + 1} - ${Math.round(section.similarity || 0)}% Similarity`,
              style: "bodyText",
              bold: true,
              margin: [0, 10, 0, 5],
            },
            {
              text: section.excerpt || "No excerpt available",
              style: "bodyText",
              margin: [0, 0, 0, 5],
            },
            ...(section.sources && section.sources.length > 0
              ? [
                  {
                    text: "Sources:",
                    style: "bodyText",
                    bold: true,
                    margin: [0, 5, 0, 2],
                  },
                  ...section.sources.slice(0, 3).map((source) => ({
                    text: `• ${source.title || "Unknown"} (${Math.round(source.similarity || 0)}%) - ${source.url || "N/A"}`,
                    style: "bodyText",
                    fontSize: 9,
                    margin: [10, 0, 0, 2],
                    link: source.url || undefined,
                    color: "#1976d2",
                  })),
                ]
              : []),
          ],
          margin: [0, 0, 0, 15],
        });
      });
    }

    // Exact Matches
    if (report.exactMatches && report.exactMatches.length > 0) {
      contentSections.push({
        text: "Exact Matches",
        style: "sectionTitle",
        margin: [0, 20, 0, 10],
      });

      report.exactMatches.slice(0, 10).forEach((match, index) => {
        contentSections.push({
          stack: [
            {
              text: `Exact Match ${index + 1} - 100% Similarity`,
              style: "bodyText",
              bold: true,
              color: "#ef4444",
              margin: [0, 10, 0, 5],
            },
            {
              text: match.excerpt || "No excerpt available",
              style: "bodyText",
              margin: [0, 0, 0, 5],
            },
            ...(match.sources && match.sources.length > 0
              ? [
                  {
                    text: "Sources:",
                    style: "bodyText",
                    bold: true,
                    margin: [0, 5, 0, 2],
                  },
                  ...match.sources.slice(0, 3).map((source) => ({
                    text: `• ${source.title || "Unknown"} - ${source.url || "N/A"}`,
                    style: "bodyText",
                    fontSize: 9,
                    margin: [10, 0, 0, 2],
                    link: source.url || undefined,
                    color: "#1976d2",
                  })),
                ]
              : []),
          ],
          margin: [0, 0, 0, 15],
        });
      });
    }

    // All Sources table
    const allSources = [];
    if (report.sections) {
      report.sections.forEach((section) => {
        if (section.sources) {
          allSources.push(...section.sources);
        }
      });
    }
    if (report.exactMatches) {
      report.exactMatches.forEach((match) => {
        if (match.sources) {
          allSources.push(...match.sources);
        }
      });
    }

    // Remove duplicates based on URL
    const uniqueSources = Array.from(
      new Map(allSources.map((source) => [source.url, source])).values()
    );

    if (uniqueSources.length > 0) {
      const sourcesTable = createSourcesTable(uniqueSources);
      if (sourcesTable) {
        contentSections.push({
          text: "All Sources",
          style: "sectionTitle",
          margin: [0, 20, 0, 10],
        });
        contentSections.push(sourcesTable);
      }
    }

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
    const robotoReady = checkRoboto(pdfMake);
    if (!robotoReady) {
      // if Roboto can't be built but we loaded a bengali font, alias Roboto to it
      const bengaliFirst = Object.keys(bengaliFonts || {})[0];
      if (bengaliFirst && pdfMake.fonts?.[bengaliFirst]) {
        pdfMake.fonts.Roboto = pdfMake.fonts?.[bengaliFirst];
        console.warn(`Roboto not available; aliased Roboto -> ${bengaliFirst}`);
      } else {
        // Last resort: try to find any TTF in vfs and alias Roboto to it
        const vfsTtfKeys = Object.keys(pdfMake.vfs || {}).filter((k) =>
          k.toLowerCase().endsWith(".ttf")
        );
        if (vfsTtfKeys.length > 0) {
          const pick = vfsTtfKeys[0];
          pdfMake.fonts.Roboto = {
            normal: pick,
            bold: pick,
            italics: pick,
            bolditalics: pick,
          };
          console.warn(`Roboto not found; aliased Roboto -> ${pick}`);
        } else {
          console.error("No fonts available in vfs. PDF generation may fail.");
        }
      }
    }

    // Choose font based on content
    const hasBengali = checkBengali(fullText);
    const bengaliFontName = Object.keys(bengaliFonts || {})[0] || null;
    const defaultEnglishFont = "Roboto";
    const chosenFont =
      hasBengali && bengaliFontName ? bengaliFontName : defaultEnglishFont;

    // ---------- DOC DEFINITION ----------
    const docDefinition = {
      ...pdfPageConfig,

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
                    text: "Plagiarism Detection Report",
                    fontSize: 16,
                    bold: true,
                    color: "#637381",
                    margin: [40, 8, 0, 0],
                    alignment: "left",
                  },
                ],
              },
              { width: "*", text: "" },
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

      content: contentSections,

      defaultStyle: {
        ...(pdfPageConfig.defaultStyle || {}),
        font: chosenFont,
      },

      styles: pdfStyles,
    };

    const timestamp = formatTimestamp();
    const filename = `Plagiarism-Report-${timestamp}.pdf`;

    pdfMake.createPdf(docDefinition).download(filename);

    return { success: true, filename };
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw error;
  }
};

