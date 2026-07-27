import { trackEvent } from "@/analysers/eventTracker";
import { Button } from "@/components/ui/button";
import { PAYMENT } from "@/config/route";
import { cn } from "@/lib/utils";
import { setShowLoginModal } from "@/redux/slices/auth";
import Link from "next/link";
import { useDispatch } from "react-redux";

export default function PricingButton({
  user,
  paymentMethod,
  yearly,
  yearly_plan_available,
  caption,
  subscription,
  id,
  redirect,
  outline = false,
}) {
  const dispatch = useDispatch();

  //track event
  const handleTrigger = () => {
    trackEvent("click", "payment", subscription, 1);
  };

  // 

  return (
    <div className="w-full">
      {user?.email ? (
        <Button
          asChild
          onClick={handleTrigger}
          size="lg"
          variant={outline ? "outline" : "default"}
          className={cn("w-full")}
          disabled={
            !yearly_plan_available && yearly
              ? true
              : subscription === "free" ||
                (/pro_plan|unlimited/.test(user?.package) &&
                  /pro_plan|value_plan/.test(subscription)) ||
                user?.package === subscription
          }
        >
          <Link
            href={
              paymentMethod === "bkash"
                ? `${PAYMENT.bkash}/?subscription=${id}&tenure=${
                    yearly ? "yearly" : "monthly"
                  }&redirect=${redirect}`
                : paymentMethod === "razor"
                  ? `${PAYMENT.razor}/?subscription=${id}&tenure=${
                      yearly ? "yearly" : "monthly"
                    }&redirect=${redirect}`
                  : `${PAYMENT.stripe}/?subscription=${id}&tenure=${
                      yearly ? "yearly" : "monthly"
                    }&redirect=${redirect}`
            }
          >
            {user?.package === subscription
              ? "current plan"
              : !yearly_plan_available && yearly
                ? "Available for monthly plan"
                : `Choose ${caption}`}
          </Link>
        </Button>
      ) : (
        <Button
          disabled={!yearly_plan_available && yearly}
          onClick={() => dispatch(setShowLoginModal(true))}
          size="lg"
          variant={outline || subscription === "free" ? "outline" : "default"}
          className={cn("w-full")}
        >
          {!yearly_plan_available && yearly
            ? "Available for monthly plan"
            : subscription === "free"
              ? `Sign up - it's free`
              : `Choose ${caption}`}
        </Button>
      )}
    </div>
  );
}
