"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  setWallet,
  setWalletError,
  setWalletLoading,
} from "@/redux/slices/user-wallet-slice";
import {
  fetchSelfPaymentTransactions,
  fetchSelfTokenTransactions,
  fetchSelfWallet,
} from "@/services/wallet.service";
import type { TPaymentTransaction } from "@/types/payment-transaction.type";
import type { TTokenTransaction } from "@/types/token-transaction.type";
import { useQuery } from "@tanstack/react-query";
import {
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Coins,
  CreditCard,
  Eye,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "@/redux/store";
import TransactionDetailModal from "./TransactionDetailModal";

// Using native Date methods for consistency with project

export default function AccountWalletSection() {
  const dispatch = useDispatch();
  const { accessToken } = useSelector((state: RootState) => state.auth || {});

  // Get wallet from Redux state
  const { wallet, isLoading: walletLoading } = useSelector(
    (state: RootState) => state.user_wallet || { wallet: null, isLoading: false },
  );

  // Pagination state for payment transactions
  const [paymentPage, setPaymentPage] = useState(1);
  const [paymentLimit] = useState(10);

  // Pagination state for token transactions
  const [tokenPage, setTokenPage] = useState(1);
  const [tokenLimit] = useState(10);

  // Modal state
  const [selectedPaymentTransaction, setSelectedPaymentTransaction] =
    useState<TPaymentTransaction | null>(null);
  const [selectedTokenTransaction, setSelectedTokenTransaction] =
    useState<TTokenTransaction | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);

  // Fetch wallet data and update Redux
  // Note: Wallet is already being fetched in NavigationSidebar component
  // This query will use the cached data if available, or fetch if not
  const {
    data: walletResponse,
    isLoading: queryLoading,
    error: queryError,
  } = useQuery({
    queryKey: ["user-wallet", "self"],
    queryFn: () => fetchSelfWallet(),
    enabled: !!accessToken, // Only fetch when user is logged in
    refetchOnWindowFocus: false, // Don't refetch on window focus
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
  });

  // Update Redux state when wallet data changes
  useEffect(() => {
    if (walletResponse?.data) {
      dispatch(setWallet(walletResponse.data));
    }
  }, [walletResponse?.data, dispatch]);

  // Sync loading state
  useEffect(() => {
    dispatch(setWalletLoading(queryLoading));
  }, [queryLoading, dispatch]);

  // Sync error state
  useEffect(() => {
    if (queryError) {
      dispatch(
        setWalletError(
          (queryError as any)?.response?.data?.message ||
            (queryError as any)?.message ||
            "Failed to fetch wallet",
        ),
      );
    }
  }, [queryError, dispatch]);

  // Build payment transactions query params
  const paymentQueryParams = useMemo(
    () => ({
      sort: "-created_at",
      page: paymentPage,
      limit: paymentLimit,
    }),
    [paymentPage, paymentLimit],
  );

  // Fetch payment transactions with pagination
  const { data: paymentTransactionsResponse, isLoading: paymentsLoading } =
    useQuery({
      queryKey: ["payment-transactions", "self", paymentQueryParams],
      queryFn: () => fetchSelfPaymentTransactions(paymentQueryParams),
    });

  const paymentTransactions = paymentTransactionsResponse?.data || [];
  const paymentMeta = paymentTransactionsResponse?.meta;
  const paymentTotal = paymentMeta?.total || 0;
  const paymentTotalPages = Math.ceil(paymentTotal / paymentLimit);

  // Build token transactions query params
  const tokenQueryParams = useMemo(
    () => ({
      sort: "-created_at",
      page: tokenPage,
      limit: tokenLimit,
    }),
    [tokenPage, tokenLimit],
  );

  // Fetch token transactions with pagination
  const { data: tokenTransactionsResponse, isLoading: tokensLoading } =
    useQuery({
      queryKey: ["token-transactions", "self", tokenQueryParams],
      queryFn: () => fetchSelfTokenTransactions(tokenQueryParams),
    });

  const tokenTransactions = tokenTransactionsResponse?.data || [];
  const tokenMeta = tokenTransactionsResponse?.meta;
  const tokenTotal = tokenMeta?.total || 0;
  const tokenTotalPages = Math.ceil(tokenTotal / tokenLimit);

  // Handle payment transaction view
  const handleViewPayment = (transaction: TPaymentTransaction) => {
    setSelectedPaymentTransaction(transaction);
    setIsPaymentModalOpen(true);
  };

  // Handle token transaction view
  const handleViewToken = (transaction: TTokenTransaction) => {
    setSelectedTokenTransaction(transaction);
    setIsTokenModalOpen(true);
  };

  if (walletLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner className="text-primary h-8 w-8" />
      </div>
    );
  }

  if (!wallet) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">
            No wallet found. Please contact support.
          </p>
        </CardContent>
      </Card>
    );
  }

  const packageName =
    typeof wallet.package === "object" && wallet.package !== null
      ? wallet.package.name
      : typeof wallet.package === "string"
        ? wallet.package
        : "No Package";

  const planName =
    typeof wallet.plan === "object" && wallet.plan !== null
      ? wallet.plan.name
      : typeof wallet.plan === "string"
        ? wallet.plan
        : "N/A";

  const planDuration =
    typeof wallet.plan === "object" && wallet.plan
      ? wallet.plan.duration
      : null;

  // Extract accessible features from package
  const getAccessibleFeatures = () => {
    if (
      typeof wallet.package !== "object" ||
      wallet.package === null ||
      Array.isArray(wallet.package) ||
      !wallet.package.features
    ) {
      return [];
    }

    if (!Array.isArray(wallet.package.features)) {
      return [];
    }

    return wallet.package.features.filter(
      (
        feature,
      ): feature is {
        _id: string;
        name: string;
        description?: string;
        type?: string;
      } =>
        typeof feature === "object" &&
        feature !== null &&
        "_id" in feature &&
        "name" in feature,
    );
  };

  const accessibleFeatures = getAccessibleFeatures();

  const isExpired = wallet.expires_at
    ? new Date(wallet.expires_at) < new Date()
    : false;

  return (
    <div>
      <div className="space-y-6">
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2">
                {/* Tokens Card */}
                <div className="bg-muted rounded-lg p-4">
                  <div className="text-muted-foreground mb-1 text-sm">
                    Credits
                  </div>
                  <div className="text-2xl font-bold">{wallet.token || 0}</div>
                </div>

                {/* Package Card */}
                <div className="bg-muted rounded-lg p-4">
                  <div className="text-muted-foreground mb-1 text-sm">
                    Package
                  </div>
                  <div className="text-sm font-medium">{packageName}</div>
                </div>

                {/* Plan Card */}
                {planName && planName !== "N/A" && (
                  <div className="bg-muted rounded-lg p-4">
                    <div className="text-muted-foreground mb-1 text-sm">
                      Plan
                    </div>
                    <div className="text-sm font-medium">
                      {planName}
                      {planDuration && ` (${planDuration} days)`}
                    </div>
                  </div>
                )}

                {/* Expires At Card */}
                {wallet.expires_at && (
                  <div className="bg-muted rounded-lg p-4">
                    <div className="text-muted-foreground mb-1 text-sm">
                      Expires At
                    </div>
                    <div
                      className={`text-sm font-semibold ${
                        isExpired ? "text-destructive" : "text-green-600"
                      }`}
                    >
                      {new Date(wallet.expires_at).toLocaleString()}
                      {isExpired && (
                        <Badge variant="destructive" className="ml-2">
                          Expired
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Accessible Features Card */}
        {accessibleFeatures.length > 0 && (
          <Card>
            <CardHeader className="border-b">
              <h2 className="text-xl font-semibold">Accessible Features</h2>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {accessibleFeatures.map((feature) => (
                  <div
                    key={feature._id}
                    className="bg-muted hover:bg-muted/80 rounded-lg border p-4 transition-colors"
                  >
                    <div className="font-semibold">{feature.name}</div>
                    {feature.description && (
                      <p className="text-muted-foreground mt-1 text-sm">
                        {feature.description}
                      </p>
                    )}
                    {feature.type && (
                      <Badge variant="outline" className="mt-2 text-xs">
                        {feature.type}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="border-b">
            <h2 className="text-xl font-semibold">Wallet & Transactions</h2>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <Tabs defaultValue="payments" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger
                  value="payments"
                  className="flex items-center gap-2"
                >
                  <CreditCard className="h-4 w-4" />
                  Payments
                </TabsTrigger>
                <TabsTrigger value="tokens" className="flex items-center gap-2">
                  <Coins className="h-4 w-4" />
                  Credits
                </TabsTrigger>
              </TabsList>

              <TabsContent value="wallet" className="mt-6"></TabsContent>

              <TabsContent value="payments" className="mt-6">
                {paymentsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Spinner className="text-primary h-6 w-6" />
                  </div>
                ) : paymentTransactions.length === 0 ? (
                  <div className="text-muted-foreground py-12 text-center">
                    No payment transactions found
                  </div>
                ) : (
                  <>
                    <div className="space-y-3">
                      {paymentTransactions.map(
                        (transaction: TPaymentTransaction) => (
                          <div
                            key={transaction._id}
                            className="border-border hover:bg-muted flex flex-col gap-3 rounded-lg border p-3 transition-colors sm:flex-row sm:items-center sm:justify-between sm:p-4"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="font-semibold">
                                  {transaction.currency === "USD"
                                    ? "$"
                                    : "BDT "}
                                  {transaction.amount.toFixed(2)}
                                </p>
                                <Badge
                                  variant={
                                    transaction.status === "success"
                                      ? "default"
                                      : transaction.status === "pending"
                                        ? "secondary"
                                        : "destructive"
                                  }
                                  className="capitalize"
                                >
                                  {transaction.status === "success" ? (
                                    <CheckCircle className="mr-1 h-3 w-3" />
                                  ) : transaction.status === "failed" ? (
                                    <XCircle className="mr-1 h-3 w-3" />
                                  ) : null}
                                  {transaction.status}
                                </Badge>
                              </div>
                              {transaction.gateway_transaction_id && (
                                <p className="text-muted-foreground mt-1 truncate text-xs">
                                  Gateway ID:{" "}
                                  {transaction.gateway_transaction_id}
                                </p>
                              )}
                              {transaction.customer_email && (
                                <p className="text-muted-foreground mt-1 truncate text-xs">
                                  Email: {transaction.customer_email}
                                </p>
                              )}
                              {transaction.created_at && (
                                <p className="text-muted-foreground mt-1 text-xs">
                                  {new Date(
                                    transaction.created_at,
                                  ).toLocaleString()}
                                </p>
                              )}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="shrink-0 min-h-[44px] w-full sm:ml-4 sm:w-auto"
                              onClick={() => handleViewPayment(transaction)}
                            >
                              <Eye className="mr-1 h-4 w-4" />
                              View
                            </Button>
                          </div>
                        ),
                      )}
                    </div>

                    {paymentTotalPages > 1 && (
                      <div className="mt-6 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="text-muted-foreground text-xs sm:text-sm text-center sm:text-left">
                          Showing {(paymentPage - 1) * paymentLimit + 1} to{" "}
                          {Math.min(paymentPage * paymentLimit, paymentTotal)}{" "}
                          of {paymentTotal}
                        </div>
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="min-h-[44px] min-w-[44px]"
                            onClick={() =>
                              setPaymentPage((p) => Math.max(1, p - 1))
                            }
                            disabled={paymentPage === 1}
                          >
                            <ChevronLeft className="h-4 w-4" />
                            <span className="hidden sm:inline">Previous</span>
                          </Button>
                          <div className="text-muted-foreground text-sm">
                            {paymentPage}/{paymentTotalPages}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="min-h-[44px] min-w-[44px]"
                            onClick={() =>
                              setPaymentPage((p) =>
                                Math.min(paymentTotalPages, p + 1),
                              )
                            }
                            disabled={paymentPage >= paymentTotalPages}
                          >
                            <span className="hidden sm:inline">Next</span>
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </TabsContent>

              <TabsContent value="tokens" className="mt-6">
                {tokensLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Spinner className="text-primary h-6 w-6" />
                  </div>
                ) : tokenTransactions.length === 0 ? (
                  <div className="text-muted-foreground py-12 text-center">
                    No token transactions found
                  </div>
                ) : (
                  <>
                    <div className="space-y-3">
                      {tokenTransactions.map(
                        (transaction: TTokenTransaction) => (
                          <div
                            key={transaction._id}
                            className="border-border hover:bg-muted flex flex-col gap-3 rounded-lg border p-3 transition-colors sm:flex-row sm:items-center sm:justify-between sm:p-4"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <p
                                  className={`font-semibold ${
                                    transaction.type === "increase"
                                      ? "text-green-600"
                                      : "text-destructive"
                                  }`}
                                >
                                  {transaction.type === "increase" ? "+" : "-"}
                                  {transaction.token} Credits
                                </p>
                                {transaction.type === "increase" && (
                                  <Badge
                                    variant="secondary"
                                    className="capitalize"
                                  >
                                    {transaction.increase_source || "bonus"}
                                  </Badge>
                                )}
                                {transaction.type === "decrease" &&
                                  transaction.decrease_source && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      Feature Used
                                    </Badge>
                                  )}
                              </div>
                              {transaction.increase_source && (
                                <p className="text-muted-foreground mt-1 text-xs capitalize">
                                  Source: {transaction.increase_source}
                                </p>
                              )}
                              {transaction.decrease_source && (
                                <p className="text-muted-foreground mt-1 truncate text-xs">
                                  Feature:{" "}
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
                                      };
                                      return (
                                        sourceObj.name ||
                                        sourceObj.endpoint ||
                                        sourceObj._id ||
                                        "Unknown"
                                      );
                                    }
                                    return String(source);
                                  })()}
                                </p>
                              )}
                              {transaction.payment_transaction && (
                                <p className="text-muted-foreground mt-1 truncate text-xs">
                                  Payment:{" "}
                                  {typeof transaction.payment_transaction ===
                                  "string"
                                    ? transaction.payment_transaction
                                    : "Linked"}
                                </p>
                              )}
                              {transaction.created_at && (
                                <p className="text-muted-foreground mt-1 text-xs">
                                  {new Date(
                                    transaction.created_at,
                                  ).toLocaleString()}
                                </p>
                              )}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="shrink-0 min-h-[44px] w-full sm:ml-4 sm:w-auto"
                              onClick={() => handleViewToken(transaction)}
                            >
                              <Eye className="mr-1 h-4 w-4" />
                              View
                            </Button>
                          </div>
                        ),
                      )}
                    </div>

                    {tokenTotalPages > 1 && (
                      <div className="mt-6 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="text-muted-foreground text-xs sm:text-sm text-center sm:text-left">
                          Showing {(tokenPage - 1) * tokenLimit + 1} to{" "}
                          {Math.min(tokenPage * tokenLimit, tokenTotal)} of{" "}
                          {tokenTotal}
                        </div>
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="min-h-[44px] min-w-[44px]"
                            onClick={() =>
                              setTokenPage((p) => Math.max(1, p - 1))
                            }
                            disabled={tokenPage === 1}
                          >
                            <ChevronLeft className="h-4 w-4" />
                            <span className="hidden sm:inline">Previous</span>
                          </Button>
                          <div className="text-muted-foreground text-sm">
                            {tokenPage}/{tokenTotalPages}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="min-h-[44px] min-w-[44px]"
                            onClick={() =>
                              setTokenPage((p) =>
                                Math.min(tokenTotalPages, p + 1),
                              )
                            }
                            disabled={tokenPage >= tokenTotalPages}
                          >
                            <span className="hidden sm:inline">Next</span>
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Transaction Detail Modals */}
      <TransactionDetailModal
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setSelectedPaymentTransaction(null);
        }}
        transaction={selectedPaymentTransaction}
        type="payment"
      />

      <TransactionDetailModal
        isOpen={isTokenModalOpen}
        onClose={() => {
          setIsTokenModalOpen(false);
          setSelectedTokenTransaction(null);
        }}
        transaction={selectedTokenTransaction}
        type="token"
      />
    </div>
  );
}
