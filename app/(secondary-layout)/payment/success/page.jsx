import PaymentSuccessAndUpdateUser from "@/components/(secondary-layout)/(payment-page)/PaymentSuccess";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import Link from "next/link";

export async function generateMetadata() {
  return {
    title: "Payment Success | Shothik AI",
    description: "This is Bkash payment page",
  };
}

export default function PaymentSuccess() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8 text-center">
      <CheckCircle className="text-primary mb-4 h-16 w-16" />
      <h1 className="mb-2 text-3xl font-bold">Payment Successful</h1>
      <p className="mt-4 mb-8 text-base">Thank you for your payment.</p>
      <Button asChild size="lg">
        <Link href="/?utm_source=internal">Go to Home</Link>
      </Button>

      <PaymentSuccessAndUpdateUser />
    </div>
  );
}
