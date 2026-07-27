import { useEffect, useRef, useState } from "react";

function SlidePreview({ src }) {
  const containerRef = useRef(null);
  const [scale, setScale] = useState(0.3);

  const width = 1780;
  const height = 720;

  useEffect(() => {
    const updateScale = () => {
      const container = containerRef.current;
      if (!container) return;

      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;

      const scaleX = containerWidth / width;
      const scaleY = containerHeight / height;
      const newScale = Math.min(scaleX, scaleY);
      setScale(newScale);
    };

    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, []);

  return (
    <div className="h-full overflow-hidden" ref={containerRef}>
      <iframe
        src={src}
        referrerPolicy="origin"
        className="pointer-events-auto origin-top-left overflow-hidden border-none"
        style={{
          width: `${width}px`,
          height: `${height}px`,
          transform: `scale(${scale})`,
        }}
      />
    </div>
  );
}

export default SlidePreview;
