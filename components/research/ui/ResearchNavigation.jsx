import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { setActiveResearch } from "@/redux/slices/researchCoreSlice";
import { useDispatch, useSelector } from "react-redux";

export default function ResearchNavigation() {
  const { researches, activeResearchIndex } = useSelector(
    (state) => state.researchCore,
  );
  const dispatch = useDispatch();

  const handleTabChange = (value) => {
    dispatch(setActiveResearch(parseInt(value, 10)));
  };

  if (!researches || researches.length <= 1) {
    return null;
  }

  return (
    <div className="border-border mb-2 border-b">
      <Tabs
        value={String(activeResearchIndex)}
        onValueChange={handleTabChange}
        className="w-full"
      >
        <TabsList className="h-auto w-full justify-start rounded-none border-0 bg-transparent p-0">
          {researches.map((research, index) => (
            <TabsTrigger
              key={research._id || `research-${index}`}
              value={String(index)}
              className={cn(
                "min-w-[120px] rounded-none border-0 border-b-2 border-transparent bg-transparent text-sm font-normal transition-none",
                "data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none",
              )}
            >
              {index + 1}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
}
