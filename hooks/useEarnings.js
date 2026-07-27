"use client";

import { useCallback, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export function useEarnings(userId) {
  const summary = useQuery(
    api.earnings.getEarningsSummary,
    userId ? {} : "skip"
  );

  return {
    summary: summary || {
      totalEarnings: 0,
      totalUnitsSold: 0,
      lifetimeRevenue: 0,
      availableBalance: 0,
      totalPaidOut: 0,
      pendingPayouts: 0,
      publishedBooksCount: 0,
      monthlyBreakdown: [],
      perBookEarnings: [],
    },
    isLoading: summary === undefined,
  };
}

export function usePayouts(userId) {
  const [isRequesting, setIsRequesting] = useState(false);
  const [error, setError] = useState(null);

  const history = useQuery(
    api.earnings.getPayoutHistory,
    userId ? {} : "skip"
  );

  const accounts = useQuery(
    api.earnings.getPayoutAccounts,
    userId ? {} : "skip"
  );

  const requestPayoutMut = useMutation(api.earnings.requestPayout);
  const saveAccountMut = useMutation(api.earnings.savePayoutAccount);

  const requestPayout = useCallback(
    async ({ amount, method, periodStart, periodEnd }) => {
      setIsRequesting(true);
      setError(null);
      try {
        const id = await requestPayoutMut({
          amount,
          method,
          periodStart,
          periodEnd,
        });
        return id;
      } catch (err) {
        setError(err.message);
        throw err;
      } finally {
        setIsRequesting(false);
      }
    },
    [requestPayoutMut]
  );

  const savePayoutAccount = useCallback(
    async (accountData) => {
      setError(null);
      try {
        return await saveAccountMut(accountData);
      } catch (err) {
        setError(err.message);
        throw err;
      }
    },
    [saveAccountMut]
  );

  return {
    history: history || [],
    accounts: accounts || [],
    isLoading: history === undefined,
    isRequesting,
    error,
    requestPayout,
    savePayoutAccount,
  };
}
