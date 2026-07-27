"use client";

import { PAYMENT } from "@/config/route";
import { useStripePaymentMutation } from "@/redux/api/pricing/pricingApi";
import { loadStripe } from "@stripe/stripe-js";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { toast } from "react-toastify";
import PaymentLayout from "./PaymentLayout";

const stripe = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

export default function StripePayment() {
  return (
    <Suspense fallback={null}>
      <StripePaymentComponent />
    </Suspense>
  );
}

function StripePaymentComponent() {
  const [stripePayment, { isLoading }] = useStripePaymentMutation();
  const [totalBill, setTotalBill] = useState(0);
  const [plan, setPlan] = useState({});
  const params = useSearchParams();
  const tenure = params.get("tenure");

  const handleSubmit = async (event) => {
    try {
      event.preventDefault();
      const payload = {
        pricingId: plan?._id,
        amount: totalBill,
        payment_type: tenure,
      };
      const res = await stripePayment(payload).unwrap();
      const order = res.data;
      if (order) {
        const result = (await stripe).redirectToCheckout({
          sessionId: order.id,
        });
        if (result.error) {
          throw { message: "An error occured" };
        }
      }
    } catch (error) {
      toast.error(error.message || error.data.error);
    }
  };

  return (
    <Suspense fallback={null}>
      <PaymentLayout
        setTotalBill={setTotalBill}
        handleSubmit={handleSubmit}
        isLoading={isLoading}
        route={PAYMENT.stripe}
        plan={plan}
        setPlan={setPlan}
      />
    </Suspense>
  );
}
