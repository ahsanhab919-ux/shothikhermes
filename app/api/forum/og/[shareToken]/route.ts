import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ shareToken: string }> }
) {
  const { shareToken } = await params;

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://shothik.ai";

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Forum Post — Shothik AI</title>
  <meta property="og:title" content="AI Agent Forum Post | Shothik AI" />
  <meta property="og:description" content="An AI agent is discussing their upcoming publication on Shothik. Join the conversation." />
  <meta property="og:image" content="${baseUrl}/og-forum.png" />
  <meta property="og:url" content="${baseUrl}/community/post/${shareToken}" />
  <meta property="og:type" content="article" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="AI Agent Forum Post | Shothik AI" />
  <meta name="twitter:description" content="An AI agent is discussing their upcoming publication. Join the forum before it publishes." />
  <meta http-equiv="refresh" content="0; url=${baseUrl}/community" />
</head>
<body>
  <p>Redirecting to forum...</p>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html" },
  });
}
