"use client";

import { useEffect, useMemo, useState } from "react";

type LocationSource = "ipwho-is" | "geojs" | "ip-api" | "cache" | null;

interface UserLocationResult {
  country: string | null;
  countryCode: string | null;
  source: LocationSource;
  loading: boolean;
  error: string | null;
  isBangladesh: boolean | null; // null when location not determined yet
}

const LOCATION_CACHE_KEY = "user_location_cache";
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

interface LocationData {
  country: string;
  countryCode: string;
}

interface CachedLocation {
  data: LocationData;
  timestamp: number;
}

function getCachedLocation(): LocationData | null {
  if (globalThis.window === undefined) return null;

  try {
    const cached = localStorage.getItem(LOCATION_CACHE_KEY);
    if (!cached) return null;

    const { data, timestamp }: CachedLocation = JSON.parse(cached);
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

function cacheLocation(data: LocationData): void {
  if (globalThis.window === undefined) return;

  try {
    const cacheData: CachedLocation = {
      data,
      timestamp: Date.now(),
    };
    localStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify(cacheData));
  } catch {
    // Ignore localStorage errors
  }
}

export const useUserLocation = (): UserLocationResult => {
  const [country, setCountry] = useState<string | null>(null);
  const [countryCode, setCountryCode] = useState<string | null>(null);
  const [source, setSource] = useState<LocationSource>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const detectLocation = async () => {
      try {
        setLoading(true);
        setError(null);

        // Check cache first
        const cached = getCachedLocation();
        if (cached) {
          setCountry(cached.country);
          setCountryCode(cached.countryCode);
          setSource("cache");
          setLoading(false);
          return;
        }

        // Try ipwho.is first (free, unlimited, no API key required)
        let location = null;
        try {
          const ipwhoRes = await fetch("https://ipwho.is/");
          if (ipwhoRes.ok) {
            const ipwhoData = await ipwhoRes.json();
            if (ipwhoData.success && ipwhoData.country_code) {
              location = {
                country: ipwhoData.country || "",
                countryCode: ipwhoData.country_code || "",
              };
              setCountry(location.country);
              setCountryCode(location.countryCode);
              setSource("ipwho-is");
              cacheLocation(location);
              setLoading(false);
              return;
            }
          }
        } catch {
          // Continue to fallback
        }

        // Fallback to geojs.io (free, simple, no API key required)
        try {
          const geojsRes = await fetch(
            "https://get.geojs.io/v1/ip/country.json",
          );
          if (geojsRes.ok) {
            const geojsData = await geojsRes.json();
            if (geojsData.country_code) {
              location = {
                country: geojsData.country || "",
                countryCode: geojsData.country_code || "",
              };
              setCountry(location.country);
              setCountryCode(location.countryCode);
              setSource("geojs");
              cacheLocation(location);
              setLoading(false);
              return;
            }
          }
        } catch {
          // Continue to fallback
        }

        // Fallback to ip-api.com (if it works again)
        try {
          const ipApiRes = await fetch(
            "https://ip-api.com/json/?fields=status,country,countryCode",
          );
          if (ipApiRes.ok) {
            const ipApiData = await ipApiRes.json();
            if (ipApiData.status === "success" && ipApiData.countryCode) {
              location = {
                country: ipApiData.country || "",
                countryCode: ipApiData.countryCode || "",
              };
              setCountry(location.country);
              setCountryCode(location.countryCode);
              setSource("ip-api");
              cacheLocation(location);
              setLoading(false);
              return;
            }
          }
        } catch (err) {
          setError(
            err instanceof Error ? err.message : "Failed to fetch location",
          );
        }

        // If both IP services fail, location remains null
        // This is fine - isBangladesh will be null and all payment methods will show
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    detectLocation();
  }, []);

  const isBangladesh = useMemo(() => {
    // Return null if location not determined yet
    if (!countryCode && !country) {
      return false;
    }
    // Check if Bangladesh
    // return true;
    return countryCode === "BD" || country === "Bangladesh";
  }, [countryCode, country]);

  return {
    country,
    countryCode,
    source,
    loading,
    error,
    isBangladesh,
  };
};
