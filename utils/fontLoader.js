// Convert TTF file to base64 string for jsPDF
export const loadTTFAsBase64 = async (fontPath) => {
  try {
    const response = await fetch(fontPath);
    const arrayBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Convert to base64
    let binary = "";
    uint8Array.forEach((byte) => (binary += String.fromCharCode(byte)));
    return btoa(binary);
  } catch (error) {
    console.error("Failed to load TTF font:", error);
    return null;
  }
};

// Alternative: Load TTF as ArrayBuffer directly
export const loadTTFAsArrayBuffer = async (fontPath) => {
  try {
    const response = await fetch(fontPath);
    return await response.arrayBuffer();
  } catch (error) {
    console.error("Failed to load TTF font:", error);
    return null;
  }
};
