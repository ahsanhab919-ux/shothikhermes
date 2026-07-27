import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useGetTransectionHistoryQuery } from "@/redux/api/auth/authApi";
import { Diamond } from "lucide-react";
import Link from "next/link";

export default function AccountBilling({ user }) {
  const { data } = useGetTransectionHistoryQuery();

  if (!user) return null;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <div className="lg:col-span-5 xl:col-span-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-muted-foreground text-sm font-medium tracking-wider uppercase">
              Your Plan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {user?.package ? (
              <div className="my-4 flex flex-col items-center gap-3">
                <h3 className="text-primary text-xl font-semibold capitalize">
                  {user?.package.replace("_", " ")}
                </h3>
                {user?.package !== "unlimited" ? (
                  <Link href="/pricing">
                    <Button
                      className="gap-2"
                      data-rybbit-event="clicked_upgrade_plan"
                    >
                      <Diamond className="h-4 w-4 md:h-5 md:w-5" />
                      Upgrade Plan
                    </Button>
                  </Link>
                ) : null}
              </div>
            ) : null}
            <p className="text-center text-sm">
              Check out{" "}
              <Link href="/pricing" className="text-primary hover:underline">
                our plans
              </Link>{" "}
              and find your perfect fit.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-7">
        {data?.length ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-muted-foreground text-sm font-medium tracking-wider uppercase">
                Invoice History
              </CardTitle>
            </CardHeader>
            <CardContent className="space-4">
              {data.map((invoice) => (
                <Card
                  key={invoice._id}
                  className={cn(
                    "bg-muted/50 text-muted-foreground",
                    "border-border overflow-hidden",
                  )}
                >
                  <div
                    className={cn(
                      "flex items-center justify-between",
                      "border-border border-b px-4 py-3",
                      "font-semibold",
                    )}
                  >
                    <span className="text-foreground capitalize">
                      {user?.package?.replace("_", " ")}
                    </span>
                    <Badge
                      variant={
                        invoice.status === "success" ? "default" : "secondary"
                      }
                      className={cn(
                        invoice.status === "success" &&
                          "bg-background text-primary",
                      )}
                    >
                      {invoice.status === "success" ? "Active" : invoice.status}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between px-4 py-3">
                    <div className="space-y-1">
                      <p className="text-sm">
                        Payment date:{" "}
                        <span className="font-medium">
                          {new Date(invoice._date).toLocaleDateString()}
                        </span>
                      </p>
                      <p className="text-sm">
                        Expired date:{" "}
                        <span className="font-medium">
                          {new Date(invoice.validTil).toLocaleDateString()}
                        </span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {invoice.amount}
                        {invoice.paymentMethod === "bkash"
                          ? "৳"
                          : invoice.paymentMethod === "razorpay"
                            ? "₹"
                            : "$"}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
