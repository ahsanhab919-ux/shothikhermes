import ErrorBoundary from "@/components/common/ErrorBoundary";
import ResearchContend from "@/components/tools/research/ResearchContend";

export async function generateMetadata() {
  return {
    title: "Research || Shothik AI",
    description: "Research description",
  };
}

const Research = () => {
  return (
    <div className="container mx-auto px-4">
      <ErrorBoundary>
        <ResearchContend />
      </ErrorBoundary>
    </div>
  );
};

export default Research;
