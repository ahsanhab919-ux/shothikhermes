"use client";

import ImagesContent from "./ImagesContent";
import ResearchContent from "./ResearchContent";
import SourcesContent from "./SourcesContent";

export default function ResearchDataArea({
  selectedTab,
  research,
  isLastData,
  onSwitchTab,
}) {

  const renderContent = () => {
    switch (selectedTab) {
      case 0: // Research
        return (
          <ResearchContent
            currentResearch={research} // Pass the specific research object
            isLastData={isLastData}
            onSwitchTab={onSwitchTab}
          />
        );
      case 1: // Images
        return <ImagesContent images={research.images} />;
      case 2: // Sources
        return <SourcesContent sources={research.sources} />;
      default:
        return <ResearchContent currentResearch={research} />;
    }
  };

  return <div>{renderContent()}</div>;
}
