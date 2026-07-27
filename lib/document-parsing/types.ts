export type DocumentParserName = "pdf-parse" | "liteparse";

export interface ParsedDocumentBlock {
  type: "paragraph" | "table" | "heading" | "image" | "unknown";
  text?: string;
  page?: number;
  bbox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface ParsedDocumentResult {
  parser: DocumentParserName;
  text: string;
  title: string;
  pages: number;
  preview: string;
  imageBased: boolean;
  blocks?: ParsedDocumentBlock[];
}

