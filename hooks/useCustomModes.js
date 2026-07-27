import {
  useDeleteCustomModeMutation,
  useGetCustomModesQuery,
  useSaveCustomModesMutation,
  useTrackModeUsageMutation,
  useUpdateCustomModeMutation,
} from "@/redux/api/paraphrase/customModesApi";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";

const STORAGE_KEY = "paraphrase_custom_modes";
const MAX_RECENT_MODES = 5;

// Recommended custom modes from the platform
const RECOMMENDED_MODES = [
  "Conversational",
  "Technical",
  "Persuasive",
  "Storytelling",
  "Explanatory",
  "Summarize",
  "Elaborate",
  "Professional",
];

/**
 * Custom hook to manage paraphrase custom modes using RTK Query
 * Handles creation, deletion, and persistence of custom modes
 */
export const useCustomModes = () => {
  const { accessToken, user } = useSelector((state) => state.auth);
  const [localCustomModes, setLocalCustomModes] = useState([]);
  const [localRecentModes, setLocalRecentModes] = useState([]);
  const [error, setError] = useState(null);

  // Check if user can create custom modes (paid feature)
  const canCreateCustomModes =
    user?.package === "pro_plan" ||
    user?.package === "unlimited" ||
    user?.package === "value_plan";

  // RTK Query hooks
  const {
    data: apiData,
    isLoading: isLoadingApi,
    error: apiError,
    refetch,
  } = useGetCustomModesQuery();

  const [saveCustomModesMutation] = useSaveCustomModesMutation();
  const [updateCustomModeMutation, { isLoading: isUpdating }] =
    useUpdateCustomModeMutation();
  const [deleteCustomModeMutation, { isLoading: isDeleting }] =
    useDeleteCustomModeMutation();
  const [trackModeUsageMutation] = useTrackModeUsageMutation(); // ADD THIS

  // Load from localStorage on mount for non-authenticated users
  useEffect(() => {
    if (!accessToken) {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setLocalCustomModes(parsed.customModes || []);
          setLocalRecentModes(parsed.recentModes || []);
        } catch (err) {
          console.error("Error parsing localStorage:", err);
        }
      }
    }
  }, [accessToken]);

  // Determine which data source to use
  const customModes = accessToken
    ? apiData?.customModes || []
    : localCustomModes;
  const recentModes = accessToken
    ? apiData?.recentModes || []
    : localRecentModes;

  const isLoading = accessToken ? isLoadingApi : false;

  // Sync error from API
  useEffect(() => {
    if (apiError) {
      setError(
        apiError?.data?.error ||
        apiError?.error ||
        "Failed to load custom modes",
      );
    }
  }, [apiError]);

  /**
   * Save to localStorage (for non-authenticated users)
   */
  const saveToLocalStorage = useCallback((modes, recent) => {
    const data = {
      customModes: modes,
      recentModes: recent,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, []);

  /**
   * Add a new custom mode
   */
  const addCustomMode = useCallback(
    async (modeName) => {
      if (!modeName || !modeName.trim()) {
        setError("Mode name is required");
        return null;
      }

      const trimmedName = modeName.trim();

      // Validate mode name
      if (trimmedName.length < 2) {
        setError("Mode name must be at least 2 characters");
        return null;
      }

      if (trimmedName.length > 30) {
        setError("Mode name must be less than 30 characters");
        return null;
      }

      // Check for duplicates (case-insensitive)
      const isDuplicate = customModes.some(
        (mode) => mode.name.toLowerCase() === trimmedName.toLowerCase(),
      );

      if (isDuplicate) {
        setError("A mode with this name already exists");
        return null;
      }

      const newMode = {
        id: `custom_${Date.now()}`,
        name: trimmedName,
        isCustom: true,
        createdAt: new Date().toISOString(),
      };

      const updatedModes = [...customModes, newMode];

      // Update recent modes
      const updatedRecent = [
        trimmedName,
        ...recentModes.filter((m) => m !== trimmedName),
      ].slice(0, MAX_RECENT_MODES);

      setError(null);

      try {
        if (accessToken) {
          // Save via API
          await saveCustomModesMutation({
            customModes: updatedModes,
            recentModes: updatedRecent,
          }).unwrap();
        } else {
          // Save locally
          setLocalCustomModes(updatedModes);
          setLocalRecentModes(updatedRecent);
          saveToLocalStorage(updatedModes, updatedRecent);
        }

        return newMode;
      } catch (err) {
        console.error("Error adding custom mode:", err);
        setError(err?.data?.error || "Failed to create custom mode");
        return null;
      }
    },
    [
      customModes,
      recentModes,
      accessToken,
      saveCustomModesMutation,
      saveToLocalStorage,
    ],
  );

  /**
   * Update an existing custom mode
   */
  const updateCustomMode = useCallback(
    async (modeId, newName) => {
      if (!newName || !newName.trim()) {
        setError("Mode name is required");
        return false;
      }

      const trimmedName = newName.trim();

      // Validate
      if (trimmedName.length < 2 || trimmedName.length > 30) {
        setError("Mode name must be between 2 and 30 characters");
        return false;
      }

      // Check for duplicates excluding current mode
      const isDuplicate = customModes.some(
        (mode) =>
          mode._id !== modeId &&
          mode.id !== modeId &&
          mode.name.toLowerCase() === trimmedName.toLowerCase(),
      );

      if (isDuplicate) {
        setError("A mode with this name already exists");
        return false;
      }

      setError(null);

      try {
        if (accessToken) {
          // Update via API
          await updateCustomModeMutation({
            modeId,
            name: trimmedName,
          }).unwrap();
        } else {
          // Update locally
          const updatedModes = localCustomModes.map((mode) =>
            mode.id === modeId || mode._id === modeId
              ? {
                ...mode,
                name: trimmedName,
                updatedAt: new Date().toISOString(),
              }
              : mode,
          );
          setLocalCustomModes(updatedModes);
          saveToLocalStorage(updatedModes, localRecentModes);
        }

        return true;
      } catch (err) {
        console.error("Error updating custom mode:", err);
        setError(err?.data?.error || "Failed to update mode");
        return false;
      }
    },
    [
      customModes,
      localCustomModes,
      localRecentModes,
      accessToken,
      updateCustomModeMutation,
      saveToLocalStorage,
    ],
  );

  /**
   * Delete a custom mode
   */
  const deleteCustomMode = useCallback(
    async (modeId) => {
      setError(null);

      try {
        if (accessToken) {
          // Delete via API
          await deleteCustomModeMutation(modeId).unwrap();
        } else {
          // Delete locally
          const updatedModes = localCustomModes.filter(
            (mode) => mode.id !== modeId && mode._id !== modeId,
          );
          setLocalCustomModes(updatedModes);
          saveToLocalStorage(updatedModes, localRecentModes);
        }

        return true;
      } catch (err) {
        console.error("Error deleting custom mode:", err);
        setError(err?.data?.error || "Failed to delete mode");
        return false;
      }
    },
    [
      accessToken,
      localCustomModes,
      localRecentModes,
      deleteCustomModeMutation,
      saveToLocalStorage,
    ],
  );

  /**
   * Track usage of a mode (for recent list) - LIGHTWEIGHT
   */
  const trackModeUsage = useCallback(
    async (modeName) => {
      try {
        if (accessToken) {
          // Use lightweight track endpoint instead of full save
          await trackModeUsageMutation(modeName).unwrap();
        } else {
          // Update locally
          const updatedRecent = [
            modeName,
            ...localRecentModes.filter((m) => m !== modeName),
          ].slice(0, MAX_RECENT_MODES);
          setLocalRecentModes(updatedRecent);
          saveToLocalStorage(localCustomModes, updatedRecent);
        }
      } catch (err) {
        console.error("Error tracking mode usage:", err);
        // Don't show error to user for tracking failures
      }
    },
    [
      accessToken,
      localCustomModes,
      localRecentModes,
      trackModeUsageMutation,
      saveToLocalStorage,
    ],
  );

  /**
   * Get filtered recommended modes (excluding already created ones)
   */
  const recommendedModes = useMemo(() => {
    const customModeNames = customModes.map((m) => m?.name?.toLowerCase());
    return RECOMMENDED_MODES.filter(
      (rec) => !customModeNames.includes(rec.toLowerCase()),
    );
  }, [customModes]);

  return {
    customModes,
    recentModes,
    recommendedModes,
    isLoading: isLoading || isUpdating || isDeleting,
    error,
    canCreateCustomModes,
    addCustomMode,
    updateCustomMode,
    deleteCustomMode,
    trackModeUsage,
    refetch,
    clearError: () => setError(null),
  };
};
