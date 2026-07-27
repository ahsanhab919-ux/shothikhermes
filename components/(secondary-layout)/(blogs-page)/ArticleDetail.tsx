// "use client"
import { NewsCard } from "@/components/(secondary-layout)/(blogs-page)/NewsCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { sanitizeHtml } from "@/lib/sanitize";
import { ArrowLeft, Share2 } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import gradientBluePurple from "../assets/blog.png";
import gradientTeal from "../assets/blog1.png";
import gradientGreen from "../assets/blog2.png";
import gradientDark from "../assets/blog3.png";
import gradientPink from "../assets/blog4.png";
import gradientOrange from "../assets/blog5.png";

const articles = [
  {
    id: 1,
    title: "Introducing Next-Gen AI Models with Enhanced Capabilities",
    category: "Product",
    date: "Nov 12, 2025",
    image: gradientBluePurple,
    content: `
      <p>We're excited to announce our latest generation of AI models, representing a significant leap forward in artificial intelligence capabilities. These models demonstrate unprecedented performance across a wide range of tasks while maintaining our commitment to safety and reliability.</p>
      
      <h2>Key Improvements</h2>
      <p>The new models feature enhanced reasoning capabilities, improved context understanding, and better performance on complex tasks. Our testing shows significant improvements in areas such as code generation, creative writing, and analytical reasoning.</p>
      
      <h2>Technical Innovations</h2>
      <p>We've implemented several groundbreaking techniques to achieve these improvements. Our novel training approach combines advanced machine learning methods with extensive human feedback, resulting in models that are both more capable and more aligned with human values.</p>
      
      <h2>Safety and Alignment</h2>
      <p>Safety remains our top priority. We've invested heavily in ensuring these models are robust, reliable, and aligned with human intentions. Our comprehensive testing includes adversarial evaluations and real-world scenario testing.</p>
      
      <h2>Availability</h2>
      <p>The new models are now available through our API to all users. We're excited to see what you'll build with these enhanced capabilities and look forward to your feedback.</p>
    `,
  },
  {
    id: 2,
    title: "Building Safe AI Systems for Everyone",
    category: "Safety",
    date: "Nov 10, 2025",
    image: gradientGreen,
    content: `
      <p>AI safety is not just a technical challenge—it's a collaborative effort that requires input from diverse perspectives. Today, we're sharing our approach to building AI systems that are safe, reliable, and beneficial for all.</p>
      
      <h2>Our Safety Framework</h2>
      <p>Our comprehensive safety framework encompasses multiple layers of protection, from model training to deployment. We employ rigorous testing protocols and continuous monitoring to ensure our systems behave as intended.</p>
      
      <h2>Community Engagement</h2>
      <p>We believe in the importance of community feedback and external collaboration. Our red teaming program brings together security researchers, ethicists, and domain experts to identify potential issues before deployment.</p>
    `,
  },
  {
    id: 3,
    title: "New Research on Large Language Models",
    category: "Research",
    date: "Nov 8, 2025",
    image: gradientDark,
    content: `
      <p>Our research team has made significant breakthroughs in understanding how large language models process and generate information. These findings have important implications for the future development of AI systems.</p>
      
      <h2>Key Findings</h2>
      <p>We've discovered novel patterns in how models represent knowledge and handle different types of reasoning tasks. These insights are helping us design more efficient and capable systems.</p>
    `,
  },
  {
    id: 4,
    title: "Developer Tools for AI Integration",
    category: "Engineering",
    date: "Nov 5, 2025",
    image: gradientTeal,
    content: `
      <p>We're launching a comprehensive suite of developer tools designed to make AI integration easier and more powerful than ever. These tools reflect feedback from thousands of developers in our community.</p>
      
      <h2>New Features</h2>
      <p>Our updated SDK includes improved debugging capabilities, better error handling, and enhanced performance monitoring. We've also added support for streaming responses and function calling.</p>
    `,
  },
  {
    id: 5,
    title: "AI Safety Standards and Best Practices",
    category: "Safety",
    date: "Nov 3, 2025",
    image: gradientPink,
    content: `
      <p>As AI technology becomes more prevalent, establishing clear safety standards is crucial. We're working with industry partners and policymakers to develop comprehensive guidelines.</p>
      
      <h2>Industry Collaboration</h2>
      <p>We believe safety is a collective responsibility. That's why we're actively participating in industry-wide initiatives to establish best practices and safety standards.</p>
    `,
  },
  {
    id: 6,
    title: "Company Updates and Future Roadmap",
    category: "Company",
    date: "Nov 1, 2025",
    image: gradientOrange,
    content: `
      <p>As we look to the future, we're excited to share updates on our progress and vision. Our mission remains unchanged: to ensure that artificial intelligence benefits all of humanity.</p>
      
      <h2>Recent Milestones</h2>
      <p>This year has been transformative. We've expanded our team, launched new products, and made significant progress on our research goals. But we're just getting started.</p>
    `,
  },
];

const ArticleDetail = () => {
  const { id } = useParams();
  const article = articles.find((a) => a.id === Number(id));

  if (!article) {
    return (
      <div className="bg-background min-h-screen">
        <div className="container max-w-4xl px-6 py-16">
          <h1 className="text-4xl font-bold">Article not found</h1>
          <Link href="/">
            <Button className="mt-8">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to News
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const relatedArticles = articles
    .filter((a) => a.category === article.category && a.id !== article.id)
    .slice(0, 3);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: article.title,
        url: window.location.href,
      });
    }
  };

  return (
    <div className="bg-background min-h-screen">
      <div className="container max-w-4xl px-6 py-8">
        <Link href="/">
          <Button variant="ghost" className="mb-8">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to News
          </Button>
        </Link>

        <article>
          <div className="mb-6 flex items-center gap-2">
            <Badge variant="secondary">{article.category}</Badge>
            <span className="text-muted-foreground text-sm">
              {article.date}
            </span>
          </div>

          <h1 className="mb-8 text-4xl leading-tight font-bold md:text-5xl">
            {article.title}
          </h1>

          <div className="relative mb-12 aspect-video overflow-hidden rounded-2xl">
            <img
              src={article.image.src}
              alt={article.title}
              className="h-full w-full object-cover"
            />
          </div>

          <div className="border-border mb-8 flex items-center justify-between border-b pb-4">
            <div className="text-muted-foreground text-sm">
              <span>Share this article</span>
            </div>
            <Button variant="ghost" size="sm" onClick={handleShare}>
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>
          </div>

          <div
            className="prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(article.content) }}
          />
        </article>

        {relatedArticles.length > 0 && (
          <div className="border-border mt-16 border-t pt-16">
            <h2 className="mb-8 text-3xl font-bold">Related Articles</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {relatedArticles.map((relatedArticle) => (
                <NewsCard
                  key={relatedArticle.id}
                  slug={relatedArticle.id.toString()}
                  title={relatedArticle.title}
                  category={relatedArticle.category}
                  date={relatedArticle.date}
                  image={relatedArticle.image}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ArticleDetail;
