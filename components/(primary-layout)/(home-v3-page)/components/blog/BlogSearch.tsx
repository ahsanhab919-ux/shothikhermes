"use client";

import { Search, X } from "lucide-react";
import { useState } from "react";
import { BLOG_CATEGORIES, BlogCategory, BlogPost } from "../../lib/blog/types";

interface BlogSearchProps {
  posts: BlogPost[];
  onFilterChange: (filteredPosts: BlogPost[]) => void;
}

export function BlogSearch({ posts, onFilterChange }: BlogSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<
    BlogCategory | "all"
  >("all");

  const handleSearch = (query: string, category: BlogCategory | "all") => {
    let filtered = posts;

    // Filter by category
    if (category !== "all") {
      filtered = filtered.filter((post) => post.category === category);
    }

    // Filter by search query
    if (query.trim()) {
      const lowerQuery = query.toLowerCase();
      filtered = filtered.filter(
        (post) =>
          post.title.toLowerCase().includes(lowerQuery) ||
          post.description.toLowerCase().includes(lowerQuery) ||
          post.tags.some((tag) => tag.toLowerCase().includes(lowerQuery)) ||
          post.author.name.toLowerCase().includes(lowerQuery),
      );
    }

    onFilterChange(filtered);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    handleSearch(value, selectedCategory);
  };

  const handleCategoryChange = (category: BlogCategory | "all") => {
    setSelectedCategory(category);
    handleSearch(searchQuery, category);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    onFilterChange(posts);
  };

  const hasActiveFilters = searchQuery.trim() || selectedCategory !== "all";

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search articles by title, tags, or author..."
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="border-border bg-background text-foreground text-body2 placeholder:text-muted-foreground focus:ring-primary/20 focus:border-primary w-full rounded-lg border py-3 pr-4 pl-10 transition-all focus:ring-2 focus:outline-none"
          data-testid="input-blog-search"
        />
      </div>

      {/* Category Filter */}
      <div
        className="flex flex-wrap gap-2"
        role="group"
        aria-label="Filter by category"
      >
        <button
          className={`text-caption hover-elevate active-elevate-2 inline-flex items-center justify-center rounded-md px-3 py-1.5 font-medium transition-all ${
            selectedCategory === "all"
              ? "bg-primary text-primary-foreground"
              : "bg-background border-border text-foreground border"
          }`}
          onClick={() => handleCategoryChange("all")}
          aria-pressed={selectedCategory === "all"}
          data-testid="filter-category-all"
        >
          All Articles
        </button>
        {Object.values(BLOG_CATEGORIES).map((category) => (
          <button
            key={category.slug}
            className={`text-caption hover-elevate active-elevate-2 inline-flex items-center justify-center rounded-md px-3 py-1.5 font-medium transition-all ${
              selectedCategory === category.slug
                ? "bg-primary text-primary-foreground"
                : `bg-background border-border border ${category.color}`
            }`}
            onClick={() => handleCategoryChange(category.slug)}
            aria-pressed={selectedCategory === category.slug}
            data-testid={`filter-category-${category.slug}`}
          >
            {category.name}
          </button>
        ))}
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          className="text-body2 text-muted-foreground hover:text-primary inline-flex items-center gap-2 transition-colors"
          data-testid="button-clear-filters"
        >
          <X className="h-4 w-4" />
          Clear filters
        </button>
      )}
    </div>
  );
}
