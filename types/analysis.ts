export interface ProductAnalysis {
  analysis_id: string;
  url: string;
  timestamp: string;
  scrape_status: "success" | "partial" | "failed";

  product: {
    title: string;
    brand: string;
    category: string;
    description: string;
    price: {
      amount: number;
      currency: string;
      compare_at: number;
      model: string;
    };
    images: Array<{
      url: string;
      type: string;
      has_people: boolean;
      demographics: {
        age: string;
        gender: string;
      };
    }>;
    videos: Array<{
      url: string;
      type: string;
      duration: number;
    }>;
    key_features: string[];
    benefits: string[];
    usp: string[];
    target_audience: {
      age: string;
      gender: string;
      interests: string[];
    };
    problem_solved: string;
    use_cases: string[];
  };

  social_proof: {
    rating: number;
    review_count: number;
    top_reviews: Array<{
      text: string;
      rating: number;
      verified: boolean;
    }>;
    testimonials: Array<{
      quote: string;
      author: string;
      result: string;
    }>;
    social_stats: {
      instagram_mentions: number;
      tiktok_hashtag_views: number;
    };
    trust_badges: string[];
  };

  website: {
    headline: string;
    subheadline: string;
    cta_text: string;
    guarantees: string[];
    urgency_elements: string[];
    shipping_info: string;
    return_policy: string;
  };

  competitors: Array<{
    name: string;
    url: string;
    price: number;
    unique_angle: string;
    our_advantage: string;
  }>;

  funnel: {
    conversion_type: string;
    checkout_steps: number;
    has_upsells: boolean;
    average_order_value: number;
  };

  market: {
    seasonality: string;
    trend: string;
    competition_level: string;
    market_maturity: string;
  };

  brand: {
    tone: string;
    mission: string;
    story: string;
    values: string[];
  };
}

export interface StreamUpdate {
  step: string;
  data: Record<string, unknown>;
  timestamp: string;
}

