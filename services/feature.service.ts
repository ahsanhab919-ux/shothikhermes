import api from "@/lib/api-payment";
import type {
  TFeaturesWithPopupsResponse,
} from "@/types/feature.type";

// ========== Feature APIs (Public Only) ==========

// GET Public Features with Popups and Endpoints (No Auth Required)
export async function fetchPublicFeaturesWithPopups(
  query?: Record<string, unknown>,
): Promise<TFeaturesWithPopupsResponse> {
  const response = await api.get("/api/features/public/with-popups", {
    params: query,
  });
  return response.data as TFeaturesWithPopupsResponse;
}

