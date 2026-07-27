import { GoogleGenerativeAI } from "@google/generative-ai";
import { defineRoute, z } from "@/lib/api-validation";
import { withRetry, CircuitBreaker } from "@/lib/resiliency";

// Global Circuit Breaker for Gemini API
const geminiCircuitBreaker = new CircuitBreaker({
  failureThreshold: 3,
  resetTimeoutMs: 30000,
});

function getGeminiModel() {
  const apiKey = process.env.AI_INTEGRATIONS_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not configured");
  const client = new GoogleGenerativeAI(apiKey);
  return client.getGenerativeModel({ model: "gemini-2.5-flash" });
}

function buildPrompt(
  type: "book" | "research" | "assignment",
  description: string,
  sources: { title?: string; url?: string; text?: string }[]
): string {
  const sourceBlock =
    sources.length > 0
      ? `\n\nUser-provided reference sources:\n${sources
          .map(
            (s, i) =>
              `Source ${i + 1}: ${s.title || s.url || "Untitled"}\n${s.text ? s.text.slice(0, 800) : ""}`
          )
          .join("\n\n")}`
      : "";

  if (type === "book") {
    return `You are a world-class literary agent and developmental editor. A writer has come to you with a concept for a book.

Concept: "${description}"${sourceBlock}

Generate a detailed book development plan in this EXACT JSON format (no markdown, no code fences, raw JSON only):
{
  "title": "A compelling working title",
  "genre": "Specific genre (e.g., Literary Fiction, Hard Sci-Fi, Psychological Thriller)",
  "logline": "One powerful sentence that captures the essence, stakes, and hook of this book",
  "chapters": [
    {
      "id": "ch-1",
      "title": "Chapter title",
      "synopsis": "2-3 sentences describing what happens, what's at stake, and how character changes"
    }
  ],
  "researchNotes": {
    "comparables": ["Book A by Author X", "Book B by Author Y"],
    "themes": ["Core theme 1", "Core theme 2", "Core theme 3"],
    "settingNotes": "Detailed notes on the world, time period, atmosphere, and physical environment",
    "characterArchetypes": ["Protagonist archetype and trait", "Antagonist archetype and trait"],
    "keyConflicts": ["External conflict", "Internal conflict", "Interpersonal conflict"]
  }
}

Generate 8-12 chapters. Each chapter synopsis should be rich and specific — avoid vague descriptions like "things get complicated." Make the chapter progression feel like a real narrative arc with escalating tension.`;
  }

  if (type === "research") {
    return `You are a senior academic advisor and research methodology expert. A researcher has come to you with a research idea.

Research concept: "${description}"${sourceBlock}

Generate a structured research paper plan in this EXACT JSON format (no markdown, no code fences, raw JSON only):
{
  "title": "A precise, academic working title",
  "genre": "Academic discipline and paper type (e.g., Empirical Study in Cognitive Psychology, Systematic Review in Machine Learning)",
  "logline": "One sentence thesis statement — the central argument or finding this paper will establish",
  "chapters": [
    {
      "id": "sec-1",
      "title": "Section title (e.g., Introduction, Literature Review, Methodology)",
      "synopsis": "2-3 sentences describing the content, arguments, and evidence in this section"
    }
  ],
  "researchNotes": {
    "comparables": ["Related paper 1 (author, journal, year)", "Related paper 2"],
    "themes": ["Key argument 1", "Key argument 2", "Key theoretical framework"],
    "settingNotes": "Research context: field gaps, relevance, why now, target journal or conference",
    "characterArchetypes": ["Primary methodology", "Secondary methodology or validation approach"],
    "keyConflicts": ["Main counterargument 1", "Limitation to address", "Gap in existing literature"]
  }
}

Generate 5-7 sections following standard academic paper structure. Each section synopsis should specify exact content, methodology steps, or arguments — not just labels.`;
  }

  return `You are an expert academic tutor and assignment strategist. A student has come to you with an assignment brief.

Assignment description: "${description}"${sourceBlock}

Generate a detailed assignment completion plan in this EXACT JSON format (no markdown, no code fences, raw JSON only):
{
  "title": "Assignment title",
  "genre": "Assignment type and subject (e.g., Case Study Analysis — Business Strategy, Argumentative Essay — Ethics)",
  "logline": "One sentence central argument or thesis this assignment will demonstrate",
  "chapters": [
    {
      "id": "sec-1",
      "title": "Section title",
      "synopsis": "2-3 sentences describing what to write, which evidence to use, and how to argue the point"
    }
  ],
  "researchNotes": {
    "comparables": ["Key source 1 to cite", "Key source 2 to cite", "Recommended journal or textbook"],
    "themes": ["Core argument 1", "Core argument 2", "Key concept to demonstrate"],
    "settingNotes": "Academic context: marking criteria focus, typical word allocation per section, common pitfalls to avoid",
    "characterArchetypes": ["Primary analytical framework (e.g., SWOT, Porter's Five Forces)", "Secondary framework"],
    "keyConflicts": ["Counterargument to address", "Limitation to acknowledge", "Common student mistake to avoid"]
  }
}

Generate 4-6 sections. Each section synopsis should be actionable — tell the student exactly what to write and why, with specific evidence suggestions.`;
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export const POST = defineRoute({
  method: "post",
  path: "/api/book-agent",
  summary: "Generate Book/Research Plan",
  description: "Streams a structured plan (chapters, research notes) based on a concept.",
  tags: ["Writing Tools"],
  config: {
    rateLimit: { requests: 10, windowMs: 60000 },
    requireAuth: false, // In production, consider requiring auth
  },
  schemas: {
    body: z.object({
      description: z.string().min(1, "Description is required"),
      type: z.enum(["book", "research", "assignment"]).default("book"),
      sources: z.array(
        z.object({
          title: z.string().optional(),
          url: z.string().optional(),
          text: z.string().optional(),
        })
      ).default([]),
    }),
  },
  handler: async ({ body }) => {
    const { description, type, sources } = body;
    const encoder = new TextEncoder();

    const send = (
      controller: ReadableStreamDefaultController,
      data: object
    ) => {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
    };

    const stream = new ReadableStream({
      async start(controller) {
        try {
          send(controller, { type: "status", step: 1 });
          await delay(600);

          send(controller, { type: "status", step: 2 });
          await delay(700);

          send(controller, { type: "status", step: 3 });

          const prompt = buildPrompt(type, description.trim(), sources);

          // Use CircuitBreaker & Retry for LLM calls
          const response = await geminiCircuitBreaker.execute(() => 
            withRetry(
              async () => {
                const model = getGeminiModel();
                return await model.generateContent({
                  contents: [{ role: "user", parts: [{ text: prompt }] }],
                  generationConfig: {
                    maxOutputTokens: 8192,
                    temperature: 0.9,
                  },
                });
              },
              {
                retries: 2,
                minTimeout: 2000,
                onFailedAttempt: (error) => console.warn(`Gemini generation retry: ${error.message}`)
              }
            )
          );

          send(controller, { type: "status", step: 4 });
          await delay(400);

          send(controller, { type: "status", step: 5 });
          await delay(300);

          send(controller, { type: "status", step: 6 });

          const raw = response.response.text() ?? "";

          const jsonMatch = raw.match(/\{[\s\S]*\}/);
          if (!jsonMatch) {
            send(controller, {
              type: "error",
              message: "The AI returned an unexpected response. Please try again.",
            });
            controller.close();
            return;
          }

          const plan = JSON.parse(jsonMatch[0]);

          if (
            !plan.title ||
          !plan.chapters ||
          !Array.isArray(plan.chapters)
        ) {
          send(controller, {
            type: "error",
            message: "The plan was incomplete. Please try again.",
          });
          controller.close();
          return;
        }

        plan.chapters = plan.chapters.map(
          (
            ch: { id?: string; title?: string; synopsis?: string },
            i: number
          ) => ({
            id: ch.id || `ch-${i + 1}`,
            title: ch.title || `Chapter ${i + 1}`,
            synopsis: ch.synopsis || "",
          })
        );

        plan.researchNotes = plan.researchNotes || {
          comparables: [],
          themes: [],
          settingNotes: "",
          characterArchetypes: [],
          keyConflicts: [],
        };

        send(controller, { type: "done", plan });
        controller.close();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Something went wrong";
        try {
          const controller2 = controller;
          send(controller2, { type: "error", message });
          controller2.close();
        } catch {}
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
