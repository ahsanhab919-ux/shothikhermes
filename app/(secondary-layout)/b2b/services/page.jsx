import { BookACall } from "@/components/(secondary-layout)/(b2b-page)/BookACall";
import ServicesContend from "@/components/(secondary-layout)/(b2b-page)/services/ServicesContend";
import { Suspense } from "react";

export async function generateMetadata() {
  return {
    title: "B2B Services | Shothik AI",
    description: "This is B2B Services page",
  };
}

const Services = () => {
  return (
    <div className="container mx-auto px-4">
      <div className="flex flex-col gap-20">
        <Suspense fallback={null}>
          <ServicesContend />
        </Suspense>
        <BookACall />
      </div>
    </div>
  );
};

export default Services;
