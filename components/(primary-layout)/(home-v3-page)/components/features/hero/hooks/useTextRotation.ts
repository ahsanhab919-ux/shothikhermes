import { useState, useEffect } from "react";

export function useTextRotation(texts: string[], interval: number = 3000) {
  const [currentText, setCurrentText] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentText((prev) => (prev + 1) % texts.length);
    }, interval);
    return () => clearInterval(timer);
  }, [texts.length, interval]);

  return currentText;
}
