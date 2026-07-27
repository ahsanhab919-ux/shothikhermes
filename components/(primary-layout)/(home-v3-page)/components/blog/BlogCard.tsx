import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Clock, User } from "lucide-react";
import Link from "next/link";
import { BLOG_CATEGORIES, BlogPost } from "../../lib/blog/types";
import { formatDate } from "../../lib/blog/utils";

interface BlogCardProps {
  post: BlogPost;
  featured?: boolean;
}

export function BlogCard({ post, featured = false }: BlogCardProps) {
  const categoryInfo = BLOG_CATEGORIES[post.category];

  return (
    <Card
      className={`hover-elevate overflow-hidden transition-all ${
        featured ? "md:flex md:flex-row" : ""
      }`}
      data-testid={`blog-card-${post.slug}`}
    >
      <Link href={`/blog/${post.slug}`} className="block">
        <div
          className={`relative ${featured ? "md:w-1/2" : "w-full"} bg-muted aspect-video`}
        >
          {/* Placeholder for blog image */}
          <div className="from-primary/10 absolute inset-0 flex items-center justify-center bg-gradient-to-br to-blue-500/10">
            <span className="text-muted-foreground text-sm">
              {post.imageAlt}
            </span>
          </div>
        </div>
      </Link>

      <div className={`p-6 ${featured ? "md:w-1/2" : ""}`}>
        <div className="mb-3 flex items-center gap-2">
          <Badge
            variant="outline"
            className={categoryInfo.color}
            data-testid={`badge-category-${post.category}`}
          >
            {categoryInfo.name}
          </Badge>
          {post.featured && (
            <Badge
              variant="default"
              className="bg-primary text-primary-foreground"
            >
              Featured
            </Badge>
          )}
        </div>

        <Link href={`/blog/${post.slug}`}>
          <h3
            className={`text-foreground hover:text-primary mb-2 font-bold transition-colors ${
              featured ? "text-h3 md:text-h2" : "text-h4"
            }`}
            data-testid={`blog-title-${post.slug}`}
          >
            {post.title}
          </h3>
        </Link>

        <p className="text-body2 text-muted-foreground mb-4 line-clamp-2">
          {post.description}
        </p>

        <div className="text-caption text-muted-foreground flex items-center gap-4">
          <div className="flex items-center gap-1">
            <User className="h-3.5 w-3.5" />
            <span>{post.author.name}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            <span>{post.readingTime} min read</span>
          </div>
          <span>{formatDate(post.publishedAt)}</span>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {post.tags.slice(0, 3).map((tag, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="text-caption"
              data-testid={`tag-${tag.toLowerCase().replace(/\s+/g, "-")}`}
            >
              {tag}
            </Badge>
          ))}
        </div>
      </div>
    </Card>
  );
}
