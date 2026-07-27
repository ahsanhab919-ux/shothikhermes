import type { Response } from "./response.type";
import type { TFeatureEndpoint } from "./feature-endpoint.type";

export type TFeature = {
  _id: string;
  name: string;
  value?: string;
  description?: string;
  path?: string;
  prefix?: string;
  type?: string;
  sequence?: number;
  is_active?: boolean;
};

export type TFeaturePopupCategory = "single-time" | "multi-time";
export type TFeaturePopupActionType = "link" | "other";

export type TFeaturePopupAction = {
  name: string;
  path?: string;
  type: TFeaturePopupActionType;
};

export type TFeaturePopup = {
  _id: string;
  feature: string | TFeature;
  name: string;
  value: string;
  description?: string;
  image?: string;
  video?: string;
  content?: string;
  actions?: TFeaturePopupAction[];
  category: TFeaturePopupCategory;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
};

export type TFeatureWithPopups = TFeature & {
  popups?: TFeaturePopup[];
  feature_endpoints?: TFeatureEndpoint[];
};

export type TFeatureResponse = Response<TFeature>;
export type TFeaturesResponse = Response<TFeature[]>;
export type TFeaturesWithPopupsResponse = Response<TFeatureWithPopups[]>;

