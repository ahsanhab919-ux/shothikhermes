"use client";

import { loadExistingResearches } from "@/redux/slices/researchCoreSlice";
import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { QueueStatusService } from "../services/queueStatusService";

const isResearchCompleted = (research) => {
  // Check multiple indicators of completion
  const hasValidResult =
    research.result && research.result !== "Research in progress...";

  return hasValidResult;
};

export const useResearchHistory = () => {
  const dispatch = useDispatch();
  const { currentChatId } = useSelector((state) => state.researchChat);

  const loadChatResearches = useCallback(async () => {
    if (!currentChatId) return [];

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/${process.env.NEXT_PUBLIC_RESEARCH_REDIRECT_PREFIX}/research/get_chat_researches/${currentChatId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        },
      );
      const researches = await response.json();

      // Ensure researches is an array before filtering
      const researchesArray = Array.isArray(researches) ? researches : [];

      // Filter out incomplete researches (those without result)
      const completeResearches = researchesArray.filter(isResearchCompleted);

      dispatch(loadExistingResearches(completeResearches));
      return completeResearches;
    } catch (error) {
      console.error("Failed to load researches:", error);
      return [];
    }
  }, [currentChatId, dispatch]);

  const loadChatResearchesWithQueueCheck = useCallback(async () => {
    const researches = await loadChatResearches();

    // Also check queue status for comprehensive state
    let queueStats = { research: { active: 0, waiting: 0 } };
    try {
      queueStats = await QueueStatusService.getQueueStats();
    } catch (error) {
      console.error("Failed to load queue stats:", error);
    }

    return {
      researches,
      hasActiveQueue:
        queueStats?.research?.active > 0 || queueStats?.research?.waiting > 0,
      queueStats,
    };
  }, [loadChatResearches]);

  return {
    loadChatResearches,
    loadChatResearchesWithQueueCheck,
  };
};
