export const pdfPageConfig = {
  pageSize: "A4",
  pageMargins: [40, 80, 40, 60],
  defaultStyle: {
    font: "Roboto",
    fontSize: 11,
    color: "#212B36",
  },
};

export const pdfStyles = {
  header: {
    fontSize: 20,
    bold: true,
    color: "#1976d2",
    margin: [0, 0, 0, 10],
  },
  subheader: {
    fontSize: 16,
    bold: true,
    color: "#424242",
    margin: [0, 15, 0, 10],
  },
  sectionTitle: {
    fontSize: 14,
    bold: true,
    color: "#212B36",
    margin: [0, 15, 0, 8],
  },
  bodyText: {
    fontSize: 11,
    lineHeight: 1.5,
    color: "#212B36",
  },
  statsLabel: {
    fontSize: 10,
    color: "#637381",
    margin: [0, 2, 0, 2],
  },
  statsValue: {
    fontSize: 12,
    bold: true,
    color: "#212B36",
    margin: [0, 2, 0, 2],
  },
  sentenceText: {
    fontSize: 10,
    lineHeight: 1.4,
    color: "#212B36",
  },
  footer: {
    fontSize: 9,
    color: "#919EAB",
    alignment: "center",
    margin: [0, 5, 0, 0],
  },
  badge: {
    fontSize: 14,
    bold: true,
    color: "#6B46C1",
    alignment: "center",
    margin: [0, 5, 0, 5],
  },
  legendText: {
    fontSize: 9,
    color: "#637381",
  },
  tableHeader: {
    fontSize: 11,
    bold: true,
    color: "#212B36",
    fillColor: "#F4F6F8",
  },
  tableCell: {
    fontSize: 10,
    color: "#212B36",
    margin: [5, 5, 5, 5],
  },
};

// Light mode color definitions (for light backgrounds)
export const colorDefinitionsLight = {
  humanLow: "#9fe3a5",
  humanMedium: "#70d577",
  humanHigh: "#10b91d",
  aiLow: "#fbe7b1",
  aiMedium: "#f8d576",
  aiHigh: "#f5c33b",
};

// Dark mode color definitions (for dark backgrounds - using rgba for better contrast)
export const colorDefinitionsDark = {
  humanLow: "rgba(16, 185, 29, 0.3)",
  humanMedium: "rgba(16, 185, 29, 0.5)",
  humanHigh: "rgba(16, 185, 29, 0.7)",
  aiLow: "rgba(245, 195, 59, 0.3)",
  aiMedium: "rgba(245, 195, 59, 0.5)",
  aiHigh: "rgba(245, 195, 59, 0.7)",
};

// Legacy exports for backwards compatibility
export const colorDefinitionsHuman = {
  humanLow: colorDefinitionsLight.humanLow,
  humanMedium: colorDefinitionsLight.humanMedium,
  humanHigh: colorDefinitionsLight.humanHigh,
};

export const colorDefinitionsAI = {
  aiLow: colorDefinitionsLight.aiLow,
  aiMedium: colorDefinitionsLight.aiMedium,
  aiHigh: colorDefinitionsLight.aiHigh,
};

export const colorDefinitions = colorDefinitionsLight;

export const colorValuesHuman = {
  humanLow: 100,
  humanMedium: 250,
  humanHigh: 400,
};

export const colorValuesAI = {
  aiLow: 100,
  aiMedium: 250,
  aiHigh: 400,
};

export const colorValues = {
  ...colorValuesHuman,
  ...colorValuesAI,
};

export const colorLabels = {
  humanHigh: "High Human Confidence",
  humanMedium: "Medium Human Confidence",
  humanLow: "Low Human Confidence",
  aiLow: "Low AI Confidence",
  aiMedium: "Medium AI Confidence",
  aiHigh: "High AI Confidence",
};
