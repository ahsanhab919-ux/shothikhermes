"use client";

import gradientBluePurple from "@/app/(secondary-layout)/blogs/assets/blog.png";
import gradientTeal from "@/app/(secondary-layout)/blogs/assets/blog1.png";
import gradientGreen from "@/app/(secondary-layout)/blogs/assets/blog2.png";
import gradientDark from "@/app/(secondary-layout)/blogs/assets/blog3.png";
import gradientPink from "@/app/(secondary-layout)/blogs/assets/blog4.png";
import gradientOrange from "@/app/(secondary-layout)/blogs/assets/blog5.png";
import { NewsCard } from "@/components/(secondary-layout)/(blogs-page)/NewsCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { blogApi, formatDate } from "@/lib/api/blog";
import { sanitizeHtml } from "@/lib/sanitize";
import { ArrowLeft, Share2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

// Fallback images
const fallbackImages = [
  gradientBluePurple,
  gradientTeal,
  gradientGreen,
  gradientDark,
  gradientPink,
  gradientOrange,
];

export default function ArticleDetailClient({ slug }) {
  const [post, setPost] = useState(null);
  const [relatedPosts, setRelatedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch post data on component mount
  useEffect(() => {
    if (!slug) {
      console.error("No post slug provided!");
      setError("No post slug provided");
      setLoading(false);
      return;
    }

    const fetchPost = async () => {
      try {
        setLoading(true);

        // Fetch specific post by slug
        const postResponse = await blogApi.getPostBySlug(slug);

        if (postResponse.success) {
          setPost(postResponse.data);

          // Fetch related posts (same category)
          const allPostsResponse = await blogApi.getPosts({
            state: "published",
          });

          if (allPostsResponse.success) {
            const related = allPostsResponse.data
              .filter(
                (p) =>
                  p.category?.name === postResponse.data.category?.name &&
                  p._id !== postResponse.data._id,
              )
              .slice(0, 3);
            setRelatedPosts(related);
          }
        } else {
          console.warn("Post response not successful:", postResponse);
        }
      } catch (err) {
        console.error("Error fetching article:", err);
        setError(`Failed to fetch article: ${err.message}`);

        // Add fallback mock data
        const mockPost = {
          _id: "mock-1",
          title: "Sample Article - API Not Connected",
          content:
            "<p>This is a sample article to demonstrate UI while backend API is not connected.</p><h2>Sample Section</h2><p>Here is some sample content to show how the blog post layout works.</p>",
          category: "Demo",
          createdAt: new Date().toISOString(),
          thumbnail: null,
          state: "published",
          tags: [],
        };
        setPost(mockPost);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [slug]);

  const handleShare = () => {
    if (navigator.share && post) {
      navigator.share({
        title: post.title,
        url: window.location.href,
      });
    }
  };

  if (loading) {
    return (
      <div className="bg-background min-h-screen">
        <div className="container max-w-4xl px-6 py-16">
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="border-primary mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2"></div>
              <p className="text-muted-foreground">Loading article...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="bg-background min-h-screen">
        <div className="container max-w-4xl px-6 py-16">
          <h1 className="text-4xl font-bold">Article not found</h1>
          <p className="text-muted-foreground mb-8">
            {error || "The article you are looking for does not exist."}
          </p>
          <Link href="/blogs">
            <Button className="mt-8">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Blogs
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Process post for display
  const processedPost = {
    ...post,
    image: post.thumbnail || fallbackImages[0],
    date: formatDate(post.createdAt),
    categoryName: post.category?.name || "Uncategorized",
  };

  // Process related posts for NewsCard
  const processedRelatedPosts = relatedPosts.map((relatedPost, index) => ({
    slug: relatedPost.slug,
    title: relatedPost.title,
    category: relatedPost.category?.name || "Uncategorized",
    date: formatDate(relatedPost.createdAt),
    image:
      relatedPost.thumbnail ||
      fallbackImages[index + (1 % fallbackImages.length)],
  }));

  return (
    <div className="bg-background min-h-screen">
      <div className="container max-w-4xl px-6 py-8">
        <Link href="/blogs">
          <Button variant="ghost" className="mb-8">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Blogs
          </Button>
        </Link>

        <article>
          <div className="mb-6 flex items-center gap-2">
            <Badge variant="secondary">{processedPost.categoryName}</Badge>
            <span className="text-muted-foreground text-sm">
              {processedPost.date}
            </span>
          </div>

          <h1 className="mb-8 text-4xl leading-tight font-bold text-black md:text-5xl dark:text-white">
            {processedPost.title}
          </h1>

          <div className="relative mb-12 aspect-video overflow-hidden rounded-2xl">
            <img
              src={
                typeof processedPost.image === "string"
                  ? processedPost.image
                  : processedPost.image?.src || processedPost.image
              }
              alt={processedPost.title}
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

          <style jsx global>{`
            .blog-content * {
              color: inherit !important;
            }
            .blog-content h1,
            .blog-content h2,
            .blog-content h3,
            .blog-content h4,
            .blog-content h5,
            .blog-content h6,
            .blog-content p,
            .blog-content span,
            .blog-content li,
            .blog-content td,
            .blog-content th,
            .blog-content strong,
            .blog-content em,
            .blog-content b,
            .blog-content i,
            .blog-content div,
            .blog-content label {
              color: black !important;
            }
            .dark .blog-content h1,
            .dark .blog-content h2,
            .dark .blog-content h3,
            .dark .blog-content h4,
            .dark .blog-content h5,
            .dark .blog-content h6,
            .dark .blog-content p,
            .dark .blog-content span,
            .dark .blog-content li,
            .dark .blog-content td,
            .dark .blog-content th,
            .dark .blog-content strong,
            .dark .blog-content em,
            .dark .blog-content b,
            .dark .blog-content i,
            .dark .blog-content div,
            .dark .blog-content label {
              color: white !important;
            }
            .blog-content a {
              color: hsl(var(--primary)) !important;
            }
            .blog-content pre,
            .blog-content code {
              background-color: #f3f4f6 !important;
            }
            .dark .blog-content pre,
            .dark .blog-content code {
              background-color: #1f2937 !important;
            }
          `}</style>
          <div
            className="blog-content prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(processedPost.content) }}
          />
        </article>

        {processedRelatedPosts.length > 0 && (
          <div className="border-border mt-16 border-t pt-16">
            <h2 className="mb-8 text-3xl font-bold">Related Articles</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {processedRelatedPosts.map((relatedArticle) => (
                <NewsCard
                  key={relatedArticle.slug}
                  slug={relatedArticle.slug}
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
}
