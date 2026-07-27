import React, { useEffect, useState } from "react";

const RADIUS = 40;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const CustomDonutChart = ({ data, initialSize = 200 }) => {
  const [chartSize, setChartSize] = useState(initialSize);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const windowWidth = window.innerWidth;
      if (windowWidth < 600) {
        setChartSize(initialSize * 0.7);
      } else if (windowWidth < 960) {
        setChartSize(initialSize * 0.85);
      } else {
        setChartSize(initialSize);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [initialSize]);

  const total = data.reduce((sum, item) => sum + item.value, 0);
  let startAngle = 0;

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative flex cursor-pointer items-center justify-center transition-transform"
      style={{ width: chartSize, height: chartSize, transform: isHovered ? "scale(1.1)" : "scale(1)" }}
    >
      <svg width={chartSize} height={chartSize} viewBox="0 0 100 100" className="text-foreground">
        <text x="50" y="50" textAnchor="middle" dominantBaseline="middle" className="fill-current"
          style={{ fontSize: isHovered ? 16 : 14 }}>
          {Math.round(data[0].value)}%
        </text>
        {data.map((item, index) => {
          const percentage = (item.value / total) * 100;
          const strokeDasharray = (percentage / 100) * CIRCUMFERENCE;
          const rotation = startAngle;
          startAngle += (percentage / 100) * 360;

          return (
            <circle
              key={index}
              cx="50"
              cy="50"
              r={RADIUS}
              fill="none"
              className={index === 0 ? "stroke-primary" : "stroke-muted"}
              strokeWidth={isHovered ? 17 : 15}
              strokeDasharray={`${strokeDasharray} ${CIRCUMFERENCE}`}
              transform={`rotate(${rotation} 50 50)`}
              style={{ transition: "stroke-width 0.2s ease, stroke-dasharray 1s ease-in-out" }}
            />
          );
        })}
      </svg>
    </div>
  );
};

export default CustomDonutChart;
