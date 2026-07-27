import api from "@/lib/api-payment";
import type { TPackageResponse, TPackagesResponse } from "@/types/package.type";
import type {
  TPaymentMethodResponse,
  TPaymentMethodsResponse,
} from "@/types/payment-method.type";
import type {
  TInitiatePaymentResponseData,
  TPaymentTransactionResponse,
  TPaymentTransactionStatusResponse,
} from "@/types/payment-transaction.type";
import type { TPlansResponse } from "@/types/plan.type";

// ========== Plan APIs (Public Only) ==========

// GET Public Plans (No Auth Required)
export async function fetchPublicPlans(
  query?: Record<string, unknown>,
): Promise<TPlansResponse> {
  const response = await api.get("/api/plans/public", { params: query });
  return response.data as TPlansResponse;
}

// ========== Package APIs (Public Only) ==========

// GET Public Packages (No Auth Required)
export async function fetchPublicPackages(
  query?: Record<string, unknown>,
): Promise<TPackagesResponse> {
  const response = await api.get("/api/packages/public", { params: query });
  return response.data as TPackagesResponse;
}

// GET Single Public Package by ID (No Auth Required)
export async function fetchPublicPackage(
  id: string,
): Promise<TPackageResponse> {
  const response = await api.get(`/api/packages/public/${id}`);
  return response.data as TPackageResponse;
}

// ========== Payment Method APIs (Public Only) ==========

// GET Public Payment Methods (No Auth Required)
export async function fetchPublicPaymentMethods(
  query?: Record<string, unknown>,
): Promise<TPaymentMethodsResponse> {
  const response = await api.get("/api/payment-methods/public", {
    params: query,
  });
  return response.data as TPaymentMethodsResponse;
}

// GET Single Public Payment Method by ID (No Auth Required)
export async function fetchPublicPaymentMethod(
  id: string,
): Promise<TPaymentMethodResponse> {
  const response = await api.get(`/api/payment-methods/${id}/public`);
  return response.data as TPaymentMethodResponse;
}

// ========== Payment Transaction APIs (Public - User Actions) ==========

// POST Initiate Payment (User/Admin)
export async function initiatePayment(payload: {
  package: string;
  plan: string;
  payment_method: string;
  return_url: string;
  cancel_url: string;
  customer_email?: string;
  customer_name?: string;
  customer_phone?: string;
}): Promise<TInitiatePaymentResponseData> {
  const response = await api.post(
    "/api/payment-transactions/initiate",
    payload,
  );
  return response.data as TInitiatePaymentResponseData;
}

// POST Verify Payment (User/Admin)
export async function verifyPayment(
  id: string,
): Promise<TPaymentTransactionResponse> {
  const response = await api.post(`/api/payment-transactions/${id}/verify`);
  return response.data as TPaymentTransactionResponse;
}

// GET Payment Transaction Status (User/Admin)
export async function fetchPaymentTransactionStatus(
  id: string,
): Promise<{ data: TPaymentTransactionStatusResponse }> {
  const response = await api.get(`/api/payment-transactions/${id}/status`);
  return { data: response.data.data as TPaymentTransactionStatusResponse };
}
