import type { Response } from "./response.type";

export type TFeatureEndpointMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type TFeature = {
  _id: string;
  name: string;
  description?: string;
  type?: string;
  path?: string;
  sequence?: number;
  is_active?: boolean;
};

export type TFeatureEndpoint = {
  _id: string;
  feature: string | TFeature;
  name: string;
  description?: string;
  endpoint: string;
  method: TFeatureEndpointMethod;
  token: number;
  sequence?: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
};

export type TFeatureEndpointResponse = Response<TFeatureEndpoint>;
export type TFeatureEndpointsResponse = Response<TFeatureEndpoint[]>;

