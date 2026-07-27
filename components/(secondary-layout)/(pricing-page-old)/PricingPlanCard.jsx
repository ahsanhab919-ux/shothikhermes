import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useGetAppModeQuery } from "@/redux/api/pricing/pricingApi";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import PricingButton from "./PricingButton";

export default function PricingPlanCard({
  user,
  loading,
  card,
  index,
  yearly,
  className,
  paymentMethod,
  country,
  ...other
}) {
  const {
    _id: id,
    type: subscription,
    title: caption,
    features: lists,
    bn,
    global,
  } = card;

  const {
    amount_monthly: price,
    amount_yearly: priceYearly,
    yearly_plan_available,
  } = country === "bangladesh" ? bn : country === "india" ? card.in : global;

  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");
  const { data: modeResult, isLoading } = useGetAppModeQuery();

  let modePrice;
  if (country === "bangladesh" || country === "india") {
    modePrice = 1;
  } else {
    modePrice = 0.5;
  }

  if (isLoading) return null;

  if (yearly && !yearly_plan_available) return null;

  const getSubscriptionColor = () => {
    switch (subscription) {
      case "free":
        return "text-muted-foreground";
      case "value_plan":
        return "text-green-600";
      case "pro_plan":
        return "text-purple-600";
      default:
        return "text-amber-600";
    }
  };

  const getLabelVariant = () => {
    switch (index) {
      case 1:
        return { bg: "bg-green-100", text: "text-green-700", label: "Solid" };
      case 2:
        return {
          bg: "bg-purple-100",
          text: "text-purple-700",
          label: "POPULAR",
        };
      case 3:
        return {
          bg: "bg-amber-100",
          text: "text-amber-700",
          label: "Best Option",
        };
      default:
        return null;
    }
  };

  const labelVariant = getLabelVariant();

  return (
    <Card
      className={cn(
        "bg-background flex flex-col justify-between gap-0 p-6",
        "mx-auto max-w-[450px] md:max-w-[550px]",
        (index === 0 || index === 2) &&
          "border-border border border-dashed shadow-sm",
        className,
      )}
      {...other}
    >
      <CardContent className="p-0">
        <div className="flex h-full flex-col justify-between">
          <div>
            {price && labelVariant && (
              <Badge
                className={cn(
                  "absolute top-8 right-8",
                  labelVariant.bg,
                  labelVariant.text,
                )}
                variant="secondary"
              >
                {labelVariant.label}
              </Badge>
            )}

            <div className="flex items-center gap-1">
              {price !== undefined ? (
                <>
                  <div className="flex items-baseline">
                    <span className="text-3xl font-bold">
                      {country === "bangladesh"
                        ? "৳"
                        : country === "india"
                          ? "₹"
                          : "$"}
                    </span>
                    <span className="text-4xl font-bold">
                      {/dev|test/.test(modeResult?.data?.appMode)
                        ? modePrice
                        : yearly
                          ? priceYearly
                          : price}
                    </span>
                    <span className="text-muted-foreground ml-1 text-base">
                      {yearly ? "/ year" : "/ month"}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <Skeleton className="h-6 w-6 rounded" />
                  <Skeleton className="h-6 w-16 rounded" />
                </>
              )}
            </div>

            <div
              className={cn(
                "mt-1 text-2xl font-semibold capitalize md:mt-0",
                getSubscriptionColor(),
              )}
            >
              {subscription === "free"
                ? "Free Plan"
                : caption || <Skeleton className="h-6 w-1/4" />}
              {subscription === "free" && (
                <span className="ml-2 text-sm text-green-600 capitalize">
                  Forever
                </span>
              )}
            </div>

            {subscription === "free" && (
              <p className="text-muted-foreground text-sm">
                Features you'll love
              </p>
            )}

            <div className="my-6 space-y-3">
              <ul className="space-y-3 p-0">
                {(lists || Array.from({ length: 5 })).map((item, index) => (
                  <li key={index} className="flex items-start gap-2">
                    {subscription === "free" ? (
                      <Image
                        src="/black_tick.png"
                        width={24}
                        height={24}
                        alt="pricing_check_mark"
                      />
                    ) : (
                      <Image
                        src="/green_tick.svg"
                        width={24}
                        height={24}
                        alt="pricing_check_mark"
                      />
                    )}
                    <span className="text-foreground text-sm">
                      {item?.title ? (
                        item.title
                      ) : (
                        <Skeleton className="h-4 w-48" />
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <PricingButton
            user={user}
            paymentMethod={paymentMethod}
            yearly={yearly}
            yearly_plan_available={yearly_plan_available}
            caption={caption}
            subscription={subscription}
            id={id}
            redirect={redirect}
          />
        </div>
      </CardContent>
    </Card>
  );
}
