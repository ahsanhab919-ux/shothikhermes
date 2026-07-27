export type CitationStyle = 'APA' | 'MLA' | 'Chicago' | 'Harvard';

interface ParsedCite {
  title: string;
  rawHtml: string;
  inlineText: string;
  authors: string[];
  year: string;
  doi: string;
}

function parseCiteTags(html: string): ParsedCite[] {
  const seen = new Set<string>();
  const results: ParsedCite[] = [];

  const citeRegex = /<cite\s+title="([^"]*)"[^>]*>([\s\S]*?)<\/cite>/gi;
  let match;
  while ((match = citeRegex.exec(html)) !== null) {
    const title = match[1].trim();
    const inlineText = match[2].replace(/<[^>]+>/g, '').trim();
    if (seen.has(title)) continue;
    seen.add(title);

    const authorMatch = inlineText.match(/\(([^,)]+)/);
    const yearMatch = inlineText.match(/(\d{4})/);
    const doiMatch = title.match(/10\.\d{4,}\/\S+/);

    results.push({
      title,
      rawHtml: match[0],
      inlineText,
      authors: authorMatch ? [authorMatch[1].trim()] : ['Unknown Author'],
      year: yearMatch ? yearMatch[1] : 'n.d.',
      doi: doiMatch ? doiMatch[0] : '',
    });
  }

  return results;
}

function formatAPA(cite: ParsedCite, num: number): string {
  const author = cite.authors[0] || 'Unknown Author';
  const doi = cite.doi ? ` https://doi.org/${cite.doi}` : '';
  return `${author} (${cite.year}). <em>${cite.title}</em>.${doi}`;
}

function formatMLA(cite: ParsedCite, num: number): string {
  const author = cite.authors[0] || 'Unknown Author';
  return `${author}. &ldquo;${cite.title}.&rdquo; ${cite.year}.`;
}

function formatChicago(cite: ParsedCite, num: number): string {
  const author = cite.authors[0] || 'Unknown Author';
  const doi = cite.doi ? ` doi:${cite.doi}.` : '';
  return `${num}. ${author}, &ldquo;${cite.title}&rdquo; (${cite.year}).${doi}`;
}

function formatHarvard(cite: ParsedCite, num: number): string {
  const author = cite.authors[0] || 'Unknown Author';
  const doi = cite.doi ? ` Available at: https://doi.org/${cite.doi}` : '';
  return `${author} (${cite.year}) <em>${cite.title}</em>.${doi}`;
}

export function generateReferenceList(html: string, style: CitationStyle): string {
  const cites = parseCiteTags(html);
  if (cites.length === 0) {
    return '';
  }

  const isNumbered = style === 'Chicago';
  const items = cites.map((cite, i) => {
    let text = '';
    switch (style) {
      case 'APA': text = formatAPA(cite, i + 1); break;
      case 'MLA': text = formatMLA(cite, i + 1); break;
      case 'Chicago': text = formatChicago(cite, i + 1); break;
      case 'Harvard': text = formatHarvard(cite, i + 1); break;
    }
    return isNumbered
      ? `<li style="margin-bottom:8px">${text}</li>`
      : `<p style="margin-bottom:8px;text-indent:-2em;padding-left:2em">${text}</p>`;
  });

  const listHtml = isNumbered
    ? `<ol>${items.join('')}</ol>`
    : items.join('');

  return `<h2>References</h2>${listHtml}`;
}

export function countCitations(html: string): number {
  return parseCiteTags(html).length;
}
