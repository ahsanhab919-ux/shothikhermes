/**
 * Geolocation API — resolves the caller's country from IP/WiFi signals.
 *
 * Used for: currency selection, pricing localization, regional content gating.
 *
 * Required env vars:
 *   GOOGLE_GEOLOCATION_KEY — Google Geolocation + Geocoding API key
 *
 * Recommended env vars:
 *   GEO_COOKIE_SECRET — dedicated HMAC secret for geo cookie signing
 *                       (falls back to API_KEY_SALT, then SESSION_SECRET)
 *                       MUST be separate from API_KEY_SALT in production
 *                       so that API key rotation doesn't invalidate geo cookies.
 *
 * Rate limit: 5 requests per hour per IP (configured in rate-limit-config.ts)
 */
import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { createHmac } from "crypto";

const COOKIE_NAME = "shothik_country";
const LEGACY_COOKIE_NAME = "country";
const COOKIE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function getCookieSecret(): string {
  return (
    process.env.GEO_COOKIE_SECRET ??
    process.env.API_KEY_SALT ??
    process.env.SESSION_SECRET ??
    "shothik-geo-fallback-change-in-production"
  );
}

function signCountry(country: string, expiresAt: number): string {
  const payload = `${country}|${expiresAt}`;
  const sig = createHmac("sha256", getCookieSecret())
    .update(payload)
    .digest("hex")
    .slice(0, 16);
  return `${country}|${expiresAt}|${sig}`;
}

function verifyCountryCookie(value: string): string | null {
  if (!value) return null;
  const parts = value.split("|");
  if (parts.length !== 3) return null;
  const [country, expiresAtStr, sig] = parts;
  const expiresAt = parseInt(expiresAtStr, 10);
  if (isNaN(expiresAt) || Date.now() > expiresAt) return null;
  const expected = createHmac("sha256", getCookieSecret())
    .update(`${country}|${expiresAt}`)
    .digest("hex")
    .slice(0, 16);
  if (sig !== expected) return null;
  return country;
}

function buildSuccessResponse(country: string, setCookie: boolean): NextResponse {
  const response = NextResponse.json({ location: country });
  response.headers.set("Vary", "Cookie");
  response.headers.set("Cache-Control", "private, no-store");

  if (setCookie) {
    const expiresAt = Date.now() + COOKIE_TTL_MS;
    const cookieValue = signCountry(country, expiresAt);
    response.cookies.set(COOKIE_NAME, cookieValue, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: COOKIE_TTL_MS / 1000,
      path: "/",
    });
  }

  return response;
}

export async function POST(req: NextRequest) {
  // 1. Check new signed cookie
  const newCookie = req.cookies.get(COOKIE_NAME)?.value;
  if (newCookie) {
    const cached = verifyCountryCookie(newCookie);
    if (cached) {
      return buildSuccessResponse(cached, false);
    }
  }

  // 2. Check legacy `country` cookie — migrate on the fly to new signed format
  const legacyCookie = req.cookies.get(LEGACY_COOKIE_NAME)?.value;
  if (legacyCookie && /^[a-z\s]{2,50}$/i.test(legacyCookie)) {
    logger.info("Migrating legacy geo cookie to signed format");
    return buildSuccessResponse(legacyCookie.toLowerCase().trim(), true);
  }

  // 3. No valid cookie — hit Google APIs
  const apiKey = process.env.GOOGLE_GEOLOCATION_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Geolocation service not configured" },
      { status: 501 },
    );
  }

  try {
    const geolocationResponse = await fetch(
      `https://www.googleapis.com/geolocation/v1/geolocate?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
    );

    if (!geolocationResponse.ok) {
      throw new Error(`Geolocation API error: ${geolocationResponse.status}`);
    }

    const geolocationData = await geolocationResponse.json();
    if (!geolocationData.location) {
      throw new Error("No location in geolocation response");
    }

    const { lat, lng } = geolocationData.location;

    const geocodingResponse = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`,
    );

    if (!geocodingResponse.ok) {
      throw new Error(`Geocoding API error: ${geocodingResponse.status}`);
    }

    const geocodingData = await geocodingResponse.json();
    if (!geocodingData.results) {
      throw new Error("No results in geocoding response");
    }

    const countryResult = geocodingData.results.find(
      (result: { types: string[]; formatted_address: string }) =>
        result.types.includes("country"),
    );

    if (!countryResult?.formatted_address) {
      throw new Error("Country not found in geocoding response");
    }

    const country = countryResult.formatted_address.toLowerCase().trim();
    return buildSuccessResponse(country, true);
  } catch (error) {
    logger.error("Geolocation error:", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Geolocation failed" },
      { status: 500 },
    );
  }
}
