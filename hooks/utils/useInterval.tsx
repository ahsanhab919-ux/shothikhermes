"use client";

import { useEffect, useRef } from "react";

type Callback = () => void;

export function useInterval(callback: Callback, delay: number | null) {
  const savedCallback = useRef<Callback | undefined>(undefined);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay !== null) {
      const id = setInterval(
        () => savedCallback.current && savedCallback.current(),
        delay
      );
      return () => clearInterval(id);
    }
  }, [delay]);
}
