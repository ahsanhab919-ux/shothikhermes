export const htmlToLatex = (html: string, options?: { primaryColor?: string; accentColor?: string; font?: string }): string => {
    if (!html) return "";

    const mathBlocks: string[] = [];
    let processed = html.replace(/(\$\$[\s\S]*?\$\$)/g, (match) => {
        mathBlocks.push(match);
        return `((MB${mathBlocks.length - 1}MB))`;
    });

    const markers: Record<string, string> = {
        'H1S': '((H1S))', 'H1E': '((H1E))',
        'H2S': '((H2S))', 'H2E': '((H2E))',
        'H3S': '((H3S))', 'H3E': '((H3E))',
        'BS': '((BS))', 'BE': '((BE))',
        'IS': '((IS))', 'IE': '((IE))',
        'US': '((US))', 'UE': '((UE))',
        'ULS': '((ULS))', 'ULE': '((ULE))',
        'LIS': '((LIS))', 'LIE': '((LIE))',
        'BREAK': '((BREAK))',
        'NP': '((NP))',
        'CENTERS': '((CENTERS))', 'CENTERE': '((CENTERE))',
        'RIGHTS': '((RIGHTS))', 'RIGHTE': '((RIGHTE))',
        'CP': '((CP))', 'RP': '((RP))',
    };

    processed = processed.replace(/<h([1-3])([^>]*)>([\s\S]*?)<\/h\1>/gi, (match, level, attrs, content) => {
        let prefix = "";
        if (attrs && (/text-align:\s*center/i.test(attrs) || /data-text-align=["']center["']/i.test(attrs))) {
            prefix = markers.CP;
        } else if (attrs && (/text-align:\s*right/i.test(attrs) || /data-text-align=["']right["']/i.test(attrs))) {
            prefix = markers.RP;
        }
        const startMarker = markers[`H${level}S`];
        const endMarker = markers[`H${level}E`];
        return `${startMarker}${prefix}${content}${endMarker}`;
    });

    processed = processed.replace(/<p([^>]*)>([\s\S]*?)<\/p>/gi, (match, attrs, content) => {
        if (attrs && (/text-align:\s*center/i.test(attrs) || /data-text-align=["']center["']/i.test(attrs))) {
            return `${markers.CENTERS}${content}${markers.CENTERE}\n\n`;
        }
        if (attrs && (/text-align:\s*right/i.test(attrs) || /data-text-align=["']right["']/i.test(attrs))) {
            return `${markers.RIGHTS}${content}${markers.RIGHTE}\n\n`;
        }
        return `${content}\n\n`;
    });

    processed = processed
        .replace(/<(strong|b)[^>]*>([\s\S]*?)<\/\1>/gi, `${markers.BS}$2${markers.BE}`)
        .replace(/<(em|i)[^>]*>([\s\S]*?)<\/\1>/gi, `${markers.IS}$2${markers.IE}`)
        .replace(/<u[^>]*>([\s\S]*?)<\/u>/gi, `${markers.US}$1${markers.UE}`);

    processed = processed.replace(/{{PAGE_NUM}}/g, '\\thepage');

    processed = processed
        .replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, `\n${markers.ULS}$1${markers.ULE}\n`)
        .replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (match, content) => {
            return `\n\\begin{enumerate}\n${content}\n\\end{enumerate}\n`;
        })
        .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, `${markers.LIS}$1\n`);

    const tables: string[] = [];
    processed = processed.replace(/<table[^>]*>([\s\S]*?)<\/table>/gi, (match) => {
        const rows: string[][] = [];
        const rowMatches = match.match(/<tr[^>]*>([\s\S]*?)<\/tr>/gi);
        if (rowMatches) {
            rowMatches.forEach(row => {
                const cells: string[] = [];
                const cellMatches = row.match(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi);
                if (cellMatches) {
                    cellMatches.forEach(cell => {
                        const content = cell.replace(/<\/?t[hd][^>]*>/gi, '').trim();
                        cells.push(content);
                    });
                }
                if (cells.length > 0) rows.push(cells);
            });
        }
        if (rows.length === 0) return '';
        const cols = Math.max(...rows.map(r => r.length));
        const colSpec = Array(cols).fill('l').join(' | ');
        let latex = `\\begin{tabular}{| ${colSpec} |}\n\\hline\n`;
        rows.forEach((row, idx) => {
            while (row.length < cols) row.push('');
            latex += row.join(' & ') + ' \\\\\n\\hline\n';
        });
        latex += '\\end{tabular}';
        tables.push(latex);
        return `((TABLE${tables.length - 1}TABLE))`;
    });

    const images: string[] = [];
    processed = processed.replace(/<img[^>]*src=["']([^"']*)["'][^>]*>/gi, (match, src) => {
        const altMatch = match.match(/alt=["']([^"']*)["']/i);
        const alt = altMatch ? altMatch[1] : 'image';
        const latex = `\\begin{figure}[h]\n\\centering\n% Image: ${src}\n\\caption{${alt}}\n\\end{figure}`;
        images.push(latex);
        return `((IMG${images.length - 1}IMG))`;
    });

    processed = processed.replace(/<br\s*\/?>/gi, markers.BREAK);
    processed = processed.replace(/<hr\s*\/?>/gi, markers.NP);
    processed = processed.replace(/<div[^>]*class=["'][^"']*page-break[^"']*["'][^>]*>[\s\S]*?<\/div>/gi, markers.NP);

    processed = processed.replace(/<[^>]+>/g, '');

    processed = processed
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, ' ');

    processed = processed
        .replace(/\\/g, '\\textbackslash{}')
        .replace(/{/g, '\\{')
        .replace(/}/g, '\\}')
        .replace(/\$/g, '\\$')
        .replace(/%/g, '\\%')
        .replace(/&/g, '\\&')
        .replace(/_/g, '\\_')
        .replace(/#/g, '\\#')
        .replace(/\^/g, '\\textasciicircum{}')
        .replace(/~/g, '\\textasciitilde{}');

    processed = processed
        .replace(/[\u201C\u201D]/g, '"')
        .replace(/[\u2018\u2019]/g, "'")
        .replace(/\u2013/g, '--')
        .replace(/\u2014/g, '---');

    processed = processed
        .replace(/\(\(H1S\)\)/g, '\\section*{').replace(/\(\(H1E\)\)/g, '}\n')
        .replace(/\(\(H2S\)\)/g, '\\subsection*{').replace(/\(\(H2E\)\)/g, '}\n')
        .replace(/\(\(H3S\)\)/g, '\\subsubsection*{').replace(/\(\(H3E\)\)/g, '}\n')
        .replace(/\(\(BS\)\)/g, '\\textbf{').replace(/\(\(BE\)\)/g, '}')
        .replace(/\(\(IS\)\)/g, '\\textit{').replace(/\(\(IE\)\)/g, '}')
        .replace(/\(\(US\)\)/g, '\\underline{').replace(/\(\(UE\)\)/g, '}')
        .replace(/\(\(ULS\)\)/g, '\\begin{itemize}\n').replace(/\(\(ULE\)\)/g, '\n\\end{itemize}')
        .replace(/\(\(LIS\)\)/g, '\\item ')
        .replace(/\(\(CENTERS\)\)/g, '\\begin{center}\n').replace(/\(\(CENTERE\)\)/g, '\n\\end{center}')
        .replace(/\(\(RIGHTS\)\)/g, '\\begin{flushright}\n').replace(/\(\(RIGHTE\)\)/g, '\n\\end{flushright}')
        .replace(/\(\(BREAK\)\)/g, '\\\\\n')
        .replace(/\(\(NP\)\)/g, '\n\\newpage\n')
        .replace(/\(\(CP\)\)/g, '\\centering ')
        .replace(/\(\(RP\)\)/g, '\\raggedleft ');

    processed = processed.replace(/\(\(TABLE(\d+)TABLE\)\)/g, (m, idx) => tables[parseInt(idx)]);
    processed = processed.replace(/\(\(IMG(\d+)IMG\)\)/g, (m, idx) => images[parseInt(idx)]);
    processed = processed.replace(/\(\(MB(\d+)MB\)\)/g, (m, idx) => mathBlocks[parseInt(idx)]);

    return processed.trim();
};
