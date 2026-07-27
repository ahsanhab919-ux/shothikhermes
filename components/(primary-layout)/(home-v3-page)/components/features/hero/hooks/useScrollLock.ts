import { useEffect, useRef } from "react";

export function useScrollLock(isLocked: boolean) {
  const savedScrollPosition = useRef<number>(0);

  useEffect(() => {
    if (isLocked) {
      savedScrollPosition.current = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${savedScrollPosition.current}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      window.scrollTo(0, savedScrollPosition.current);
    }
    
    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
    };
  }, [isLocked]);
}
