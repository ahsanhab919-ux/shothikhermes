"use client";

import { useEffect } from "react";

type MutationObserverOptions = {
  childList?: boolean;
  attributes?: boolean;
  subtree?: boolean;
  attributeFilter?: string[];
  characterData?: boolean;
};

type UseClassMutationObserver = {
  selector: string;
  classNames?: string;
  options?: MutationObserverOptions;
  callback?: (mutationList: MutationRecord[], target: Element) => void;
  dynamic?: boolean;
};

export const useClassMutationObserver = ({
  selector,
  classNames,
  options = { attributes: true },
  callback,
  dynamic = false,
}: UseClassMutationObserver) => {
  useEffect(() => {
    // Store observers for each element to disconnect on cleanup
    const elementObservers = new Map<Element, MutationObserver>();
    
    // Observe mutations on a single element
    const observeElement = (el: Element) => {
      if (elementObservers.has(el)) return;

      const observer = new MutationObserver((mutationsList) => {
        mutationsList.forEach((mutation) => {
          const target = mutation.target as Element;

          if (callback){
            callback(mutationsList, target);
          }

          if (classNames && mutation.type === "attributes") {
            target.classList.add(classNames);
          }
        });
      });

      observer.observe(el, options);
      elementObservers.set(el, observer);
    };

    const observeElements = () => {
      const safeAttr = selector.replace(/[^a-z0-9_-]/gi, "") || "default";

      const elements = document.querySelectorAll(
        `${selector}:not([data-observed-${safeAttr}])`
      );

      elements.forEach((el) => {
        el.setAttribute(`data-observed-${safeAttr}`, "true");
        observeElement(el);
      });
    };


    // Initial observation
    observeElements();

    // MutationObserver only if dynamic is true
    let mutationObserver: MutationObserver | null = null;

    if (dynamic) {
      mutationObserver = new MutationObserver((mutations) => {
        let shouldObserve = false;
        for (const mutation of mutations) {
          if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
            shouldObserve = true;
            break;
          }
        }

        if (shouldObserve) {
          // Delay to allow DOM settle
          setTimeout(observeElements, 30);
        }
      });

      mutationObserver.observe(document.body, {
        childList: true,
        subtree: true,
      });
    }

    return () => {
      elementObservers.forEach((observer) => observer.disconnect());
      mutationObserver?.disconnect();
    };
  }, [selector, classNames, options, callback, dynamic]);
};

export default useClassMutationObserver;