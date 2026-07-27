export const historyGroupsByPeriod = (apiResponse) => {
  // Handle both old format (array) and new format (object with data property)
  const histories = Array.isArray(apiResponse)
    ? apiResponse
    : apiResponse?.data;

  if (!histories || !Array.isArray(histories)) return [];

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const groups = histories.reduce((acc, entry) => {
    // Use createdAt as the primary timestamp field
    const timestamp = entry.createdAt || entry.timestamp;
    const d = new Date(timestamp);
    const m = d.getMonth();
    const y = d.getFullYear();
    const monthName = d.toLocaleString("default", { month: "long" });
    const key =
      m === currentMonth && y === currentYear
        ? "This Month"
        : `${monthName} ${y}`;

    if (!acc[key]) acc[key] = [];
    acc[key].push({
      _id: entry._id,
      // Handle both 'text' (API response) and 'input' (legacy format) fields
      text: entry.text || entry.input || "",
      time: timestamp,
      model: entry.model, // Include additional fields if needed
      level: entry.level,
      wordCount: entry.wordCount,
      outputs: entry.outputs, // Include outputs array
      language: entry.language,
    });
    return acc;
  }, {});

  const result = [];

  if (groups["This Month"]) {
    result.push({ period: "This Month", history: groups["This Month"] });
    delete groups["This Month"];
  }

  Object.keys(groups)
    .sort((a, b) => {
      const [ma, ya] = a.split(" ");
      const [mb, yb] = b.split(" ");
      const da = new Date(`${ma} 1, ${ya}`);
      const db = new Date(`${mb} 1, ${yb}`);
      return db - da;
    })
    .forEach((key) => {
      result.push({ period: key, history: groups[key] });
    });

  return result;
};
