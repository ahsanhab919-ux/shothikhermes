import { colorDefinitions } from "./pdfStyles";

// Format timestamp for filename
export const formatTimestamp = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");

  return `${year}${month}${day}_${hours}${minutes}${seconds}`;
};

// Format date for display in PDF
export const formatDisplayDate = () => {
  const now = new Date();
  return now.toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

// Get color by perplexity (matching your UI logic)
export const getColorByPerplexity = (highlight_sentence_for_ai, perplexity) => {
  const p = parseInt(perplexity);

  const colorValue = {
    humanHigh: 40,
    humanMedium: 75,
    humanLow: 100,
    aiLow: 100,
    aiMedium: 250,
    aiHigh: 400,
  };

  if (highlight_sentence_for_ai) {
    if (p >= colorValue.aiHigh) return colorDefinitions.aiHigh;
    if (p >= colorValue.aiMedium) return colorDefinitions.aiMedium;
    if (p >= colorValue.aiLow) return colorDefinitions.aiLow;
    return colorDefinitions.aiLow;
  } else {
    if (p <= colorValue.humanHigh) return colorDefinitions.humanHigh;
    if (p <= colorValue.humanMedium) return colorDefinitions.humanMedium;
    if (p <= colorValue.humanLow) return colorDefinitions.humanLow;
    return colorDefinitions.humanLow;
  }
};

// Generate circular chart as canvas and convert to dataURL
export const generateCircularChartImage = async (aiPercentage) => {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    const size = 300; // Higher resolution for better quality in PDF
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");

    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2 - 20;
    const lineWidth = 20;

    // Clear canvas
    ctx.clearRect(0, 0, size, size);

    // Draw background circle (Human - full circle)
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = colorDefinitions.humanHigh;
    ctx.lineWidth = lineWidth;
    ctx.stroke();

    // Draw AI percentage arc
    const aiPercentageValue = parseFloat(aiPercentage);
    const endAngle = (aiPercentageValue / 100) * 2 * Math.PI - Math.PI / 2;

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, -Math.PI / 2, endAngle);
    ctx.strokeStyle = colorDefinitions.aiHigh;
    ctx.lineWidth = lineWidth;
    ctx.stroke();

    // Draw center text
    const mainText = aiPercentageValue > 50 ? "AI" : "Human";
    const textColor = aiPercentageValue > 50 ? "#f5c33b" : "#10b91d";

    ctx.fillStyle = textColor;
    ctx.font = "bold 48px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(mainText, centerX, centerY);

    // Convert canvas to dataURL
    const dataURL = canvas.toDataURL("image/png");
    resolve(dataURL);
  });
};

// Format highlighted text for pdfMake
export const formatHighlightedText = (sentences) => {
  const textArray = [];

  sentences.forEach((item, index) => {
    const backgroundColor = getColorByPerplexity(
      item.highlight_sentence_for_ai,
      item.perplexity,
    );

    textArray.push({
      text: item.sentence + (index < sentences.length - 1 ? " " : ""),
      background: backgroundColor,
    });
  });

  return textArray;
};

// Create color legend table
export const createColorLegend = () => {
  const colors = [
    { color: colorDefinitions.aiHigh, label: "High AI" },
    { color: colorDefinitions.aiMedium, label: "Medium AI" },
    { color: colorDefinitions.aiLow, label: "Low AI" },
    { color: colorDefinitions.humanLow, label: "Low Human" },
    { color: colorDefinitions.humanMedium, label: "Medium Human" },
    { color: colorDefinitions.humanHigh, label: "High Human" },
  ];

  const widths = [80, 50, 40, 40, 50, 80];

  return {
    table: {
      widths: widths,
      body: [
        colors.map((item) => ({
          text: "",
          fillColor: item.color,
          border: [false, false, false, false],
        })),
      ],
    },
    layout: "noBorders",
    margin: [0, 10, 0, 5],
  };
};

// Create sentences table for AI/Human sections
export const createSentencesTable = (sentences, limit = 7) => {
  const limitedSentences = sentences.slice(0, limit);

  const tableBody = [
    [
      {
        text: "Indicator",
        style: "tableHeader",
        noWrap: true,
        alignment: "center",
      },
      {
        text: "Sentence",
        style: "tableHeader",
        noWrap: true,
        alignment: "left",
      },
    ],
  ];

  limitedSentences.forEach((item) => {
    const color = getColorByPerplexity(
      item.highlight_sentence_for_ai,
      item.perplexity,
    );

    tableBody.push([
      {
        text: "",
        fillColor: color,
        margin: [0, 2, 0, 2],
        noWrap: true,
      },
      {
        text: item.sentence,
        style: "tableCell",
        noWrap: false,
      },
    ]);
  });

  return {
    // Keep the whole table together on the page when possible
    unbreakable: true,

    table: {
      headerRows: 1, // repeat header if table spans pages
      dontBreakRows: true, // prevent single rows from being split across pages
      widths: [50, "*"],
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

// Count words in text
export const countWords = (text) => {
  return text
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length;
};

// Count characters in text
export const countCharacters = (text) => {
  return text.length;
};

// Get full text from sentences
export const getFullText = (sentences) => {
  return sentences.map((s) => s.sentence).join(" ");
};
