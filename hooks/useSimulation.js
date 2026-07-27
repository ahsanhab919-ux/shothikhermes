// =============================================================================
// SIMULATION LOGIC
// =============================================================================

"use client";

import {
  getSimulationPrompt,
  isValidSimulation,
  SIMULATION_CONFIG,
} from "@/lib/simulationHelper";
import { useEffect, useRef, useState } from "react";

// Simulation detection and execution
export const useSimulation = (
  isInitialized,
  sheetAiToken,
  currentChatId,
  messages,
  isLoading,
  s_id,
  agent_type,
) => {
  const [simulationState, setSimulationState] = useState({
    isSimulation: false,
    hasRun: false,
    prompt: null,
  });

  // Use useRef to track if simulation has been processed to avoid state loops
  const simulationProcessedRef = useRef(false);
  const messagesLength = messages.length;

  useEffect(() => {
    if (!SIMULATION_CONFIG.enabled) return; // Quick disable

    const runSimulation = async () => {
      // Early returns for non-simulation scenarios
      if (
        !s_id ||
        !isInitialized ||
        !sheetAiToken ||
        isLoading ||
        simulationProcessedRef.current
      ) {
        return;
      }

      // Validation
      if (!isValidSimulation(agent_type, s_id)) {
        console.error(`Invalid simulation ${s_id} for agent ${agent_type}`);
        simulationProcessedRef.current = true;
        return;
      }

      // Prevent duplicate runs
      const simulationKey = `sim-${agent_type}-${s_id}-${currentChatId}`;
      if (sessionStorage.getItem(simulationKey) || messagesLength > 0) {
        simulationProcessedRef.current = true;
        setSimulationState((prev) => ({ ...prev, hasRun: true }));
        return;
      }

      // Mark as running
      sessionStorage.setItem(simulationKey, "true");
      simulationProcessedRef.current = true;

      const prompt = getSimulationPrompt(agent_type, s_id);
      if (!prompt) return;

      setSimulationState({
        isSimulation: true,
        hasRun: true,
        prompt: prompt,
      });

    };

    runSimulation();
  }, [
    s_id,
    agent_type,
    isInitialized,
    sheetAiToken,
    currentChatId,
    messagesLength,
    isLoading,
  ]);

  return simulationState;
};
