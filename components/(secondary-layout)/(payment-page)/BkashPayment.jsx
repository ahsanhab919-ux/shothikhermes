"use client";

import { PAYMENT } from "@/config/route";
import { useBkashPaymentMutation } from "@/redux/api/pricing/pricingApi";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { toast } from "react-toastify";
import PaymentLayout from "./PaymentLayout";

export default function BkashPyament() {
  return (
    <Suspense fallback={null}>
      <BkashPyamentComponent />
    </Suspense>
  );
}

function BkashPyamentComponent() {
  const [bkashPayment, { isLoading }] = useBkashPaymentMutation();
  const [totalBill, setTotalBill] = useState(0);
  const params = useSearchParams();
  const tenure = params.get("tenure");
  const [plan, setPlan] = useState({});

  const handleSubmit = async (e) => {
    try {
      e.preventDefault();
      const payload = {
        pricingId: plan?._id,
        amount: totalBill,
        payment_type: tenure,
      };
      //  // New debugging line
      const data = await bkashPayment(payload).unwrap();
      window.location.href = data?.bkashURL;
    } catch (error) {
      console.error("Error:", error);
      toast.error(error.data?.error || "An error ocured");
    }
  };

  return (
    <Suspense fallback={null}>
      <PaymentLayout
        setTotalBill={setTotalBill}
        handleSubmit={handleSubmit}
        isLoading={isLoading}
        route={PAYMENT.bkash}
        plan={plan}
        setPlan={setPlan}
      />
    </Suspense>
  );
}
