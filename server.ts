import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server as SocketIOServer } from "socket.io";
import { createRemoteJWKSet, jwtVerify } from "jose";

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOST || "0.0.0.0";
const port = parseInt(process.env.PORT || "5000", 10);

const NLP_SERVICE_URL = process.env.NLP_SERVICE_URL || "http://localhost:3001";

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

const PARAPHRASE_MODEL = "gemini-2.5-flash";
const GEMINI_BASE_URL = process.env.AI_INTEGRATIONS_GEMINI_BASE_URL ?? "";
const GEMINI_API_KEY = process.env.AI_INTEGRATIONS_GEMINI_API_KEY ?? "";

// ─── Circuit Breaker ──────────────────────────────────────────────────────────
type CircuitState = "CLOSED" | "OPEN" | "HALF_OPEN";
let circuitState: CircuitState = "CLOSED";
let failureCount = 0;
let lastFailureTime = 0;
const FAILURE_THRESHOLD = 3;
const COOLDOWN_MS = 30_000;

function recordSuccess() {
  if (circuitState !== "CLOSED") {
    console.log(`[circuit-breaker] ${circuitState} → CLOSED (CTranslate2 recovered)`);
  }
  circuitState = "CLOSED";
  failureCount = 0;
  lastFailureTime = 0;
}

function recordFailure() {
  failureCount++;
  lastFailureTime = Date.now();
  if (failureCount >= FAILURE_THRESHOLD && circuitState !== "OPEN") {
    circuitState = "OPEN";
    console.warn(
      `[circuit-breaker] CLOSED → OPEN after ${failureCount} failures. ` +
      `CTranslate2 bypassed for ${COOLDOWN_MS / 1000}s.`
    );
  }
}

function getCircuitDecision(): "USE_CT2" | "SKIP_CT2" {
  if (circuitState === "CLOSED") return "USE_CT2";
  if (circuitState === "OPEN") {
    if (Date.now() - lastFailureTime >= COOLDOWN_MS) {
      circuitState = "HALF_OPEN";
      console.log("[circuit-breaker] OPEN → HALF_OPEN (sending probe to CTranslate2)");
      return "USE_CT2";
    }
    return "SKIP_CT2";
  }
  return "USE_CT2";
}

// ─── CTranslate2 HTTP bridge ──────────────────────────────────────────────────
async function callCTranslate2(
  text: string,
  mode: string,
  language: string,
): Promise<string> {
  const res = await fetch(`${NLP_SERVICE_URL}/api/v1/paraphrase`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, mode, language, num_variants: 1 }),
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) {
    throw new Error(`CTranslate2 HTTP ${res.status}`);
  }

  const data = (await res.json()) as { paraphrased_variants?: string[] };
  const result = data.paraphrased_variants?.[0] ?? "";

  if (!result || result.startsWith("[MOCK")) {
    throw new Error("CTranslate2 returned mock/empty result");
  }

  return result;
}

// ─── Gemini helpers ───────────────────────────────────────────────────────────
const modeInstructions: Record<string, string> = {
  standard: "natural and clear",
  academic: "formal and scholarly",
  casual: "conversational and informal",
  creative: "vivid and expressive",
  fluency: "smooth and fluent",
  formal: "professional and formal",
};

const synonymInstructions: Record<string, string> = {
  basic: "Use straightforward word substitutions only.",
  medium: "Use moderate synonym variation throughout.",
  rich: "Use rich and varied synonyms, expanding vocabulary significantly.",
};

function buildParaphrasePrompt(
  text: string,
  mode: string,
  synonym: string,
  freeze: string,
  language: string,
): string {
  const modeDesc = modeInstructions[mode] ?? "natural and clear";
  const synonymDesc = synonymInstructions[synonym] ?? "Use moderate synonym variation.";
  const freezeNote = freeze
    ? `\nDo NOT change these specific words or phrases: ${freeze}`
    : "";
  const langNote =
    language && language !== "en"
      ? `\nOutput must be in the same language as the input (${language}).`
      : "";

  return `Rewrite the following text to sound ${modeDesc}. ${synonymDesc}${freezeNote}${langNote}

Rules:
- Preserve all proper nouns, names, technical terms, numbers, and dates exactly as written
- Do not add new facts or information not present in the original
- Do not translate — keep the same language as the input
- Return only the rewritten text — no preamble, no labels, no explanation

Text:
${text}`;
}

// ─── Emit helpers ─────────────────────────────────────────────────────────────
function emitTagging(
  socket: import("socket.io").Socket,
  text: string,
  eventId: string | undefined,
  freeze: string,
) {
  const words = text.split(/\s+/).filter(Boolean);
  const taggingData = words.map((word) => {
    const clean = word.replace(/[.,?!;:'"()[\]]/g, "").toLowerCase();
    const frozen = freeze
      ? freeze
          .toLowerCase()
          .split(",")
          .map((f) => f.trim())
          .some((f) => f && clean.includes(f))
      : false;
    return { word, type: frozen ? "freeze" : "none", synonyms: [] };
  });

  socket.emit(
    "paraphrase-tagging",
    JSON.stringify({ index: 0, eventId: eventId ?? "", data: taggingData }),
  );
  socket.emit("paraphrase-tagging", ":end:");
  socket.emit(
    "paraphrase-synonyms",
    JSON.stringify({ index: 0, eventId: eventId ?? "", data: [] }),
  );
  socket.emit("paraphrase-synonyms", ":end:");
}

// ─── Per-socket rate limiter for expensive events ─────────────────────────────
const socketRateLimitMap = new Map<string, number[]>();
const SOCKET_RATE_LIMIT = 10;
const SOCKET_RATE_WINDOW_MS = 60_000;

function isSocketRateLimited(socketId: string): boolean {
  const now = Date.now();
  const timestamps = (socketRateLimitMap.get(socketId) ?? []).filter(
    (ts) => now - ts < SOCKET_RATE_WINDOW_MS,
  );
  if (timestamps.length >= SOCKET_RATE_LIMIT) return true;
  timestamps.push(now);
  socketRateLimitMap.set(socketId, timestamps);
  return false;
}

// ─── JWT verification for socket auth ─────────────────────────────────────────
const JWKS_URL =
  process.env.CONVEX_JWKS_URL ||
  `${process.env.NEXT_PUBLIC_CONVEX_URL?.replace(".convex.cloud", ".convex.site") ?? ""}/.well-known/jwks.json`;

let jwksSet: ReturnType<typeof createRemoteJWKSet> | null = null;

async function verifySocketToken(token: string): Promise<boolean> {
  if (!token) return false;
  try {
    if (!jwksSet && JWKS_URL) {
      jwksSet = createRemoteJWKSet(new URL(JWKS_URL));
    }
    if (jwksSet) {
      await jwtVerify(token, jwksSet);
      return true;
    }
    return token.length >= 32;
  } catch {
    return false;
  }
}

// ─── Server bootstrap ─────────────────────────────────────────────────────────

process.on("unhandledRejection", (reason) => {
  console.error("[server] Unhandled promise rejection:", reason);
});

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url || "/", true);
    handle(req, res, parsedUrl);
  });

  const allowedOrigins = process.env.NEXT_PUBLIC_APP_URL
    ? [process.env.NEXT_PUBLIC_APP_URL]
    : dev
    ? ["http://localhost:5000", "http://localhost:3000", /^http:\/\/localhost:\d+$/]
    : ["https://shothik.ai", "https://www.shothik.ai"];

  const io = new SocketIOServer(httpServer, {
    path: "/paraphrase/socket.io",
    cors: {
      origin: allowedOrigins,
      methods: ["GET", "POST"],
    },
    transports: ["polling", "websocket"],
    maxHttpBufferSize: 1e6,
  });

  io.use(async (socket, next) => {
    const token =
      (socket.handshake.auth as { token?: string }).token ||
      (socket.handshake.query.token as string | undefined);

    if (!token) {
      return next(new Error("Authentication required"));
    }

    const valid = await verifySocketToken(token);
    if (!valid) {
      return next(new Error("Invalid or expired token"));
    }

    next();
  });

  io.on("connection", (socket) => {
    console.log(`[paraphrase-socket] client connected: ${socket.id}`);

    socket.on(
      "paraphrase",
      async (payload: {
        text: string;
        mode?: string;
        synonym?: string;
        freeze?: string;
        language?: string;
        socketId?: string;
        eventId?: string;
      }) => {
        if (isSocketRateLimited(socket.id)) {
          socket.emit("paraphrase-error", "Rate limit exceeded. Please wait before sending more requests.");
          socket.emit("paraphrase-plain", ":end:");
          return;
        }

        const {
          text,
          mode = "standard",
          synonym = "basic",
          freeze = "",
          language = "en",
          eventId,
        } = payload;

        if (!text || text.trim().length === 0) {
          socket.emit("paraphrase-plain", ":end:");
          return;
        }

        if (text.length > 50_000) {
          socket.emit("paraphrase-error", "Text too long. Maximum 50,000 characters.");
          socket.emit("paraphrase-plain", ":end:");
          return;
        }

        // ── Try CTranslate2 (with circuit breaker) ────────────────────────────
        const isEnglishLike = ["en", "english", "en-us", "en-gb", "us", "uk"].includes(
          (language || "en").toLowerCase(),
        );
        const decision = isEnglishLike ? getCircuitDecision() : "SKIP_CT2";

        if (decision === "USE_CT2") {
          try {
            const result = await callCTranslate2(text, mode.toLowerCase(), "English");
            recordSuccess();
            console.log(`[paraphrase-socket] CTranslate2 ✓ (${result.length} chars, mode=${mode})`);

            socket.emit("paraphrase-plain", result);
            socket.emit("paraphrase-plain", ":end:");
            emitTagging(socket, result, eventId, freeze);
            return;
          } catch (err) {
            recordFailure();
            console.warn(
              `[paraphrase-socket] CTranslate2 failed (failures=${failureCount}, circuit=${circuitState}):`,
              (err as Error).message,
            );
          }
        } else if (!isEnglishLike) {
          console.log(`[paraphrase-socket] Non-English (${language}) — using Gemini (multilingual)`);
        } else {
          console.log(`[paraphrase-socket] Circuit OPEN — using Gemini directly`);
        }

        // ── Gemini fallback (streaming) ────────────────────────────────────────
        const prompt = buildParaphrasePrompt(
          text,
          mode.toLowerCase(),
          synonym.toLowerCase(),
          freeze,
          language,
        );

        try {
          const controller = new AbortController();
          const geminiTimeout = setTimeout(() => controller.abort(), 30_000);

          const geminiUrl = `${GEMINI_BASE_URL}/models/${PARAPHRASE_MODEL}:streamGenerateContent?alt=sse&key=${GEMINI_API_KEY}`;
          const geminiRes = await fetch(geminiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              system_instruction: {
                parts: [{ text: "You are a senior linguistic editor. Your job is to rewrite text in a specified style while preserving all factual content exactly. Output only the rewritten text — no labels, no explanation." }],
              },
              contents: [{ role: "user", parts: [{ text: prompt }] }],
              generationConfig: {
                maxOutputTokens: Math.max(1024, Math.ceil(text.length * 1.5)),
                temperature: 0.7,
              },
            }),
            signal: controller.signal,
          });

          if (!geminiRes.ok || !geminiRes.body) {
            throw new Error(`Gemini HTTP ${geminiRes.status}`);
          }

          const reader = geminiRes.body.getReader();
          const decoder = new TextDecoder();
          let sseBuffer = "";
          let fullText = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            if (controller.signal.aborted) break;
            sseBuffer += decoder.decode(value, { stream: true });
            const lines = sseBuffer.split("\n");
            sseBuffer = lines.pop() ?? "";
            for (const line of lines) {
              if (!line.startsWith("data: ")) continue;
              const data = line.slice(6).trim();
              if (!data || data === "[DONE]") continue;
              try {
                const parsed = JSON.parse(data);
                const token = parsed.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
                if (token) {
                  socket.emit("paraphrase-plain", token);
                  fullText += token;
                }
              } catch {}
            }
          }

          clearTimeout(geminiTimeout);
          socket.emit("paraphrase-plain", ":end:");
          if (fullText) {
            emitTagging(socket, fullText, eventId, freeze);
          }
        } catch (err) {
          console.error("[paraphrase-socket] Gemini error:", err);
          socket.emit("paraphrase-plain", ":end:");
        }
      },
    );

    socket.on("disconnect", () => {
      console.log(`[paraphrase-socket] client disconnected: ${socket.id}`);
      socketRateLimitMap.delete(socket.id);
    });
  });

  httpServer.listen(port, hostname, () => {
    console.log(`> Shothik AI ready on http://${hostname}:${port}`);
    console.log(`> Socket.io paraphrase server attached at /paraphrase/socket.io`);
    console.log(`> CTranslate2 NLP service: ${NLP_SERVICE_URL} (circuit: CLOSED)`);

    // Pre-warm critical page routes so first user visit is instant
    setTimeout(async () => {
      const base = `http://localhost:${port}`;
      const pages = ["/", "/agents", "/agents/chat"];
      console.log("[warmup] Pre-compiling critical pages...");
      for (const page of pages) {
        try {
          await fetch(`${base}${page}`);
          console.log(`[warmup] ✓ ${page}`);
        } catch {}
      }
      console.log("[warmup] Complete");
    }, 3000);
  });
});
