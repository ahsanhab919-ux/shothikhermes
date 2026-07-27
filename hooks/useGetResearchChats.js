"use client";

import { useEffect, useState } from "react";

export function useGetResearchChats() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    const fetchChats = async () => {
      setIsLoading(true);
      setIsError(null);

      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/${process.env.NEXT_PUBLIC_RESEARCH_REDIRECT_PREFIX}/chat/get_my_chats`,
          {
            method: "GET",
            signal,
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
          },
        );

        if (!res.ok) {
          throw new Error(`Error: ${res.status} ${res.statusText}`);
        }

        const result = await res.json();
        setData(result);
      } catch (error) {
        if (error.name !== "AbortError") {
          setIsError(error.message || "Something went wrong");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchChats();

    return () => {
      controller.abort(); // cleanup if unmounted
    };
  }, []);

  return { data, isLoading, isError };
}
