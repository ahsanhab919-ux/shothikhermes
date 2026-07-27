/**
 * Get user location based on IP address using free geolocation service
 * Uses ip-api.com (free, no API key required, 45 requests/minute limit)
 * Falls back to ipapi.co if needed
 */

type LocationData = {
  country: string;
  countryCode: string;
  region?: string;
  city?: string;
};

const LOCATION_CACHE_KEY = "user_location_cache";
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Get cached location data
 */
function getCachedLocation(): LocationData | null {
  if (typeof window === "undefined") return null;

  try {
    const cached = localStorage.getItem(LOCATION_CACHE_KEY);
    if (!cached) return null;

    const { data, timestamp } = JSON.parse(cached);
    const now = Date.now();

    // Check if cache is still valid (24 hours)
    if (now - timestamp < CACHE_DURATION) {
      return data;
    }

    // Cache expired, remove it
    localStorage.removeItem(LOCATION_CACHE_KEY);
    return null;
  } catch {
    return null;
  }
}

/**
 * Cache location data
 */
function cacheLocation(data: LocationData): void {
  if (typeof window === "undefined") return;

  try {
    const cacheData = {
      data,
      timestamp: Date.now(),
    };
    localStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify(cacheData));
  } catch {
    // Ignore localStorage errors
  }
}

/**
 * Fetch location using ip-api.com (primary)
 * Note: Free tier allows HTTPS for non-commercial use
 */
async function fetchLocationFromIpApi(): Promise<LocationData | null> {
  try {
    // Using HTTPS endpoint (free tier supports this)
    const response = await fetch(
      "https://ip-api.com/json/?fields=status,country,countryCode,region,city",
      {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      },
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (data.status === "success" && data.countryCode) {
      return {
        country: data.country || "",
        countryCode: data.countryCode || "",
        region: data.region || undefined,
        city: data.city || undefined,
      };
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Fetch location using ipapi.co (fallback)
 */
async function fetchLocationFromIpApiCo(): Promise<LocationData | null> {
  try {
    const response = await fetch("https://ipapi.co/json/", {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (data.country_code) {
      return {
        country: data.country_name || "",
        countryCode: data.country_code || "",
        region: data.region || undefined,
        city: data.city || undefined,
      };
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Get user location based on IP address
 * Returns cached data if available, otherwise fetches from API
 */
export async function getUserLocation(): Promise<LocationData | null> {
  // Check cache first
  const cached = getCachedLocation();
  if (cached) {
    return cached;
  }

  // Try primary service (ip-api.com)
  let location = await fetchLocationFromIpApi();

  // Fallback to secondary service if primary fails
  if (!location) {
    location = await fetchLocationFromIpApiCo();
  }

  // Cache the result if we got one
  if (location) {
    cacheLocation(location);
  }

  return location;
}

/**
 * Check if user is in Bangladesh
 */
export async function isUserInBangladesh(): Promise<boolean> {
  const location = await getUserLocation();
  return location?.countryCode === "BD" || location?.country === "Bangladesh";
}
