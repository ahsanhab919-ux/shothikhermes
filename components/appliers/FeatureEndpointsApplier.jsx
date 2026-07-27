"use client";

import { setFeatureEndpoints, setFeatureEndpointsLoading } from "@/redux/slices/feature-endpoints-slice";
import { fetchPublicFeatureEndpoints } from "@/services/feature-endpoint.service";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useDispatch } from "react-redux";

const FeatureEndpointsApplier = () => {
  const dispatch = useDispatch();

  // Fetch all feature endpoints (public API, no auth required)
  const { data: featureEndpointsResponse, isLoading: featureEndpointsQueryLoading } = useQuery({
    queryKey: ["feature-endpoints", "public", "all"],
    queryFn: async () => {
      // Fetch all active feature endpoints without pagination
      return fetchPublicFeatureEndpoints({
        is_active: true,
        limit: 1000, // Large limit to get all endpoints
        page: 1,
      });
    },
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnMount: true, // Refetch when component mounts
    staleTime: 10 * 60 * 1000, // Consider data fresh for 10 minutes
  });

  // Update Redux state when feature endpoints data changes
  useEffect(() => {
    if (featureEndpointsResponse?.data) {
      dispatch(setFeatureEndpoints(featureEndpointsResponse.data));
    }
  }, [featureEndpointsResponse?.data, dispatch]);

  // Sync loading state
  useEffect(() => {
    dispatch(setFeatureEndpointsLoading(featureEndpointsQueryLoading));
  }, [featureEndpointsQueryLoading, dispatch]);

  return null;
};

export default FeatureEndpointsApplier;

