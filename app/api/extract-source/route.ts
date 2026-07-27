import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return NextResponse.json({ error: 'Only HTTP/HTTPS URLs are supported' }, { status: 400 });
    }

    const hostname = parsed.hostname.toLowerCase();
    const blockedPatterns = [
      /^localhost$/i,
      /^127\./,
      /^10\./,
      /^172\.(1[6-9]|2\d|3[01])\./,
      /^192\.168\./,
      /^0\./,
      /^169\.254\./,
      /^fc00:/i,
      /^fd/i,
      /^fe80:/i,
      /^::1$/,
      /^::$/,
      /\.local$/,
      /\.internal$/,
      /metadata\.google/i,
    ];

    if (blockedPatterns.some(p => p.test(hostname))) {
      return NextResponse.json({ error: 'This URL is not allowed.' }, { status: 400 });
    }

    const isYouTube =
      parsed.hostname.includes('youtube.com') ||
      parsed.hostname.includes('youtu.be');

    if (isYouTube) {
      const videoId =
        parsed.searchParams.get('v') ||
        parsed.pathname.split('/').pop() ||
        '';

      return NextResponse.json({
        type: 'youtube' as const,
        title: `YouTube Video: ${videoId}`,
        text: `[YouTube Video ID: ${videoId}] — URL: ${url}\nTranscript extraction requires additional setup. The AI will use the video URL as a reference.`,
        preview: `YouTube · ${videoId}`,
      });
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    let html: string;
    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ShothikBot/1.0)',
          Accept: 'text/html,application/xhtml+xml,text/plain',
        },
      });

      if (!res.ok) {
        return NextResponse.json(
          { error: `Could not fetch URL (status ${res.status})` },
          { status: 422 }
        );
      }

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/pdf')) {
        return NextResponse.json(
          { error: 'This URL points to a PDF. Please use the File upload instead.' },
          { status: 422 }
        );
      }

      html = await res.text();
    } catch (fetchErr: any) {
      if (fetchErr.name === 'AbortError') {
        return NextResponse.json({ error: 'Request timed out' }, { status: 408 });
      }
      return NextResponse.json(
        { error: 'Could not reach the URL. Check the link and try again.' },
        { status: 422 }
      );
    } finally {
      clearTimeout(timeoutId);
    }

    const { JSDOM } = await import('jsdom');
    const dom = new JSDOM(html, { url });
    const doc = dom.window.document;

    const selectorsToRemove = [
      'script', 'style', 'nav', 'footer', 'header', 'aside',
      'iframe', 'noscript', '[role="navigation"]', '[role="banner"]',
      '.sidebar', '.menu', '.ad', '.advertisement', '.cookie-banner',
    ];
    selectorsToRemove.forEach(sel => {
      doc.querySelectorAll(sel).forEach((el: Element) => el.remove());
    });

    const titleEl = doc.querySelector('title');
    const ogTitle = doc.querySelector('meta[property="og:title"]');
    const title =
      ogTitle?.getAttribute('content') ||
      titleEl?.textContent?.trim() ||
      parsed.hostname;

    const article = doc.querySelector('article') || doc.querySelector('main') || doc.body;
    let text = (article?.textContent || '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 8000);

    if (!text || text.length < 30) {
      text = `[Web page: ${title}] — The content could not be fully extracted. URL: ${url}`;
    }

    return NextResponse.json({
      type: 'url' as const,
      title,
      text,
      preview: text.slice(0, 200),
    });
  } catch (err: any) {
    console.error('extract-source error:', err);
    return NextResponse.json(
      { error: 'Failed to extract content from this URL.' },
      { status: 500 }
    );
  }
}
