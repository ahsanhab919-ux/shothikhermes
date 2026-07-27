"use client";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import useResponsive from "@/hooks/ui/useResponsive";
import useGeolocation from "@/hooks/useGeolocation";
import { useGetPricingPlansQuery } from "@/redux/api/pricing/pricingApi";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import PricingPlanCard from "./PricingPlanCard";
import PricingSlider from "./PricingSlider";
import PricingPlanCardSkeleton from "./pricingPlanCardSkeleton";

export default function PricingLayout({ children, TitleContend }) {
  const { user } = useSelector((state) => state.auth);
  const [isMonthly, setIsMonthly] = useState(false);
  const { data, isLoading } = useGetPricingPlansQuery();
  const { location } = useGeolocation();
  const isMobile = useResponsive("down", "sm");

  useEffect(() => {
    const haveValue = localStorage.getItem("isMonthly");
    if (haveValue) {
      setIsMonthly(JSON.parse(haveValue));
    }
  }, [isMonthly]);

  const handleIsMonthly = () => {
    setIsMonthly((prev) => !prev);
    localStorage.setItem("isMonthly", !isMonthly);
  };

  return (
    <div className="-mt-2 pt-4 md:pt-0">
      <div
        className="flex h-[35rem] flex-col items-center bg-cover bg-center bg-no-repeat px-2 pt-6 md:px-0 md:pt-8"
        style={{
          backgroundImage: `url(/pricing_bg_img.webp)`,
        }}
      >
        {TitleContend}

        <div className="my-4">
          <div className="flex flex-row items-center justify-end gap-2">
            <Label
              htmlFor="yearly-switch"
              className="text-primary-foreground text-sm tracking-wide uppercase"
            >
              MONTHLY
            </Label>
            <Switch
              id="yearly-switch"
              checked={isMonthly}
              onCheckedChange={handleIsMonthly}
            />
            <Label
              htmlFor="yearly-switch"
              className="text-primary-foreground ml-0 text-sm tracking-wide uppercase sm:ml-1.5"
            >
              YEARLY (save 2 months)
            </Label>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-screen-xl px-4">
        <div className="pricing_card_style mx-auto -mt-60 grid grid-cols-1 gap-3 px-2 sm:-mt-68 md:-mt-60 md:grid-cols-2 md:px-0 lg:grid-cols-3 xl:grid-cols-4 xl:gap-5">
          {isLoading
            ? Array.from({ length: 4 }).map((_, index) => (
                <PricingPlanCardSkeleton key={`skeleton-${index}`} />
              ))
            : data?.data?.map((card, index) => (
                <PricingPlanCard
                  key={index}
                  user={user}
                  card={card}
                  index={index}
                  yearly={isMonthly}
                  paymentMethod={
                    location === "bangladesh"
                      ? "bkash"
                      : location === "india"
                        ? "razor"
                        : "stripe"
                  }
                  country={location}
                />
              ))}
        </div>
        {!isLoading && data?.data ? (
          <div className="mx-2 my-5 flex flex-col gap-10 md:mx-[140px] md:my-14">
            {isMobile && (
              <PricingSlider
                data={data?.data}
                yearly={isMonthly}
                country={location}
                paymentMethod={
                  location === "bangladesh"
                    ? "bkash"
                    : location === "india"
                      ? "razor"
                      : "stripe"
                }
                user={user}
              />
            )}
          </div>
        ) : null}
        {children}
      </div>
    </div>
  );
}
