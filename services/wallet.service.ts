import api from "@/lib/api-payment";
import type {
    TPaymentTransactionResponse,
    TPaymentTransactionsResponse,
} from "@/types/payment-transaction.type";
import type {
    TTokenTransactionResponse,
    TTokenTransactionsResponse,
} from "@/types/token-transaction.type";
import type { TUserWalletResponse } from "@/types/user-wallet.type";

// ========== User Wallet APIs (Self) ==========

// GET Self Wallet (User/Admin)
export async function fetchSelfWallet(): Promise<TUserWalletResponse> {
  const response = await api.get("/api/user-wallets/self");
  return response.data as TUserWalletResponse;
}

// POST Give Initial Package (Self)
export async function giveSelfInitialPackage(): Promise<TUserWalletResponse> {
  const response = await api.post("/api/user-wallets/give-initial-package/self");
  return response.data as TUserWalletResponse;
}

// ========== Payment Transaction APIs (Self) ==========

// GET Self Payment Transactions (User/Admin)
export async function fetchSelfPaymentTransactions(
  query?: Record<string, any>,
): Promise<TPaymentTransactionsResponse> {
  const response = await api.get("/api/payment-transactions/self", {
    params: query,
  });
  return response.data as TPaymentTransactionsResponse;
}

// GET Single Payment Transaction by ID (User/Admin - own transactions only)
export async function fetchPaymentTransaction(
  id: string,
): Promise<TPaymentTransactionResponse> {
  const response = await api.get(`/api/payment-transactions/${id}`);
  return response.data as TPaymentTransactionResponse;
}

// ========== Token Transaction APIs (Self) ==========

// GET Self Token Transactions (User/Admin)
export async function fetchSelfTokenTransactions(
  query?: Record<string, any>,
): Promise<TTokenTransactionsResponse> {
  const response = await api.get("/api/token-transactions/self", {
    params: query,
  });
  return response.data as TTokenTransactionsResponse;
}

// GET Single Token Transaction by ID (User/Admin - own transactions only)
export async function fetchTokenTransaction(
  id: string,
): Promise<TTokenTransactionResponse> {
  const response = await api.get(`/api/token-transactions/${id}`);
  return response.data as TTokenTransactionResponse;
}
