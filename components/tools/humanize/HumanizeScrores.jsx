import { cn } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";

const HumanizeScrores = ({ loadingAi, scores, showIndex, isMobile }) => {
  return (
    <div className="flex flex-row items-center gap-2 sm:gap-3 md:gap-3 lg:gap-10">
      <div className="flex flex-1 max-w-[500px] flex-col rounded-md border p-2">
        <p className="font-bold">Shothik AI Detector</p>

        {loadingAi ? (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
        ) : scores ? (
          <div className="flex flex-col">
            <div className="w-full">
              <Slider key={showIndex} value={[scores[showIndex]]} max={100} step={1} className="py-1" />
            </div>
            <div className="-mt-2">
              <span className="text-sm text-muted-foreground">{scores[showIndex]}% AI Written</span>
            </div>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">No score</span>
        )}
      </div>

      {/* {!loadingAi && scores[showIndex] && (
        <div
          style={{
            flex: 1,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <CustomDonutChart
            size={100}
            data={[
              { value: scores[showIndex], color: "#2E7D32" },
              { value: 100 - scores[showIndex], color: "#E8F5E9" },
            ]}
            initialSize={isMobile ? 100 : 115}
          />
        </div>
      )} */}
    </div>
  );
};

export default HumanizeScrores;
