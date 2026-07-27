export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  content: string;
  author: {
    name: string;
    role: string;
    avatar?: string;
  };
  category: BlogCategory;
  tags: string[];
  publishedAt: string;
  updatedAt?: string;
  readingTime: number;
  featured: boolean;
  image: string;
  imageAlt: string;
}

export type BlogCategory = 
  | 'academic-writing'
  | 'ai-tools'
  | 'research-tips'
  | 'grammar-style'
  | 'student-resources'
  | 'writing-guides'
  | 'tool-updates';

export interface BlogCategoryInfo {
  slug: BlogCategory;
  name: string;
  description: string;
  color: string;
}

export const BLOG_CATEGORIES: Record<BlogCategory, BlogCategoryInfo> = {
  'academic-writing': {
    slug: 'academic-writing',
    name: 'Academic Writing',
    description: 'Tips and guides for academic papers, research, and scholarly writing',
    color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  },
  'ai-tools': {
    slug: 'ai-tools',
    name: 'AI Writing Tools',
    description: 'Guides and comparisons of AI-powered writing assistants',
    color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  },
  'research-tips': {
    slug: 'research-tips',
    name: 'Research Tips',
    description: 'Research methodologies, literature reviews, and academic research strategies',
    color: 'bg-green-500/10 text-green-600 dark:text-green-400',
  },
  'grammar-style': {
    slug: 'grammar-style',
    name: 'Grammar & Style',
    description: 'Grammar rules, writing style, and language best practices',
    color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
  },
  'student-resources': {
    slug: 'student-resources',
    name: 'Student Resources',
    description: 'Resources, tips, and guides specifically for students',
    color: 'bg-pink-500/10 text-pink-600 dark:text-pink-400',
  },
  'writing-guides': {
    slug: 'writing-guides',
    name: 'Writing Guides',
    description: 'Comprehensive writing guides for various formats and purposes',
    color: 'bg-teal-500/10 text-primary',
  },
  'tool-updates': {
    slug: 'tool-updates',
    name: 'Tool Updates',
    description: 'Latest features, updates, and improvements to Shothik AI',
    color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
  },
};
