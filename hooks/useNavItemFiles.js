"use client";

// hooks/useNavItemFiles.js
import { useState, useCallback } from "react";

const useNavItemFiles = (selectedNavItem) => {
  const [filesByNavItem, setFilesByNavItem] = useState({});

  const getCurrentFiles = useCallback(
    () => filesByNavItem[selectedNavItem]?.files || [],
    [filesByNavItem, selectedNavItem],
  );

  const getCurrentUrls = useCallback(
    () => filesByNavItem[selectedNavItem]?.urls || [],
    [filesByNavItem, selectedNavItem],
  );

  const addFiles = useCallback(
    (files, urls) => {
      setFilesByNavItem((prev) => ({
        ...prev,
        [selectedNavItem]: {
          files: [...(prev[selectedNavItem]?.files || []), ...files],
          urls: [...(prev[selectedNavItem]?.urls || []), ...urls],
        },
      }));
    },
    [selectedNavItem],
  );

  const removeFile = useCallback(
    (index) => {
      setFilesByNavItem((prev) => {
        const currentNavFiles = prev[selectedNavItem];
        if (!currentNavFiles) return prev;

        return {
          ...prev,
          [selectedNavItem]: {
            files: currentNavFiles.files.filter((_, i) => i !== index),
            urls: currentNavFiles.urls.filter((_, i) => i !== index),
          },
        };
      });
    },
    [selectedNavItem],
  );

  const clearCurrentNavItem = useCallback(() => {
    setFilesByNavItem((prev) => ({
      ...prev,
      [selectedNavItem]: { files: [], urls: [] },
    }));
  }, [selectedNavItem]);

  const clearAllNavItems = useCallback(() => {
    setFilesByNavItem({});
  }, []);

  return {
    currentFiles: getCurrentFiles(),
    currentUrls: getCurrentUrls(),
    addFiles,
    removeFile,
    clearCurrentNavItem,
    clearAllNavItems,
    filesByNavItem,
    hasFiles: getCurrentFiles().length > 0,
  };
};

export default useNavItemFiles;
