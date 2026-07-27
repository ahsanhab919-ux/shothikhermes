"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { sanitizeHtml } from "@/lib/sanitize";
import { setShowLoginModal } from "@/redux/slices/auth";
import type { TPackage } from "@/types/package.type";
import { Check, ShoppingCart } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "@/redux/store";
import SuccessCheckIcon from "../icons/SuccessCheckIcon";
import { Label } from "../ui/label";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";

type PricingCardProps = {
  package: TPackage;
  selectedPlanId?: string | null;
  isBangladesh?: boolean | null;
};

// ==================== Utility Functions ====================

/**
 * Format price with currency
 * Shows decimals only if the amount is not a round number
 */
const formatPrice = (amount: number, currency: string): string => {
  const isRoundNumber = amount % 1 === 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: isRoundNumber ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Extract plan ID from plan object or string
 */
const getPlanId = (plan: unknown): string | null => {
  if (!plan) return null;
  if (typeof plan === "string") return plan;
  if (typeof plan === "object" && plan !== null && "_id" in plan) {
    const id = plan._id;
    if (typeof id === "string") return id;
    if (typeof id === "number") return String(id);
    // Handle ObjectId or similar objects
    if (id && typeof id === "object" && "toString" in id) {
      const toStringMethod = id.toString;
      if (typeof toStringMethod === "function") {
        return toStringMethod.call(id);
      }
    }
  }
  return null;
};

/**
 * Extract plan name from plan object
 */
const getPlanName = (plan: unknown): string => {
  if (typeof plan === "object" && plan !== null && "name" in plan) {
    const name = plan.name;
    if (typeof name === "string") return name || "N/A";
    if (typeof name === "number") return String(name);
    if (typeof name === "boolean") return String(name);
    // Skip objects to avoid stringification warnings
  }
  return "N/A";
};

/**
 * Extract plan duration from plan object
 */
const getPlanDuration = (plan: unknown): number => {
  if (typeof plan === "object" && plan !== null && "duration" in plan) {
    return Number(plan.duration) || 0;
  }
  return 0;
};

/**
 * Get price display based on location
 */
const getPriceDisplay = (
  price: { USD: number; BDT: number },
  isBangladesh: boolean | null,
): React.ReactNode => {
  if (isBangladesh === true) {
    return formatPrice(price.BDT, "BDT");
  }
  if (isBangladesh === false) {
    return formatPrice(price.USD, "USD");
  }
  // null - show both
  return (
    <>
      {formatPrice(price.USD, "USD")} / {formatPrice(price.BDT, "BDT")}
    </>
  );
};

/**
 * Filter active plans
 */
const getActivePlans = (plans: TPackage["plans"] = []): typeof plans => {
  return plans.filter((pp) => pp?.is_active !== false);
};

/**
 * Get initial plan from plans array
 */
const getInitialPlan = (plans: TPackage["plans"] = []) => {
  return plans.find((pp) => pp?.is_initial) || plans?.[0];
};

/**
 * Get initial plan ID for default selection
 */
const getInitialPlanId = (plans: TPackage["plans"] = []): string | null => {
  const initialPlan = getInitialPlan(plans);
  if (!initialPlan?.plan) return null;
  return getPlanId(initialPlan.plan);
};

// ==================== Sub Components ====================

type PricingHeaderProps = {
  price: { USD: number; BDT: number };
  previousPrice?: { USD: number; BDT: number };
  tokenAmount?: number;
  planName: string;
  planDuration: number;
  packageName: string;
  badge?: string;
  isBangladesh?: boolean | null;
};

const PricingHeader: React.FC<PricingHeaderProps> = ({
  price,
  previousPrice,
  tokenAmount,
  planName,
  planDuration,
  packageName,
  badge,
  isBangladesh,
}) => {
  const hasDiscount =
    previousPrice &&
    (previousPrice.USD > price.USD || previousPrice.BDT > price.BDT);

  return (
    <div className="border-b pb-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold">{packageName}</h3>
          {badge && (
            <span className="bg-primary text-primary-foreground inline-block rounded-full px-3 py-1 text-xs font-semibold">
              {badge}
            </span>
          )}
        </div>
        <div className="space-y-1">
          {hasDiscount && previousPrice && (
            <p className="text-muted-foreground text-xs line-through">
              {getPriceDisplay(previousPrice, isBangladesh)}
            </p>
          )}
          <div className="flex items-end gap-1">
            {/* Price - Big and Bold */}
            <div className="space-y-1">
              <p className="text-2xl font-bold md:text-3xl">
                {getPriceDisplay(price, isBangladesh)}
              </p>
            </div>
            {/* Plan Name with Duration */}
            <div>
              <p className="text-muted-foreground text-sm">/ {planName}</p>
            </div>
          </div>
        </div>
        {/* Token Badge - NEW */}
        {tokenAmount && (
          <div className="bg-primary/10 text-primary inline-flex items-center gap-1.5 rounded-full px-3 py-1.5">
            <svg
              className="size-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            <span className="text-sm font-semibold">
              {tokenAmount.toLocaleString()} Credits
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

type PlanSelectorProps = {
  plans: TPackage["plans"];
  selectedPlanId: string | null;
  onPlanChange: (planId: string) => void;
};

const PlanSelector: React.FC<PlanSelectorProps> = ({
  plans,
  selectedPlanId,
  onPlanChange,
}) => {
  if (!plans || plans.length <= 1) return null;

  return (
    <div className="flex items-center justify-between gap-2 border-b pb-6">
      <label className="text-sm font-medium">Plans:</label>
      <RadioGroup
        value={selectedPlanId || undefined}
        onValueChange={onPlanChange}
        className="flex items-center"
      >
        {plans?.map((pp) => {
          const planId = getPlanId(pp?.plan);
          const planName = getPlanName(pp?.plan);
          const planDuration = getPlanDuration(pp?.plan);

          if (!planId) return null;

          return (
            <div key={pp?._id || planId} className="flex items-center gap-1">
              <RadioGroupItem value={planId} id={`plan-${planId}`} />
              <Label
                htmlFor={`plan-${planId}`}
                className="flex-1 cursor-pointer font-normal"
              >
                {planName}
              </Label>
            </div>
          );
        })}
      </RadioGroup>
    </div>
  );
};

type PlanPriceCardProps = {
  packagePlan: NonNullable<TPackage["plans"]>[0];
  isBangladesh?: boolean | null;
};

const PlanPriceCard: React.FC<PlanPriceCardProps> = ({
  packagePlan,
  isBangladesh,
}) => {
  const plan = packagePlan?.plan;
  const planName = getPlanName(plan);
  const planDuration = getPlanDuration(plan);
  const price = packagePlan?.price;
  const previousPrice = packagePlan?.previous_price;
  const hasDiscount =
    previousPrice &&
    price &&
    (previousPrice.USD > price.USD || previousPrice.BDT > price.BDT);

  if (!price) return null;

  return (
    <div
      className={`space-y-2 rounded-lg border p-3 ${
        packagePlan?.is_initial ? "border-primary bg-primary/5" : ""
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold">
            {planName} ({planDuration} days)
          </p>
        </div>
        <div className="text-right">
          <p className="font-bold">{getPriceDisplay(price, isBangladesh)}</p>
          {hasDiscount && previousPrice && (
            <p className="text-muted-foreground text-xs line-through">
              {getPriceDisplay(previousPrice, isBangladesh)}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          {packagePlan?.token || 0} Credits
        </span>
      </div>
    </div>
  );
};

type PlansListProps = {
  plans: TPackage["plans"];
  selectedPlanId?: string | null;
  showPlanSelector: boolean;
  isBangladesh?: boolean | null;
};

const PlansList: React.FC<PlansListProps> = ({
  plans,
  selectedPlanId,
  showPlanSelector,
  isBangladesh,
}) => {
  if (!plans || plans.length === 0) {
    return <p className="text-muted-foreground text-sm">No plans available</p>;
  }

  const filteredPlans =
    showPlanSelector && selectedPlanId
      ? plans.filter((pp) => {
          const planId = getPlanId(pp?.plan);
          return planId === selectedPlanId;
        })
      : plans;

  return (
    <div className="space-y-3">
      {filteredPlans.map((pp, index) => (
        <PlanPriceCard
          key={pp?._id || index}
          packagePlan={pp}
          isBangladesh={isBangladesh}
        />
      ))}
    </div>
  );
};

type PackageContentProps = {
  content?: string;
};

const PackageContent: React.FC<PackageContentProps> = ({ content }) => {
  if (!content) return null;

  return (
    <div
      className="prose prose-sm dark:prose-invert max-w-none"
      dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }}
    />
  );
};

type PackagePointsProps = {
  points?: string[];
};

const PackagePoints: React.FC<PackagePointsProps> = ({ points }) => {
  if (!points || points.length === 0) return null;

  return (
    <div className="space-y-2">
      {/* <strong className="block text-sm font-semibold">Key Points:</strong> */}
      <ul className="space-y-2">
        {points?.map((point) => (
          <li key={point} className="flex items-start gap-2 text-sm">
            <SuccessCheckIcon className="text-primary size-5 shrink-0" />
            <span>{point}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

type PackageFeaturesProps = {
  features: TPackage["features"];
};

const PackageFeatures: React.FC<PackageFeaturesProps> = ({ features }) => {
  if (!features || features.length === 0) return null;

  return (
    <div className="space-y-2">
      <strong className="block text-sm font-semibold">Features:</strong>
      <ul className="space-y-1">
        {features?.map((feature, index) => {
          const featureName =
            typeof feature === "string" ? feature : feature?.name || "Feature";
          const featureId =
            typeof feature === "string" ? feature : feature?._id || index;

          return (
            <li key={featureId} className="flex items-center gap-2 text-sm">
              <Check className="text-primary size-5 shrink-0" />
              <span>{featureName}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

type CheckoutButtonProps = {
  isInitial: boolean;
  packageId: string;
  planId: string | null;
};

const CheckoutButton: React.FC<CheckoutButtonProps> = ({
  isInitial,
  packageId,
  planId,
}) => {
  const dispatch = useDispatch();
  const { accessToken } = useSelector((state: RootState) => state?.auth);

  const handleAuthPopup = () => {
    if (!accessToken) {
      dispatch(setShowLoginModal(true));
    }
  };

  if (!planId) return null;

  if (!!isInitial) {
    return (
      <Button onClick={handleAuthPopup} size="lg" className="w-full">
        Sing-Up to Get Started
      </Button>
    );
  }

  return (
    <Link
      href={
        accessToken
          ? `/pricing/checkout?package_id=${packageId}&plan_id=${planId}`
          : "#"
      }
      className="w-full"
      onClick={handleAuthPopup}
    >
      <Button size="lg" className="w-full">
        <ShoppingCart className="size-5" />
        Checkout
      </Button>
    </Link>
  );
};

type EmptyStateProps = {
  name: string;
  badge?: string;
};

const EmptyState: React.FC<EmptyStateProps> = ({ name, badge }) => (
  <Card className="flex flex-col">
    <CardContent className="flex-1 space-y-6 py-6">
      <div className="flex items-center border-b pb-6 text-center">
        <h3 className="text-base font-semibold">{name}</h3>
        {badge && (
          <span className="bg-primary text-primary-foreground inline-block rounded-full px-3 py-1 text-xs font-semibold">
            {badge}
          </span>
        )}
      </div>
      <p className="text-muted-foreground text-sm">
        No plans available for this package.
      </p>
    </CardContent>
  </Card>
);

// ==================== Main Component ====================

export const PricingCard: React.FC<PricingCardProps> = ({
  package: pkg,
  selectedPlanId,
  isBangladesh,
}) => {
  // Get all active plans
  const allActivePlans = getActivePlans(pkg?.plans);

  // Determine if we should show plan selector (only when root selected "all" or null)
  const showPlanSelector = !selectedPlanId || selectedPlanId === "all";

  // Get plans to display and use
  const activePlans = showPlanSelector
    ? allActivePlans
    : allActivePlans.filter((pp) => {
        const planId = getPlanId(pp?.plan);
        return planId === selectedPlanId;
      });

  // Get initial plan ID for default selection
  const selectedPlanForCard = showPlanSelector
    ? getInitialPlanId(allActivePlans)
    : selectedPlanId;

  // State for card's internal plan selection (only used when showPlanSelector is true)
  const [cardSelectedPlanId, setCardSelectedPlanId] = React.useState<
    string | null
  >(selectedPlanForCard);

  // Track if this is the initial mount to avoid resetting user's selection
  const isInitialMount = React.useRef(true);

  // Update card selection only when showPlanSelector or selectedPlanId changes
  React.useEffect(() => {
    if (showPlanSelector) {
      // Only set initial plan on first mount, don't reset if user has already selected a plan
      if (isInitialMount.current && selectedPlanForCard) {
        setCardSelectedPlanId(selectedPlanForCard);
        isInitialMount.current = false;
      }
    } else {
      // When not showing selector, sync with root selected plan
      setCardSelectedPlanId(selectedPlanId ?? null);
      isInitialMount.current = true; // Reset flag when switching modes
    }
  }, [showPlanSelector, selectedPlanId, selectedPlanForCard]);

  // Get the plan to use for checkout (card's selected plan or root's selected plan)
  const checkoutPlanId = showPlanSelector ? cardSelectedPlanId : selectedPlanId;

  // Get the selected plan for display in header
  const selectedPlanForDisplay = activePlans.find((pp) => {
    const planId = getPlanId(pp?.plan);
    return planId === checkoutPlanId;
  });

  // Get initial plan for validation
  const initialPlan = getInitialPlan(activePlans);

  // Show empty state if no plans available
  if (!initialPlan || activePlans.length === 0) {
    return <EmptyState name={pkg?.name || ""} badge={pkg?.badge} />;
  }

  // Get plan details for header
  const displayPlan = selectedPlanForDisplay || initialPlan;
  const plan = displayPlan?.plan;
  const planName = getPlanName(plan);
  const planDuration = getPlanDuration(plan);
  const price = displayPlan?.price;
  const previousPrice = displayPlan?.previous_price;
  const tokenAmount = displayPlan?.token || 0;

  if (!price) {
    return <EmptyState name={pkg?.name || ""} badge={pkg?.badge} />;
  }

  return (
    <Card className="flex flex-col">
      <CardContent className="flex-1 space-y-6">
        {/* Pricing Header - Traditional pricing card style */}
        <PricingHeader
          price={price}
          previousPrice={previousPrice}
          tokenAmount={tokenAmount}
          planName={planName}
          planDuration={planDuration}
          packageName={pkg?.name || ""}
          badge={pkg?.badge}
          isBangladesh={isBangladesh}
        />

        {/* Plan Selector - Only show when root selected "all" */}
        {showPlanSelector && (
          <PlanSelector
            plans={allActivePlans}
            selectedPlanId={cardSelectedPlanId}
            onPlanChange={setCardSelectedPlanId}
          />
        )}

        {/* Plans Pricing - Only show if multiple plans and selector is shown
        {showPlanSelector && allActivePlans.length > 1 && (
          <PlansList
            plans={activePlans}
            selectedPlanId={cardSelectedPlanId}
            showPlanSelector={showPlanSelector}
            isBangladesh={isBangladesh}
          />
        )} */}

        {/* Content */}
        {/* <PackageContent content={pkg?.content} /> */}

        {/* Points - Show before features */}
        <PackagePoints points={pkg?.points} />

        {/* Features */}
        {/* <PackageFeatures features={pkg?.features} /> */}
      </CardContent>
      <CardFooter>
        <CheckoutButton
          isInitial={pkg?.is_initial}
          packageId={pkg?._id || ""}
          planId={checkoutPlanId ?? null}
        />
      </CardFooter>
    </Card>
  );
};
