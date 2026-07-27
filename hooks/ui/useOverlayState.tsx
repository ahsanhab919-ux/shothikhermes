import { useEffect, useState } from "react";

export type OverlayState = {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  onToggle: () => void;
  onOpenChange: (open: boolean) => void;
};

const useOverlayState = (
  isOpenProp?: boolean,
  setIsOpenProp?: (open: boolean) => void,
): OverlayState => {
  const [isOpen, setIsOpen] = useState(isOpenProp ?? false);

  const onOpen = () => {
    setIsOpen(true);
    setIsOpenProp?.(true);
  };

  const onClose = () => {
    setIsOpen(false);
    setIsOpenProp?.(false);
  };

  const onToggle = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    setIsOpenProp?.(newState);
  };

  const onOpenChange = (open: boolean) => {
    setIsOpen(open);
    setIsOpenProp?.(open);
  };

  useEffect(() => {
    if (typeof isOpenProp === "boolean") {
      setIsOpen(isOpenProp);
    }
  }, [isOpenProp]);

  return { isOpen, onOpen, onClose, onToggle, onOpenChange };
};

export default useOverlayState;
