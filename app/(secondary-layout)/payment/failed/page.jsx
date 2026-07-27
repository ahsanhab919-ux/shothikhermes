import { AlertCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export async function generateMetadata() {
  return {
    title: "Payment Faild | Shothik AI",
    description: "This is Bkash payment page",
  };
}

export default function PaymentFailed() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center">
      <AlertCircle className="w-16 h-16 text-destructive mb-4" />

      <h1 className="text-3xl font-bold mb-2">Failed</h1>
      <p className="my-8 text-base">
        We&apos;re sorry, but your payment could not be processed.
      </p>

      <Button asChild size="lg">
        <Link href="/?utm_source=internal">
          Go to Home
        </Link>
      </Button>
    </div>
  );
}
