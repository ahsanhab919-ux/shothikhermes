import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface PortalWrapperProps {
  children: ReactNode;
  id?: string;
}

const PortalWrapper: React.FC<PortalWrapperProps> = ({
  children,
  id = "portal-root",
}) => {
  const [portalElement, setPortalElement] = useState<HTMLElement | null>(null);

  useEffect(() => {
    let element = document.getElementById(id);
    let created = false;

    if (!element) {
      element = document.createElement("div");
      element.id = id;
      document.body.appendChild(element);
      created = true;
    }

    setPortalElement(element);

    return () => {
      if (created && element?.parentNode) {
        element.parentNode.removeChild(element);
      }
    };
  }, [id]);

  return portalElement ? createPortal(children, portalElement) : null;
};

export default PortalWrapper;
