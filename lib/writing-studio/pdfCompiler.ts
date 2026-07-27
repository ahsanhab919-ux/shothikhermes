import { exec } from "child_process";
import { writeFile, readFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

const BUILD_DIR = "/tmp/writing-studio-builds";

async function ensureBuildDir() {
  if (!existsSync(BUILD_DIR)) {
    await mkdir(BUILD_DIR, { recursive: true });
  }
}

export async function compilePdf(buildId: string, latexContent: string): Promise<{ pdfPath: string; pdfUrl: string }> {
  await ensureBuildDir();

  const buildPath = path.join(BUILD_DIR, `pdf_${buildId}`);
  await mkdir(buildPath, { recursive: true });

  const texPath = path.join(buildPath, "document.tex");
  const pdfPath = path.join(buildPath, "document.pdf");

  await writeFile(texPath, latexContent, "utf-8");

  return new Promise((resolve, reject) => {
    exec(
      `pdflatex -interaction=nonstopmode -output-directory="${buildPath}" "${texPath}"`,
      { timeout: 30000 },
      async (error, stdout, stderr) => {
        if (existsSync(pdfPath)) {
          const pdfUrl = `/api/latex/download/${buildId}`;
          resolve({ pdfPath, pdfUrl });
        } else {
          const logPath = path.join(buildPath, "document.log");
          let logContent = "";
          try {
            logContent = await readFile(logPath, "utf-8");
            const errorLines = logContent.split("\n").filter(l => l.startsWith("!") || l.includes("Error"));
            logContent = errorLines.slice(0, 10).join("\n");
          } catch {}
          reject(new Error(`LaTeX compilation failed: ${logContent || stderr || "Unknown error"}`));
        }
      }
    );
  });
}
