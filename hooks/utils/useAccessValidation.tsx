"use client";

import type { TFeatureEndpoint } from "@/types/feature-endpoint.type";
import type { TFeature } from "@/types/user-wallet.type";
import type { RootState } from "@/redux/store";
import { useMemo } from "react";
import { useSelector } from "react-redux";

type ValidationParams = {
  method: string;
  endpoint: string;
};

type ValidationResult = {
  isValid: boolean;
  error?: string;
  featureEndpoint?: TFeatureEndpoint;
};

/**
 * Hook that provides a validation function for token process
 * Validates if user has enough tokens and access to the feature endpoint
 *
 * @example
 * ```tsx
 * const validate = useTokenProcessValidation();
 *
 * const result = validate({
 *   method: "POST",
 *   endpoint: "/api/grammar-check"
 * });
 *
 * if (result.isValid) {
 *   // Proceed with API call
 * } else {
 *   // Show error: result.error
 * }
 * ```
 */
export const useAccessValidation = () => {
  const featureEndpoints = useSelector(
    (state: RootState) => state.feature_endpoints?.featureEndpoints || [],
  );
  const wallet = useSelector((state: RootState) => state.user_wallet?.wallet);

  const validate = useMemo(() => {
    return (params: ValidationParams): ValidationResult => {
      const { method, endpoint } = params;

      // Step 1: Find feature endpoint by method and endpoint
      const featureEndpoint = featureEndpoints.find(
        (fe: TFeatureEndpoint) =>
          fe.method.toUpperCase() === method.toUpperCase() &&
          fe.endpoint === endpoint &&
          fe.is_active === true,
      );

      if (!featureEndpoint) {
        return {
          isValid: false,
          error: "Feature endpoint not found or inactive",
        };
      }

      // Step 2: Validate user has enough tokens
      const userToken = wallet?.token || 0;
      const requiredToken = featureEndpoint.token || 0;

      if (userToken < requiredToken) {
        return {
          isValid: false,
          error: `Insufficient tokens. Required: ${requiredToken}, Available: ${userToken}`,
          featureEndpoint,
        };
      }

      // Step 3: Extract feature ID from feature-endpoint
      let featureId: string | null = null;

      if (typeof featureEndpoint.feature === "string") {
        featureId = featureEndpoint.feature;
      } else if (
        typeof featureEndpoint.feature === "object" &&
        featureEndpoint.feature !== null &&
        "_id" in featureEndpoint.feature
      ) {
        featureId = featureEndpoint.feature._id;
      }

      if (!featureId) {
        return {
          isValid: false,
          error: "Feature ID not found in feature endpoint",
          featureEndpoint,
        };
      }

      // Step 4: Check if feature is included in user's package features
      if (!wallet?.package) {
        return {
          isValid: false,
          error: "User does not have an active package",
          featureEndpoint,
        };
      }

      // Handle package as string (just ID)
      if (typeof wallet.package === "string") {
        return {
          isValid: false,
          error: "Package features not loaded",
          featureEndpoint,
        };
      }

      // Handle package as object
      if (
        typeof wallet.package === "object" &&
        wallet.package !== null &&
        !Array.isArray(wallet.package)
      ) {
        const packageFeatures = wallet.package.features || [];

        if (!Array.isArray(packageFeatures) || packageFeatures.length === 0) {
          return {
            isValid: false,
            error: "Package does not have any features",
            featureEndpoint,
          };
        }

        // Check if feature ID exists in package features
        const hasFeature = packageFeatures.some(
          (feature: TFeature | string) => {
            if (typeof feature === "string") {
              return feature === featureId;
            }
            if (
              typeof feature === "object" &&
              feature !== null &&
              "_id" in feature
            ) {
              return feature._id === featureId;
            }
            return false;
          },
        );

        if (!hasFeature) {
          return {
            isValid: false,
            error: `Feature not included in user's package. Feature ID: ${featureId}`,
            featureEndpoint,
          };
        }
      }

      // All validations passed
      return {
        isValid: true,
        featureEndpoint,
      };
    };
  }, [featureEndpoints, wallet]);

  return validate;
};
