import { GoogleGenerativeAI } from "@google/generative-ai";
import { defineRoute, z } from "@/lib/api-validation";

function getGeminiModel() {
  const apiKey = process.env.AI_INTEGRATIONS_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not configured");
  const client = new GoogleGenerativeAI(apiKey);
  return client.getGenerativeModel({ model: "gemini-2.5-flash" });
}

const SYSTEM_PROMPT = `You are an expert writing co-author assistant. Your role is to help writers complete, extend, and improve their work — whether academic, professional, creative, or technical.

Rules:
- Continue writing naturally from where the text left off
- Match the tone, style, vocabulary, and voice of the existing text — do not impose your own style
- Preserve all LaTeX equations, code blocks, mathematical notation, and technical terms exactly
- Keep responses concise and directly relevant to what was asked
- Do not repeat any part of the input text — only provide the new content
- Do not add meta-commentary ("Here's the continuation:", "Sure, here is...") — output only the writing
- Preserve named entities, citations, and references exactly as written`;

export const POST = defineRoute({
  method: "post",
  path: "/api/ai-cowriter",
  summary: "AI Co-Writer Streaming Endpoint",
  description: "Provides streaming autocomplete and expansion for the Writing Studio.",
  tags: ["Writing Tools"],
  config: {
    rateLimit: { requests: 10, windowMs: 60000 },
    requireAuth: false, // For demonstration, we allow anonymous but rate limited
  },
  schemas: {
    body: z.object({
      context: z.string().optional().openapi({ description: "Optional full document context" }),
      currentText: z.string().optional().openapi({ description: "The text immediately preceding the cursor" }),
      mode: z.enum(["autocomplete", "expand", "paragraph", "instruction"]).default("autocomplete"),
      instruction: z.string().optional().openapi({ description: "Specific instruction if mode=instruction" }),
    }).refine(data => data.currentText || data.instruction, {
      message: "Text or instruction is required",
      path: ["currentText"],
    }),
  },
  handler: async ({ body }) => {
    // Body is fully typed and validated by Zod
    const { context, currentText, mode, instruction } = body;

    let prompt = "";

    switch (mode) {
      case "autocomplete":
        prompt = `Continue this academic text naturally with 1-2 sentences. Only output the continuation, nothing else:\n\n${currentText}`;
        break;
      case "expand":
        prompt = `Expand on the following academic text with 2-4 detailed paragraphs. Maintain the same academic tone and style. Only output the expansion:\n\n${currentText}`;
        break;
      case "paragraph":
        prompt = `Write one complete academic paragraph that naturally follows from this text. Only output the new paragraph:\n\n${currentText}`;
        break;
      case "instruction":
        prompt = `Given this academic text:\n\n${currentText}\n\nFollow this instruction: ${instruction}\n\nOnly output the result, no meta-commentary.`;
        break;
      default:
        prompt = `Continue this text naturally:\n\n${currentText}`;
    }

    const contextBlock = context ? `\n\nDocument context for reference:\n${context}` : "";
    const finalPrompt = `${SYSTEM_PROMPT}${contextBlock}\n\n${prompt}`;

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const model = getGeminiModel();
          const response = await model.generateContentStream(finalPrompt);

          for await (const chunk of response.stream) {
            const text = chunk.text();
            if (text) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ content: text })}\n\n`)
              );
            }
          }

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
          controller.close();
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : "AI generation failed";
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: errorMsg })}\n\n`)
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-store",
        Connection: "keep-alive",
      },
    });
  }
});
