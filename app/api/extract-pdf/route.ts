import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const maxSize = 20 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File too large. Maximum size is 20MB.' }, { status: 400 });
    }

    const name = file.name.toLowerCase();

    if (name.endsWith('.txt') || name.endsWith('.md')) {
      const text = await file.text();
      const trimmed = text.slice(0, 8000);
      return NextResponse.json({
        text: trimmed,
        preview: trimmed.slice(0, 200),
        title: file.name,
        pages: 1,
      });
    }

    if (!name.endsWith('.pdf')) {
      return NextResponse.json({ error: 'Only PDF, TXT, and Markdown files are supported.' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    let pdfParse: any;
    try {
      const mod: any = await import('pdf-parse');
      pdfParse = mod?.default ?? mod;
    } catch {
      return NextResponse.json(
        { error: 'PDF parsing is temporarily unavailable.' },
        { status: 503 }
      );
    }

    const data = await pdfParse(buffer, {
      max: 40,
    });

    const text = (data.text || '').replace(/\s+/g, ' ').trim().slice(0, 8000);

    if (!text || text.length < 10) {
      return NextResponse.json({
        text: `[Scanned PDF: ${file.name}] — This PDF appears to contain images or scanned content that could not be extracted as text.`,
        preview: `PDF · ${(file.size / 1024).toFixed(0)} KB · ${data.numpages || '?'} pages (image-based)`,
        title: file.name,
        pages: data.numpages || 0,
      });
    }

    const titleMatch = text.match(/^(.{10,120}?)[\.\n\r]/);
    const inferredTitle = titleMatch ? titleMatch[1].trim() : file.name;

    return NextResponse.json({
      text,
      preview: text.slice(0, 200),
      title: inferredTitle,
      pages: data.numpages || 0,
    });
  } catch (err: any) {
    console.error('extract-pdf error:', err);
    return NextResponse.json(
      { error: 'Failed to process the file. Please try a different format.' },
      { status: 500 }
    );
  }
}
