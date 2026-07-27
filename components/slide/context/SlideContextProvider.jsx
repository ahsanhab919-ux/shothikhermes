"use client";

import React, { createContext, useState, useContext } from "react";

// Create a context for the presentation mode
const PresentationContext = createContext();

// Custom hook to use the presentation context
export const usePresentation = () => useContext(PresentationContext);

// Provider component that wraps your app and provides presentation state
export const PresentationProvider = ({ children }) => {
  const [isPresentationOpen, setIsPresentationOpen] = useState(false);

  // Functions to control the presentation mode
  const openPresentation = () => setIsPresentationOpen(true);
  const closePresentation = () => setIsPresentationOpen(false);

  const value = { isPresentationOpen, openPresentation, closePresentation };

  return (
    <PresentationContext.Provider value={value}>
      {children}
    </PresentationContext.Provider>
  );
};
