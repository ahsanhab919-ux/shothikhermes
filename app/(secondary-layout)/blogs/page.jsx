"use client";
import { CategoryTabs } from "@/components/(secondary-layout)/(blogs-page)/CategoryTabs";
import { NewsCard } from "@/components/(secondary-layout)/(blogs-page)/NewsCard";
import { blogApi, formatDate } from "@/lib/api/blog";
import { useEffect, useMemo, useState } from "react";
import gradientBluePurple from "./assets/blog.png";
import gradientTeal from "./assets/blog1.png";
import gradientGreen from "./assets/blog2.png";
import gradientDark from "./assets/blog3.png";
import gradientPink from "./assets/blog4.png";
import gradientOrange from "./assets/blog5.png";

// Fallback images for posts without thumbnails
const fallbackImages = [
  gradientBluePurple,
  gradientTeal,
  gradientGreen,
  gradientDark,
  gradientPink,
  gradientOrange,
];

const Index = () => {
  const [activeCategory, setActiveCategory] = useState("All");
  const [sortBy, setSortBy] = useState("newest");
  const [viewMode, setViewMode] = useState("grid");
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch posts and categories on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch posts and categories in parallel
        const [postsResponse, categoriesResponse] = await Promise.all([
          blogApi.getPosts({ state: "published" }),
          blogApi.getCategories(),
        ]);


        if (postsResponse.success) {
          setPosts(postsResponse.data);
        } else {
          console.warn("Posts response not successful:", postsResponse);
        }

        if (categoriesResponse.success) {
          setCategories(categoriesResponse.data);
        } else {
          console.warn(
            "Categories response not successful:",
            categoriesResponse,
          );
        }
      } catch (err) {
        console.error("Error fetching blog data:", err);
        setError(`Failed to fetch blog data: ${err.message}`);

        // Add fallback mock data for testing
        const mockPosts = [
          {
            _id: "mock-1",
            title: "Sample Blog Post - API Not Connected",
            content:
              "<p>This is a sample blog post to demonstrate the UI while the backend API is not connected.</p>",
            category: { name: "Demo" },
            createdAt: new Date().toISOString(),
            thumbnail: null,
            state: "published",
            tags: [],
          },
        ];
        setPosts(mockPosts);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Process posts for display
  const processedPosts = useMemo(() => {
    return posts.map((post, index) => ({
      slug: post.slug,
      title: post.title,
      category: post.category?.name || "Uncategorized",
      date: formatDate(post.createdAt),
      image: post.thumbnail || fallbackImages[index % fallbackImages.length],
      featured: false, // You can add featured logic later
    }));
  }, [posts]);

  // Filter and sort posts
  const filteredAndSortedPosts = useMemo(() => {
    let filtered =
      activeCategory === "All"
        ? processedPosts
        : processedPosts.filter((post) => post.category === activeCategory);

    const sorted = [...filtered].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortBy === "newest" ? dateB - dateA : dateA - dateB;
    });

    return sorted;
  }, [activeCategory, sortBy, processedPosts]);

  // Get available categories for tabs
  const availableCategories = useMemo(() => {
    const categoryNames = [
      ...new Set(processedPosts.map((post) => post.category)),
    ];
    return ["All", ...categoryNames];
  }, [processedPosts]);

  if (loading) {
    return (
      <div className="bg-background min-h-screen">
        <main className="flex-1">
          <div className="container max-w-7xl px-6 py-8">
            <h1 className="mb-8 text-4xl font-bold">Blogs</h1>
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <div className="border-primary mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2"></div>
                <p className="text-muted-foreground">Loading blog posts...</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-background min-h-screen">
        <main className="flex-1">
          <div className="container max-w-7xl px-6 py-8">
            <h1 className="mb-8 text-4xl font-bold">Blogs</h1>
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <p className="text-destructive mb-4">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="text-primary hover:underline"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      <main className="flex-1">
        <div className="container max-w-7xl px-6 py-8">
          <h1 className="mb-8 text-4xl font-bold">Blogs</h1>
          <CategoryTabs
            categories={availableCategories}
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
            sortBy={sortBy}
            onSortChange={setSortBy}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />
          <div
            className={`mt-8 ${
              viewMode === "grid"
                ? "grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
                : "flex flex-col gap-6"
            }`}
          >
            {filteredAndSortedPosts.map((post) => (
              <NewsCard
                key={post.slug}
                slug={post.slug}
                title={post.title}
                category={post.category}
                date={post.date}
                image={post.image}
                featured={post.featured}
                viewMode={viewMode}
              />
            ))}
          </div>
          {filteredAndSortedPosts.length === 0 && (
            <div className="py-16 text-center">
              <p className="text-muted-foreground">
                No posts found in this category.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Index;
