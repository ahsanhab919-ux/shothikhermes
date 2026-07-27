"use client";

import { useEffect } from "react";

type Options = {
  threshold?: number;
  root?: Element | null;
  rootMargin?: string;
};

type UseClassIntersectionObserver = {
  selector: string;
  classNames: string;
  options?: Options;
  isToggle?: boolean;
  isUnobservable?: boolean;
  dynamic?: boolean;
  callback?: (isVisible: boolean, targetElement: Element) => void;
};

export const useClassIntersectionObserver = ({
  selector,
  classNames,
  options = { threshold: 0 },
  isToggle = false,
  isUnobservable = true,
  dynamic = false,
  callback,
}: UseClassIntersectionObserver) => {
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const { target, isIntersecting } = entry;

        if (callback) callback(isIntersecting, target);

        if (isToggle) {
          target.classList.toggle(classNames, isIntersecting);
        } else if (isIntersecting) {
          target.classList.add(classNames);
          if (isUnobservable) {
            observer.unobserve(target);
          }
        }
      });
    }, options);

    const observeElements = () => {
      const safeAttr = selector.replace(/[^a-z0-9_-]/gi, "") || "default";

      const elements = document.querySelectorAll(
        `${selector}:not([data-observed-${safeAttr}])`,
      );
      elements.forEach((el) => {
        el.setAttribute(`data-observed-${safeAttr}`, "true");
        observer.observe(el);
      });
    };

    // Initial observe
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
      observer.disconnect();
      mutationObserver?.disconnect();
    };
  }, [
    selector,
    classNames,
    options,
    isToggle,
    isUnobservable,
    callback,
    dynamic,
  ]);
};

export default useClassIntersectionObserver;
