export interface TemplateData {
  templateId: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  category: string;
  tags: string[];
  thumbnailUrl: string;
}

export const TEMPLATES: TemplateData[] = [
  { templateId: "academic-apa", name: "APA", description: "Standard American Psychological Association formatting.", icon: "📄", color: "bg-slate-50", category: "Academic", tags: ["apa", "research"], thumbnailUrl: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&q=80&w=400" },
  { templateId: "academic-appendix", name: "Appendix", description: "Structured layout for supplementary materials.", icon: "📂", color: "bg-slate-50", category: "Academic", tags: ["appendix", "technical"], thumbnailUrl: "https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&q=80&w=400" },
  { templateId: "academic-article", name: "Article", description: "Clean layout for academic publications.", icon: "📝", color: "bg-slate-50", category: "Academic", tags: ["article", "journal"], thumbnailUrl: "https://images.unsplash.com/photo-1512486130939-2c4f79935e4f?auto=format&fit=crop&q=80&w=400" },
  { templateId: "academic-chicago", name: "Chicago", description: "Classic Chicago/Turabian style formatting.", icon: "📋", color: "bg-slate-50", category: "Academic", tags: ["chicago", "humanities"], thumbnailUrl: "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&q=80&w=400" },
  { templateId: "academic-essay", name: "Essay", description: "General purpose essay template.", icon: "✒️", color: "bg-slate-50", category: "Academic", tags: ["essay", "writing"], thumbnailUrl: "https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?auto=format&fit=crop&q=80&w=400" },
  { templateId: "academic-harvard", name: "Harvard", description: "Harvard style referencing and layout.", icon: "🎓", color: "bg-slate-50", category: "Academic", tags: ["harvard", "referencing"], thumbnailUrl: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&q=80&w=400" },
  { templateId: "academic-ieee", name: "IEEE", description: "IEEE conference/journal paper format.", icon: "🔬", color: "bg-slate-50", category: "Academic", tags: ["ieee", "engineering"], thumbnailUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=400" },
  { templateId: "academic-lab-report", name: "Lab Report", description: "Scientific lab report template.", icon: "🧪", color: "bg-slate-50", category: "Academic", tags: ["lab", "science"], thumbnailUrl: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&q=80&w=400" },
  { templateId: "academic-literature-review", name: "Literature Review", description: "Comprehensive literature review format.", icon: "📚", color: "bg-slate-50", category: "Academic", tags: ["review", "literature"], thumbnailUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400" },
  { templateId: "academic-modern", name: "Modern Book", description: "Contemporary book layout with clean typography.", icon: "📖", color: "bg-slate-50", category: "Academic", tags: ["book", "modern"], thumbnailUrl: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=400" },
];

export const LATEX_TEMPLATES: Record<string, string> = {
  "academic-modern": `\\documentclass{article}
\\usepackage[utf8]{inputenc}
\\usepackage{amsmath}
\\usepackage{geometry}
\\usepackage{graphicx}
\\usepackage{hyperref}
\\geometry{a4paper, margin=1in}

\\title{{{TITLE}}}
\\author{{{AUTHOR}}}
\\date{\\today}

\\begin{document}

\\maketitle

{{CONTENT}}

\\end{document}`,

  "academic-ieee": `\\documentclass[10pt,twocolumn]{article}
\\usepackage[utf8]{inputenc}
\\usepackage{amsmath}
\\usepackage{graphicx}
\\usepackage{hyperref}
\\usepackage{geometry}
\\geometry{a4paper, margin=0.75in}

\\title{{{TITLE}}}
\\author{{{AUTHOR}}}

\\begin{document}

\\maketitle

{{CONTENT}}

\\end{document}`,

  "academic-apa": `\\documentclass[12pt]{article}
\\usepackage[utf8]{inputenc}
\\usepackage{amsmath}
\\usepackage{geometry}
\\usepackage{graphicx}
\\usepackage{hyperref}
\\usepackage{setspace}
\\geometry{a4paper, margin=1in}
\\doublespacing

\\title{{{TITLE}}}
\\author{{{AUTHOR}}}
\\date{\\today}

\\begin{document}

\\maketitle

{{CONTENT}}

\\end{document}`,

  "academic-chicago": `\\documentclass[12pt]{article}
\\usepackage[utf8]{inputenc}
\\usepackage{amsmath}
\\usepackage{geometry}
\\usepackage{graphicx}
\\usepackage{hyperref}
\\usepackage{setspace}
\\geometry{a4paper, margin=1in}
\\doublespacing

\\title{{{TITLE}}}
\\author{{{AUTHOR}}}
\\date{\\today}

\\begin{document}

\\maketitle

{{CONTENT}}

\\end{document}`,

  "academic-harvard": `\\documentclass[12pt]{article}
\\usepackage[utf8]{inputenc}
\\usepackage{amsmath}
\\usepackage{geometry}
\\usepackage{graphicx}
\\usepackage{hyperref}
\\geometry{a4paper, margin=1in}

\\title{{{TITLE}}}
\\author{{{AUTHOR}}}
\\date{\\today}

\\begin{document}

\\maketitle

{{CONTENT}}

\\end{document}`,

  "academic-essay": `\\documentclass[12pt]{article}
\\usepackage[utf8]{inputenc}
\\usepackage{geometry}
\\usepackage{hyperref}
\\usepackage{setspace}
\\geometry{a4paper, margin=1in}
\\doublespacing

\\title{{{TITLE}}}
\\author{{{AUTHOR}}}
\\date{\\today}

\\begin{document}

\\maketitle

{{CONTENT}}

\\end{document}`,

  "academic-article": `\\documentclass{article}
\\usepackage[utf8]{inputenc}
\\usepackage{amsmath}
\\usepackage{geometry}
\\usepackage{graphicx}
\\usepackage{hyperref}
\\geometry{a4paper, margin=1in}

\\title{{{TITLE}}}
\\author{{{AUTHOR}}}
\\date{\\today}

\\begin{document}

\\maketitle

{{CONTENT}}

\\end{document}`,

  "academic-lab-report": `\\documentclass{article}
\\usepackage[utf8]{inputenc}
\\usepackage{amsmath}
\\usepackage{geometry}
\\usepackage{graphicx}
\\usepackage{hyperref}
\\geometry{a4paper, margin=1in}

\\title{{{TITLE}}}
\\author{{{AUTHOR}}}
\\date{\\today}

\\begin{document}

\\maketitle

{{CONTENT}}

\\end{document}`,

  "academic-literature-review": `\\documentclass[12pt]{article}
\\usepackage[utf8]{inputenc}
\\usepackage{amsmath}
\\usepackage{geometry}
\\usepackage{graphicx}
\\usepackage{hyperref}
\\usepackage{setspace}
\\geometry{a4paper, margin=1in}
\\doublespacing

\\title{{{TITLE}}}
\\author{{{AUTHOR}}}
\\date{\\today}

\\begin{document}

\\maketitle

{{CONTENT}}

\\end{document}`,

  "academic-appendix": `\\documentclass{article}
\\usepackage[utf8]{inputenc}
\\usepackage{amsmath}
\\usepackage{geometry}
\\usepackage{graphicx}
\\usepackage{hyperref}
\\geometry{a4paper, margin=1in}

\\title{{{TITLE}}}
\\author{{{AUTHOR}}}
\\date{\\today}

\\begin{document}

\\maketitle

{{CONTENT}}

\\end{document}`,
};

export const DEFAULT_TEMPLATE = LATEX_TEMPLATES["academic-modern"];
