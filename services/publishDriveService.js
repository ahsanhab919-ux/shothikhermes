const PUBLISHDRIVE_ENABLED = process.env.PUBLISHDRIVE_ENABLED === "true" ||
  process.env.NEXT_PUBLIC_PUBLISHDRIVE_ENABLED === "true";
const PUBLISHDRIVE_API_URL =
  process.env.NEXT_PUBLIC_PUBLISHDRIVE_API_URL || "https://api.publishdrive.com/v1";

const DISTRIBUTION_CHANNELS = [
  { id: "google_play", name: "Google Play Books", icon: "google", region: "Global", category: "ebook" },
  { id: "amazon_kindle", name: "Amazon Kindle", icon: "amazon", region: "Global", category: "ebook" },
  { id: "apple_books", name: "Apple Books", icon: "apple", region: "Global", category: "ebook" },
  { id: "kobo", name: "Kobo", icon: "kobo", region: "Global", category: "ebook" },
  { id: "barnes_noble", name: "Barnes & Noble Nook", icon: "bn", region: "US", category: "ebook" },
  { id: "scribd", name: "Scribd", icon: "scribd", region: "Global", category: "subscription" },
  { id: "overdrive", name: "OverDrive Libraries", icon: "overdrive", region: "Global (109 countries)", category: "library" },
  { id: "bibliotheca", name: "Bibliotheca CloudLibrary", icon: "library", region: "Global", category: "library" },
  { id: "tolino", name: "Tolino", icon: "tolino", region: "Germany/EU", category: "ebook" },
  { id: "vivlio", name: "Vivlio", icon: "vivlio", region: "France/EU", category: "ebook" },
  { id: "dangdang", name: "Dangdang", icon: "dangdang", region: "China", category: "ebook" },
  { id: "24symbols", name: "24symbols", icon: "24symbols", region: "Global", category: "subscription" },
];

function pdHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.PUBLISHDRIVE_API_KEY}`,
    "Accept": "application/json",
  };
}

function pdFileHeaders() {
  return {
    Authorization: `Bearer ${process.env.PUBLISHDRIVE_API_KEY}`,
    "Accept": "application/json",
  };
}

async function pdFetch(url, options = {}, retries = 2) {
  const timeout = options.timeout || 30000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timer);

    if (res.status === 429 && retries > 0) {
      const retryAfter = parseInt(res.headers.get("Retry-After") || "2", 10);
      await new Promise((r) => setTimeout(r, retryAfter * 1000));
      return pdFetch(url, options, retries - 1);
    }

    return res;
  } catch (err) {
    clearTimeout(timer);
    if (retries > 0 && err.name !== "AbortError") {
      await new Promise((r) => setTimeout(r, 1000));
      return pdFetch(url, options, retries - 1);
    }
    throw err;
  }
}

export function getAvailableChannels() {
  return DISTRIBUTION_CHANNELS;
}

export function isPublishDriveEnabled() {
  return PUBLISHDRIVE_ENABLED;
}

export function verifyWebhookSignature(payload, signature) {
  if (!process.env.PUBLISHDRIVE_WEBHOOK_SECRET) return false;
  const crypto = require("crypto");
  const expected = crypto
    .createHmac("sha256", process.env.PUBLISHDRIVE_WEBHOOK_SECRET)
    .update(typeof payload === "string" ? payload : JSON.stringify(payload))
    .digest("hex");
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

export async function createBookRecord(bookData) {
  if (!PUBLISHDRIVE_ENABLED) {
    return {
      success: false,
      code: "DISABLED",
      error: "PublishDrive integration is not enabled.",
    };
  }

  try {
    const res = await pdFetch(`${PUBLISHDRIVE_API_URL}/books`, {
      method: "POST",
      headers: pdHeaders(),
      body: JSON.stringify({
        title: bookData.title,
        subtitle: bookData.subtitle || undefined,
        description: bookData.description,
        language: bookData.language || "en",
        isbn: bookData.isbn || undefined,
        category: bookData.category,
        keywords: bookData.keywords || [],
        price: {
          amount: parseFloat(bookData.listPrice) || 9.99,
          currency: (bookData.currency || "USD").toUpperCase(),
        },
        author: bookData.author || "Unknown Author",
        publisher: "Shothik Publishing",
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { success: false, code: `HTTP_${res.status}`, error: err.message || `PublishDrive error ${res.status}` };
    }

    const result = await res.json();
    return { success: true, publishDriveBookId: result.id, data: result };
  } catch (err) {
    return { success: false, code: "NETWORK", error: err.message || "PublishDrive API connection failed" };
  }
}

export async function uploadManuscriptFile(publishDriveBookId, fileBuffer, mimeType = "application/epub+zip") {
  if (!PUBLISHDRIVE_ENABLED) {
    return { success: false, code: "DISABLED", error: "PublishDrive not enabled" };
  }

  try {
    const FormData = (await import("form-data")).default;
    const form = new FormData();
    form.append("file", fileBuffer, {
      filename: "manuscript.epub",
      contentType: mimeType,
    });

    const res = await pdFetch(
      `${PUBLISHDRIVE_API_URL}/books/${publishDriveBookId}/file`,
      {
        method: "POST",
        headers: {
          ...pdFileHeaders(),
          ...form.getHeaders(),
        },
        body: form,
        timeout: 120000,
      },
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { success: false, code: `HTTP_${res.status}`, error: err.message || `File upload error ${res.status}` };
    }

    return { success: true };
  } catch (err) {
    return { success: false, code: "NETWORK", error: err.message };
  }
}

export async function uploadCoverFile(publishDriveBookId, fileBuffer, mimeType = "image/jpeg") {
  if (!PUBLISHDRIVE_ENABLED) {
    return { success: false, code: "DISABLED", error: "PublishDrive not enabled" };
  }

  try {
    const FormData = (await import("form-data")).default;
    const form = new FormData();
    form.append("file", fileBuffer, {
      filename: "cover.jpg",
      contentType: mimeType,
    });

    const res = await pdFetch(
      `${PUBLISHDRIVE_API_URL}/books/${publishDriveBookId}/cover`,
      {
        method: "POST",
        headers: {
          ...pdFileHeaders(),
          ...form.getHeaders(),
        },
        body: form,
        timeout: 60000,
      },
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { success: false, code: `HTTP_${res.status}`, error: err.message || `Cover upload error ${res.status}` };
    }

    return { success: true };
  } catch (err) {
    return { success: false, code: "NETWORK", error: err.message };
  }
}

export async function submitToChannels(publishDriveBookId, channelIds) {
  if (!PUBLISHDRIVE_ENABLED) {
    return { success: false, code: "DISABLED", error: "PublishDrive not enabled" };
  }

  const selectedChannels = channelIds || DISTRIBUTION_CHANNELS.map((ch) => ch.id);

  try {
    const res = await pdFetch(
      `${PUBLISHDRIVE_API_URL}/books/${publishDriveBookId}/distribute`,
      {
        method: "POST",
        headers: pdHeaders(),
        body: JSON.stringify({ channels: selectedChannels }),
      },
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { success: false, code: `HTTP_${res.status}`, error: err.message || `Submit error ${res.status}` };
    }

    const result = await res.json();
    return { success: true, channels: result.channels || [] };
  } catch (err) {
    return { success: false, code: "NETWORK", error: err.message };
  }
}

export async function getDistributionStatus(publishDriveBookId) {
  if (!PUBLISHDRIVE_ENABLED) {
    return { success: false, code: "DISABLED", error: "PublishDrive not enabled", channels: [] };
  }

  try {
    const res = await pdFetch(
      `${PUBLISHDRIVE_API_URL}/books/${publishDriveBookId}/distribution`,
      { headers: pdHeaders() },
    );

    if (!res.ok) {
      return { success: false, code: `HTTP_${res.status}`, error: "Failed to fetch distribution status", channels: [] };
    }

    const result = await res.json();
    return { success: true, channels: result.channels || [] };
  } catch (err) {
    return { success: false, code: "NETWORK", error: err.message, channels: [] };
  }
}

export async function getCatalogEntry(publishDriveBookId) {
  if (!PUBLISHDRIVE_ENABLED) {
    return { success: false, code: "DISABLED", error: "PublishDrive not enabled" };
  }

  try {
    const res = await pdFetch(
      `${PUBLISHDRIVE_API_URL}/books/${publishDriveBookId}`,
      { headers: pdHeaders() },
    );

    if (!res.ok) {
      return { success: false, code: `HTTP_${res.status}`, error: "Failed to fetch catalog entry" };
    }

    const result = await res.json();
    return { success: true, data: result };
  } catch (err) {
    return { success: false, code: "NETWORK", error: err.message };
  }
}

export async function deleteBook(publishDriveBookId) {
  if (!PUBLISHDRIVE_ENABLED) {
    return { success: false, code: "DISABLED", error: "PublishDrive not enabled" };
  }

  try {
    const res = await pdFetch(
      `${PUBLISHDRIVE_API_URL}/books/${publishDriveBookId}`,
      { method: "DELETE", headers: pdHeaders() },
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { success: false, code: `HTTP_${res.status}`, error: err.message || `Delete error ${res.status}` };
    }

    return { success: true };
  } catch (err) {
    return { success: false, code: "NETWORK", error: err.message };
  }
}

export async function getSalesData(publishDriveBookId, period) {
  if (!PUBLISHDRIVE_ENABLED) {
    return { success: false, code: "DISABLED", error: "PublishDrive not enabled", sales: [] };
  }

  try {
    const params = period ? `?period=${encodeURIComponent(period)}` : "";
    const res = await pdFetch(
      `${PUBLISHDRIVE_API_URL}/books/${publishDriveBookId}/sales${params}`,
      { headers: pdHeaders() },
    );

    if (!res.ok) {
      return { success: false, code: `HTTP_${res.status}`, error: "Failed to fetch sales data", sales: [] };
    }

    const result = await res.json();
    return { success: true, sales: result.sales || [] };
  } catch (err) {
    return { success: false, code: "NETWORK", error: err.message, sales: [] };
  }
}

export async function uploadBookToPublishDrive(bookData) {
  return createBookRecord(bookData);
}
