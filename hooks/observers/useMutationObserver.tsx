"use client";

import { useEffect, useRef } from "react";

type MutationObserverOptions = {
  childList?: boolean;
  attributes?: boolean;
  subtree?: boolean;
  attributeFilter?: string[];
  characterData?: boolean;
};

type UseMutationObserver = {
  classNames?: string;
  options?: MutationObserverOptions;
  callback?: (mutationList: MutationRecord[], mutationTarget: Element) => void;
};

export const useMutationObserver = ({
  classNames,
  options = { childList: true },
  callback,
}: UseMutationObserver) => {
  const refs = useRef<(Element | null)[]>([]);

  useEffect(() => {
    const observer = new MutationObserver((mutationsList) => {
      mutationsList.forEach((mutation) => {
        const target = mutation.target as Element;

        if (callback) {
          callback(mutationsList, target);
        }

        if (classNames) {
          if (mutation.type === "attributes" && target.classList) {
            target.classList.toggle(classNames, true);
          }
        }
      });
    });

    refs.current.forEach((element) => {
      if (element) observer.observe(element, options);
    });

    return () => {
      // Only need to call disconnect once for MutationObserver
      observer.disconnect();
    };
  }, [classNames, options, callback]);

  const setRef =
    (index: number = 0) =>
    (element: Element | null) => {
      refs.current[index] = element;
    };

  return { refs, setRef };
};
