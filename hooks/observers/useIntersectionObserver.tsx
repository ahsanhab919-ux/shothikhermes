"use client";

import { useEffect, useRef } from "react";

type Options = {
  threshold?: number;
  root?: Element | null;
  rootMargin?: string;
};

type UseIntersectionObserver = {
  classNames: string;
  options?: Options;
  isToggle?: boolean;
  isUnobservable?: boolean;
  callback?: (isVisible: boolean, targetElement: Element) => void;
};

export const useIntersectionObserver = ({
  classNames,
  options = { threshold: 0.1 },
  isToggle = true,
  isUnobservable = true,
  callback,
}: UseIntersectionObserver) => {
  const refs = useRef<(Element | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const { target } = entry;

        if (callback) {
          callback(entry.isIntersecting, target);
        }

        if (isToggle) {
          target.classList.toggle(classNames, entry.isIntersecting);
        } else {
          if (entry.isIntersecting) {
            target.classList.add(classNames);
            if (isUnobservable) {
              observer.unobserve(target);
            }
          }
        }
      });
    }, options);

    // Store a copy of the current refs for cleanup
    const currentRefs = [...refs.current];

    refs.current.forEach((element) => {
      if (element) observer.observe(element);
    });

    return () => {
      currentRefs.forEach((element) => {
        if (element) observer.unobserve(element);
      });
    };
  }, [classNames, options, isToggle, callback, isUnobservable]);

  const setRef =
    (index: number = 0) =>
    (element: Element | null) => {
      refs.current[index] = element;
    };

  return { refs, setRef };
};
