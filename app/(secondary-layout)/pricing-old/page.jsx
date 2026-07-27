import PricingLayout from "@/components/(secondary-layout)/(pricing-page-old)/PricingLayout";
import HomeAdvertisement from "@/components/common/HomeAdvertisement";

export async function generateMetadata() {
  return {
    title: "Pricing | Shothik AI",
    description: "This is the Pricing page",
  };
}

export default function PricingPageOld() {
  return (
    <PricingLayout
      TitleContend={
        <>
          <h1 className="text-primary-foreground text-center text-3xl font-bold">
            Our pricing plan made simple.
          </h1>

          <p className="text-primary-foreground mx-auto max-w-2xl text-center">
            Discover the right plan for your needs and take advantage of
            Shothik.ai&apos;s powerful tools. Whether you&apos;re just getting
            started or need advanced features for your business, we&apos;ve got
            you covered.
          </p>
        </>
      }
    >
      <div className="container mx-auto my-20 px-4 md:my-28">
        <HomeAdvertisement />
      </div>
    </PricingLayout>
  );
}
