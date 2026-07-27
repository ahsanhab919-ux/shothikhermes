"use client";

import { updateWalletToken } from "@/redux/slices/user-wallet-slice";
import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { io } from "socket.io-client";

const WalletSocketApplier = () => {
  const dispatch = useDispatch();
  const { accessToken, user } = useSelector((state) => state.auth);
  const socketRef = useRef(null);
  const isConnectedRef = useRef(false);

  useEffect(() => {
    // Only connect if user is logged in and has access token
    if (!accessToken || !user?._id) {
      // Clean up existing connection if user logs out
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        isConnectedRef.current = false;
      }
      return;
    }

    // Prevent duplicate connections
    if (socketRef.current) {
      return;
    }

    // Get payment server URL from environment or use default
    const paymentServerUrl =
      process.env.NEXT_PUBLIC_PAYMENT_SYSTEM_URL ||
      "https://payment-qa-svc.shothik.ai";

    // Create socket connection to payment server
    const socket = io(paymentServerUrl, {
      transports: ["websocket"],
      auth: {
        token: accessToken,
      },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 5000,
    });

    socketRef.current = socket;

    // Handle connection
    socket.on("connect", () => {
      isConnectedRef.current = true;
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      isConnectedRef.current = false;
    });

    // Handle connection errors
    socket.on("connect_error", (error) => {
      console.error("[Wallet Socket] Connection error:", error);
      isConnectedRef.current = false;
    });

    // Listen for wallet token update events
    socket.on("wallet:token-updated", (data) => {
      try {
        const { token } = data || {};

        // Validate token is a number
        if (typeof token === "number" && token >= 0) {
          // Update Redux state with new token value
          dispatch(updateWalletToken(token));
        } else {
          console.warn("[Wallet Socket] Invalid token value received:", token);
        }
      } catch (error) {
        console.error("[Wallet Socket] Error processing token update:", error);
      }
    });

    // Cleanup on unmount or when dependencies change
    return () => {
      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
        isConnectedRef.current = false;
      }
    };
  }, [accessToken, user?._id, dispatch]);

  return null;
};

export default WalletSocketApplier;
