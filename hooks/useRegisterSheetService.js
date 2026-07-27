"use client";

import { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";

const useSheetAIToken = () => {
  const user = useSelector((state) => state.auth.user);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sheetAIToken, setSheetAIToken] = useState(null);

  const refreshSheetAIToken = useCallback(async () => {
    try {
      const accessToken = localStorage.getItem("accessToken");

      if (!accessToken) {
        setError("No access token found");
        return null;
      }

      if (!user?.email) {
        setError("Email is required");
        return null;
      }

      setIsLoading(true);
      setError(null);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL_WITH_PREFIX}/${process.env.NEXT_PUBLIC_SHEET_REDIRECT_PREFIX}/register-sheet-service`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            email: user?.email,
          }),
        },
      );

      if (!response.ok) {
        console.error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.token) {
        localStorage.setItem("sheetai-token", data.token);
        setSheetAIToken(data.token);
        return data.token;
      } else {
      }
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user?.email]);

  useEffect(() => {
    const existingToken = localStorage.getItem("accessToken");

    if (existingToken) {
      setSheetAIToken(existingToken);
    } else {
      refreshSheetAIToken();
    }
  }, [refreshSheetAIToken]);

  return {
    sheetAIToken,
    isLoading,
    error,
    refreshSheetAIToken,
  };
};

export default useSheetAIToken;
