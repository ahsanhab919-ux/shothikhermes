"use client";
import { projectDetails } from "@/_mock/b2b/projectDetails";
import { VideoPlayer } from "../VideoPlayer";

const detectListStyle = (items) => {
  if (!items || items.length === 0) return "number";
  const firstItem = items[0];
  if (/^\s*\d+\.\s*/.test(firstItem)) return "number";
  if (/^\s*•\s*/.test(firstItem)) return "dot";
  return "number";
};

export const ProjectSection = ({ slug }) => {
  const data = projectDetails[slug];

  const getPrefix = (index, style) => {
    if (style === "number") {
      return <span className="text-foreground/80 font-bold">{index + 1}.</span>;
    } else if (style === "dot") {
      return <span className="text-foreground/80 font-bold">•</span>;
    }
    return null;
  };

  return (
    <div className="px-4 sm:px-5 md:px-6">
      {data &&
        data.map((section, index) => {
          const computedListStyle = detectListStyle(section.listItems);
          return (
            <div key={index} className="flex flex-col gap-2 text-justify">
              {section.paragraphs?.map((paragraph, pIndex) => (
                <p key={pIndex} className="text-foreground text-lg font-medium">
                  {paragraph}
                </p>
              ))}
              {section.listItems && (
                <ul className="text-foreground space-y-2 text-xl font-medium">
                  {section.listItems.map((item, lIndex) => {
                    const cleanedItem = item.replace(
                      /^(?:\s*(?:\d+\.|•))\s*/,
                      "",
                    );
                    const parts = cleanedItem.split(" – ");
                    const formattedText =
                      parts.length > 1 ? (
                        <>
                          <span className="font-semibold">{parts[0]}</span>
                          <span className="mx-1">–</span>
                          <span>{parts[1]}</span>
                        </>
                      ) : (
                        cleanedItem
                      );

                    return (
                      <li key={lIndex} className="flex">
                        <span className="mr-2">
                          {getPrefix(lIndex, computedListStyle)}
                        </span>
                        <span>{formattedText}</span>
                      </li>
                    );
                  })}
                </ul>
              )}
              {section.image && (
                <VideoPlayer
                  videoSrc={section.image.videoSrc}
                  thumbnailSrc={section.image.src}
                  isShowInfo={false}
                  isShowPlayIcon={section.image.isShowPlayIcon}
                  sx={{}}
                />
              )}
            </div>
          );
        })}
    </div>
  );
};
