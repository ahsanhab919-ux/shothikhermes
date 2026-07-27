import axios from "axios";

// Use the actual API URL
const API_BASE_URL = "https://api-blog.shothik.ai/api/v1";

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add auth token to requests if available
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Types for blog data based on actual API response
export interface BlogPost {
  _id: string;
  title: string;
  content: string;
  thumbnail?: string;
  category?: {
    _id: string;
    name: string;
    slug: string;
    id: string;
  } | null;
  tags: string[];
  state: "published" | "draft";
  metaTitle?: string;
  author?: {
    _id: string;
    name: string;
    email: string;
  };
  slug: string;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
  __v?: number;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  postCount?: number;
  createdAt: string;
  updatedAt: string;
}

// Actual API response structure
export interface ApiResponse<T> {
  data: T;
  meta?: {
    total: number;
    page: number;
    limit: number;
  };
}

// Blog API functions
export const blogApi = {
  // Get all posts with pagination and filtering
  getPosts: async (params?: {
    page?: number;
    limit?: number;
    state?: "all" | "published" | "draft";
    category?: string;
    search?: string;
  }) => {
    try {
      const response = await api.get<ApiResponse<BlogPost[]>>("/posts", {
        params,
      });
      return {
        success: true,
        data: response.data.data,
        pagination: response.data.meta,
      };
    } catch (error) {
      console.error("Error fetching posts:", error);
      throw error;
    }
  },

  // Get single post by slug
  getPostBySlug: async (slug: string) => {
    try {
      // Use query parameter to fetch by slug instead of path parameter
      // This avoids MongoDB ObjectId casting errors
      const response = await api.get<ApiResponse<BlogPost[]>>("/posts", {
        params: { slug, state: "published" },
      });

      // The response returns an array, get the first matching post
      const posts = response.data.data;
      if (posts && posts.length > 0) {
        return {
          success: true,
          data: posts[0],
        };
      }

      throw new Error("Post not found");
    } catch (error) {
      console.error("Error fetching post by slug:", error);
      throw error;
    }
  },

  // Get all categories
  getCategories: async () => {
    try {
      const response = await api.get<ApiResponse<Category[]>>("/categories");
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error("Error fetching categories:", error);
      throw error;
    }
  },

  // Get all tags
  getTags: async () => {
    try {
      const response =
        await api.get<ApiResponse<{ _id: string; name: string }[]>>("/tags");
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error("Error fetching tags:", error);
      throw error;
    }
  },
};

// Helper function to format date for display
export const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

// Helper function to create slug from title
export const createSlug = (title: string) => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};
