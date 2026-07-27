"use client";

import { setWallet, setWalletLoading } from "@/redux/slices/user-wallet-slice";
import { fetchSelfWallet, giveSelfInitialPackage } from "@/services/wallet.service";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

const WalletApplier = () => {
  const dispatch = useDispatch();
  const { accessToken } = useSelector((state) => state.auth);

  // Fetch wallet data automatically when user is logged in
  const { data: walletResponse, isLoading: walletQueryLoading } = useQuery({
    queryKey: ["user-wallet", "self"],
    queryFn: () => fetchSelfWallet(),
    enabled: !!accessToken, // Only fetch when user is logged in
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnMount: true, // Refetch when component mounts
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
    dispatch(setWalletLoading(walletQueryLoading));
  }, [walletQueryLoading, dispatch]);

  // Give initial package automatically when user is logged in
  // This ensures the user has the welcome package/credits
  const { data: initialPackageResponse } = useQuery({
    queryKey: ["give-initial-package-self"],
    queryFn: () => giveSelfInitialPackage(),
    enabled: !!accessToken,
    retry: false,
    staleTime: Infinity, // Run once per session/mount
    refetchOnWindowFocus: false,
  });

  // Update Redux if initial package response brings new data
  useEffect(() => {
    if (initialPackageResponse?.data) {
      dispatch(setWallet(initialPackageResponse.data));
    }
  }, [initialPackageResponse?.data, dispatch]);

  return null;
};

export default WalletApplier;

