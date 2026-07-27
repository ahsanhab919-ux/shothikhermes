import DotFlashing from "@/components/common/DotFlashing";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";
import { useGetAppModeQuery } from "@/redux/api/pricing/pricingApi";
import { useSearchParams } from "next/navigation";
import PricingButton from "./PricingButton";

const PricingSlider = ({ paymentMethod, country, data, yearly, user }) => {
  const payload = [];

  data?.forEach((plan, index) => {
    const { bn, global } = plan;
    const {
      amount_monthly: priceMonthly,
      amount_yearly: priceYearly,
      yearly_plan_available,
    } = country === "bangladesh" ? bn : country === "india" ? plan.in : global;

    const price = yearly ? priceYearly : priceMonthly;
    if (yearly) {
      if (yearly_plan_available) {
        payload.push({
          price: price,
          currency:
            country === "bangladesh" ? "৳" : country === "india" ? "₹" : "$",
          plan: yearly ? "yearly" : "monthly",
          description: index === 0 ? "Features you’ll love" : "",
          caption: plan.title,
          subscription: plan.type,
          id: plan._id,
          yearly_plan_available,
        });
      }
    } else {
      payload.push({
        price: price,
        currency:
          country === "bangladesh" ? "৳" : country === "india" ? "₹" : "$",
        plan: yearly ? "yearly" : "monthly",
        description: index === 0 ? "Features you’ll love" : "",
        caption: plan.title,
        subscription: plan.type,
        id: plan._id,
        yearly_plan_available,
      });
    }
  });

  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");
  const { data: modeResult, isLoading } = useGetAppModeQuery();

  let modePrice;
  if (country === "bangladesh" || country === "india") {
    modePrice = 1;
  } else {
    modePrice = 0.5;
  }

  if (isLoading)
    return (
      <div className="h-[60vh]">
        <DotFlashing />
      </div>
    );

  return (
    <div className="pricing_slider">
      <Carousel opts={{ align: "start" }}>
        <CarouselContent>
          {payload?.map((item, index) => (
            <CarouselItem
              key={index}
              className="basis-full pr-6 sm:basis-1/2 lg:basis-1/3 xl:basis-1/4"
            >
              <div className={cn("rounded-lg p-6 shadow-sm")}>
                <div>
                  <h3
                    className={cn(
                      "mb-3 font-bold capitalize",
                      item.subscription === "free"
                        ? "text-muted-foreground"
                        : "text-primary",
                    )}
                  >
                    {item.caption}
                  </h3>
                  <div className="mb-4 text-[22px] font-bold">
                    <sup className="font-normal">{item.currency}</sup>
                    {/dev|test/.test(modeResult?.data?.appMode)
                      ? modePrice
                      : item.price}
                    <sub className="text-muted-foreground"> / {item.plan}</sub>
                  </div>
                  <p className="text-muted-foreground -mt-1 h-[26px] text-sm">
                    {item.description}
                  </p>
                  <PricingButton
                    user={user}
                    caption={item.caption}
                    id={item.id}
                    paymentMethod={paymentMethod}
                    redirect={redirect}
                    subscription={item.subscription}
                    yearly={yearly}
                    yearly_plan_available={item.yearly_plan_available}
                    outline={true}
                  />
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </div>
  );
};

export default PricingSlider;
