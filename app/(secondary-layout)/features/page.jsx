import Features from "@/components/(secondary-layout)/(features)/Features";

export async function generateMetadata() {
  return {
    title: "Features | Shothik AI",
    description: "This is Features page",
  };
}

export default function FaqsPage() {
  return (
      <Features />
  );
}