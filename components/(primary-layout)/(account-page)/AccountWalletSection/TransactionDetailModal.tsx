"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { TPaymentTransaction } from "@/types/payment-transaction.type";
import type { TTokenTransaction } from "@/types/token-transaction.type";
import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { toast } from "react-toastify";

type TransactionDetailModalProps = {
  isOpen: boolean;
  onClose: () => void;
  transaction: TPaymentTransaction | TTokenTransaction | null;
  type: "payment" | "token";
};

export default function TransactionDetailModal({
  isOpen,
  onClose,
  transaction,
  type,
}: TransactionDetailModalProps) {
  const [copied, setCopied] = useState(false);

  if (!transaction) return null;

  const handleCopyId = async () => {
    if (!transaction._id) return;

    try {
      await navigator.clipboard.writeText(transaction._id);
      setCopied(true);
      toast.success("ID copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy ID");
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "success":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "failed":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      case "refunded":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {type === "payment"
              ? "Payment Transaction Details"
              : "Token Transaction Details"}
          </DialogTitle>
          <DialogDescription>
            Complete information about this transaction
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {type === "payment" ? (
            <PaymentTransactionDetails
              transaction={transaction as TPaymentTransaction}
              getStatusColor={getStatusColor}
            />
          ) : (
            <TokenTransactionDetails
              transaction={transaction as TTokenTransaction}
            />
          )}

          {/* Document ID Section at Bottom */}
          {transaction._id && (
            <div className="mt-6 border-t pt-4">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <span className="text-muted-foreground mb-1 block text-sm font-medium">
                    Document ID
                  </span>
                  <div className="flex items-center gap-2">
                    <p className="bg-muted/50 flex-1 rounded px-2 py-1.5 font-mono text-xs break-all">
                      {transaction._id}
                    </p>
                    <Button
                      onClick={handleCopyId}
                      size="icon"
                      variant="outline"
                      className="flex-shrink-0"
                      title="Copy ID"
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PaymentTransactionDetails({
  transaction,
  getStatusColor,
}: {
  transaction: TPaymentTransaction;
  getStatusColor: (status?: string) => string;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <DetailItem label="Status">
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${getStatusColor(
            transaction.status,
          )}`}
        >
          {transaction.status}
        </span>
      </DetailItem>

      <DetailItem label="Amount">
        <span className="font-semibold">
          {transaction.currency === "USD" ? "$" : "BDT "}
          {transaction.amount.toFixed(2)}
        </span>
      </DetailItem>

      <DetailItem label="Currency">{transaction.currency}</DetailItem>

      {transaction.gateway_transaction_id && (
        <DetailItem label="Gateway Transaction ID">
          <span className="font-mono text-xs">
            {transaction.gateway_transaction_id}
          </span>
        </DetailItem>
      )}

      {transaction.gateway_session_id && (
        <DetailItem label="Gateway Session ID">
          <span className="font-mono text-xs">
            {transaction.gateway_session_id}
          </span>
        </DetailItem>
      )}

      {transaction.gateway_status && (
        <DetailItem label="Gateway Status">
          <span className="capitalize">{transaction.gateway_status}</span>
        </DetailItem>
      )}

      {transaction.gateway_fee && (
        <DetailItem label="Gateway Fee">
          {transaction.currency === "USD" ? "$" : "BDT "}
          {transaction.gateway_fee.toFixed(2)}
        </DetailItem>
      )}

      {transaction.customer_email && (
        <DetailItem label="Customer Email">
          {transaction.customer_email}
        </DetailItem>
      )}

      {transaction.customer_name && (
        <DetailItem label="Customer Name">
          {transaction.customer_name}
        </DetailItem>
      )}

      {transaction.failure_reason && (
        <DetailItem label="Failure Reason" className="md:col-span-2">
          <span className="text-destructive">{transaction.failure_reason}</span>
        </DetailItem>
      )}

      {transaction.refund_id && (
        <DetailItem label="Refund ID">
          <span className="font-mono text-xs">{transaction.refund_id}</span>
        </DetailItem>
      )}

      {transaction.paid_at && (
        <DetailItem label="Paid At">
          {new Date(transaction.paid_at).toLocaleString()}
        </DetailItem>
      )}

      {transaction.failed_at && (
        <DetailItem label="Failed At">
          {new Date(transaction.failed_at).toLocaleString()}
        </DetailItem>
      )}

      {transaction.refunded_at && (
        <DetailItem label="Refunded At">
          {new Date(transaction.refunded_at).toLocaleString()}
        </DetailItem>
      )}

      {transaction.created_at && (
        <DetailItem label="Created At">
          {new Date(transaction.created_at).toLocaleString()}
        </DetailItem>
      )}

      {transaction.updated_at && (
        <DetailItem label="Updated At">
          {new Date(transaction.updated_at).toLocaleString()}
        </DetailItem>
      )}
    </div>
  );
}

function TokenTransactionDetails({
  transaction,
}: {
  transaction: TTokenTransaction;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <DetailItem label="Type">
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
            transaction.type === "increase"
              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
              : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
          }`}
        >
          {transaction.type}
        </span>
      </DetailItem>

      <DetailItem label="Token Amount">
        <span
          className={`font-semibold ${
            transaction.type === "increase" ? "text-green-600" : "text-red-600"
          }`}
        >
          {transaction.type === "increase" ? "+" : "-"}
          {transaction.token} Credits
        </span>
      </DetailItem>

      {transaction.increase_source && (
        <DetailItem label="Increase Source">
          <span className="capitalize">{transaction.increase_source}</span>
        </DetailItem>
      )}

      {transaction.decrease_source && (
        <DetailItem label="Decrease Source" className="md:col-span-2">
          {(() => {
            const source = transaction.decrease_source;
            if (
              typeof source === "object" &&
              source !== null &&
              !Array.isArray(source)
            ) {
              const sourceObj = source as {
                name?: string;
                endpoint?: string;
                _id?: string;
                token?: number;
              };
              return (
                <div className="space-y-1">
                  {sourceObj.name && (
                    <div>
                      <span className="text-muted-foreground text-xs">
                        Name:{" "}
                      </span>
                      <span className="text-sm font-medium">
                        {sourceObj.name}
                      </span>
                    </div>
                  )}
                  {sourceObj.endpoint && (
                    <div>
                      <span className="text-muted-foreground text-xs">
                        Endpoint:{" "}
                      </span>
                      <span className="font-mono text-xs">
                        {sourceObj.endpoint}
                      </span>
                    </div>
                  )}
                  {sourceObj._id && (
                    <div>
                      <span className="text-muted-foreground text-xs">
                        ID:{" "}
                      </span>
                      <span className="font-mono text-xs">{sourceObj._id}</span>
                    </div>
                  )}
                </div>
              );
            }
            return <span className="font-mono text-xs">{String(source)}</span>;
          })()}
        </DetailItem>
      )}

      {transaction.payment_transaction && (
        <DetailItem label="Payment Transaction" className="md:col-span-2">
          {(() => {
            const paymentTx = transaction.payment_transaction;
            if (typeof paymentTx === "string") {
              return <span className="font-mono text-xs">{paymentTx}</span>;
            } else if (typeof paymentTx === "object" && paymentTx !== null) {
              // It's a populated TPaymentTransaction object
              return (
                <div className="space-y-1">
                  <div>
                    <span className="text-muted-foreground text-xs">ID: </span>
                    <span className="font-mono text-xs">{paymentTx._id}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">
                      Status:{" "}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                        paymentTx.status === "success"
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                          : paymentTx.status === "pending"
                            ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                            : paymentTx.status === "failed"
                              ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                              : "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
                      }`}
                    >
                      {paymentTx.status}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">
                      Amount:{" "}
                    </span>
                    <span className="text-sm font-semibold">
                      {paymentTx.currency === "USD" ? "$" : "BDT "}
                      {paymentTx.amount.toFixed(2)}
                    </span>
                  </div>
                </div>
              );
            }
            return null;
          })()}
        </DetailItem>
      )}

      {transaction.plan && (
        <DetailItem label="Plan">
          {typeof transaction.plan === "object" && transaction.plan !== null
            ? transaction.plan.name
            : typeof transaction.plan === "string"
              ? transaction.plan
              : ""}
        </DetailItem>
      )}

      {transaction.created_at && (
        <DetailItem label="Created At">
          {new Date(transaction.created_at).toLocaleString()}
        </DetailItem>
      )}

      {transaction.updated_at && (
        <DetailItem label="Updated At">
          {new Date(transaction.updated_at).toLocaleString()}
        </DetailItem>
      )}
    </div>
  );
}

function DetailItem({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <span className="text-muted-foreground mb-1 block text-xs font-medium">
        {label}
      </span>
      <div className="text-sm">{children}</div>
    </div>
  );
}
