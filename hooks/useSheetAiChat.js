import { useCallback, useState } from "react";

// Hook for chat management
export const useSheetAiChat = () => {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const createChat = useCallback(async (name, userEmail) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL_WITH_PREFIX}/${process.env.NEXT_PUBLIC_SHEET_REDIRECT_PREFIX}/chat/create`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            "X-SheetAi-Token": localStorage.getItem("sheet-token"),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name, userEmail }),
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        setChats((prev) => [...prev, result.data]);
        return result.data;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("Failed to create chat:", error);
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const getMyChats = useCallback(async (userEmail) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/${process.env.NEXT_PUBLIC_SHEET_REDIRECT_PREFIX}/chat/my-chats`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            "X-SheetAi-Token": localStorage.getItem("sheet-token"),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userEmail }),
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        setChats(result.data);
        return result.data;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("Failed to get chats:", error);
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteChat = useCallback(async (chatId) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/${process.env.NEXT_PUBLIC_SHEET_REDIRECT_PREFIX}/chat/${chatId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        setChats((prev) => prev.filter((chat) => chat.id !== chatId));
        return result.data;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("Failed to delete chat:", error);
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    chats,
    loading,
    error,
    createChat,
    getMyChats,
    deleteChat,
  };
};
