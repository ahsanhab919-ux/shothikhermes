import api from "@/lib/api-payment";
import type {
  TFeatureEndpointResponse,
  TFeatureEndpointsResponse,
} from "@/types/feature-endpoint.type";

// ========== Feature Endpoint APIs (Public Only) ==========

// GET Public Feature Endpoints (No Auth Required)
export async function fetchPublicFeatureEndpoints(
  query?: Record<string, unknown>,
): Promise<TFeatureEndpointsResponse> {
  const response = await api.get("/api/feature-endpoints/public", {
    params: query,
  });
  return response.data as TFeatureEndpointsResponse;
}

// GET Single Public Feature Endpoint by ID (No Auth Required)
export async function fetchPublicFeatureEndpoint(
  id: string,
): Promise<TFeatureEndpointResponse> {
  const response = await api.get(`/api/feature-endpoints/${id}/public`);
  return response.data as TFeatureEndpointResponse;
}
