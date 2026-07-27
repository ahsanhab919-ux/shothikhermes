import { useEffect } from "react";

/**
 * Custom hook to handle keyboard shortcuts
 * @param {Object} shortcuts - Object mapping key combinations to handler functions
 * @param {boolean} enabled - Whether shortcuts are enabled (default: true)
 *
 * Example usage:
 * useKeyboardShortcuts({
 *   'ctrl+enter': () => handleSave(),
 *   'ctrl+f': () => handleParaphrase(),
 *   'ctrl+escape': () => handleClear(),
 * });
 */
const useKeyboardShortcuts = (shortcuts, enabled = true) => {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event) => {
      // Build the key combination string
      const keys = [];

      if (event.ctrlKey || event.metaKey) keys.push("ctrl");
      if (event.shiftKey) keys.push("shift");
      if (event.altKey) keys.push("alt");

      // Add the actual key (lowercase)
      if (!event.key) return;
      const key = event.key.toLowerCase();
      if (!["control", "shift", "alt", "meta"].includes(key)) {
        keys.push(key);
      }

      const combination = keys.join("+");

      // Check if this combination has a handler
      if (shortcuts[combination]) {
        event.preventDefault();
        event.stopPropagation();
        shortcuts[combination](event);
      }
    };

    // Add event listener
    window.addEventListener("keydown", handleKeyDown);

    // Cleanup
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [shortcuts, enabled]);
};

export default useKeyboardShortcuts;
