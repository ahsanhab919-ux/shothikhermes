import { BlogPost } from "../../lib/blog/types";
import { BlogCard } from "./BlogCard";

interface BlogGridProps {
  posts: BlogPost[];
  showFeatured?: boolean;
}

export function BlogGrid({ posts, showFeatured = false }: BlogGridProps) {
  if (posts.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-subtitle1 text-muted-foreground">
          No blog posts found in this category.
        </p>
      </div>
    );
  }

  const featuredPost = showFeatured ? posts.find((p) => p.featured) : null;
  const regularPosts = showFeatured
    ? posts.filter((p) => !p.featured || p !== featuredPost)
    : posts;

  return (
    <div className="space-y-8">
      {featuredPost && (
        <div data-testid="featured-post">
          <h2 className="text-h3 text-foreground mb-4 font-bold">
            Featured Post
          </h2>
          <BlogCard post={featuredPost} featured />
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {regularPosts.map((post) => (
          <BlogCard key={post.slug} post={post} />
        ))}
      </div>
    </div>
  );
}
