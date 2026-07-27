import { getPdfExtractionRoute } from "@/lib/document-parsing/client";

/**
 * Extracts text content from a PDF file.
 * @param {File} file - The PDF file to extract text from.
 * @returns {Promise<string>} A promise that resolves with the extracted text content.
 */
const pdfToText = async (file) => {
  if (process.env.NEXT_PUBLIC_EXTRACT_PDF_V2_ENABLED === "true") {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(getPdfExtractionRoute(), {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        if (typeof data.text === "string" && data.text.trim()) {
          return data.text.trim();
        }
      }
    } catch (error) {
      console.warn("Falling back to client-side PDF parsing", error);
    }
  }

  const { pdfjs } = await import("react-pdf");
  pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

  // Create a blob URL for the PDF file
  const blobUrl = URL.createObjectURL(file);

  const loadingTask = pdfjs.getDocument(blobUrl);

  let extractedText = "";
  try {
    const pdf = await loadingTask.promise;
    const numPages = pdf.numPages;

    // Iterate through each page and extract text
    for (let pageNumber = 1; pageNumber <= numPages; pageNumber++) {
      const page = await pdf.getPage(pageNumber);
      const textContent = await page.getTextContent();

      let previousY = null; // To track line breaks
      let pageText = "";

      textContent.items.forEach((item) => {
        // Add a line break if the y-coordinate changes significantly
        if (previousY && Math.abs(previousY - item.transform[5]) > 10) {
          pageText += "\n";
        }
        pageText += item.str + " ";
        previousY = item.transform[5];
      });

      extractedText += pageText.trim() + "\n\n"; // Separate pages with double line breaks
    }
  } catch (error) {
    extractedText = "Error parsing the document.";
    console.error("Error extracting text from PDF:", error);
  }

  // Clean up the blob URL
  URL.revokeObjectURL(blobUrl);

  return extractedText.trim(); // Return the cleaned-up text
};

export default pdfToText;
