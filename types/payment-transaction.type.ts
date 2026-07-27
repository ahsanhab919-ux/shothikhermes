import type { Response } from "./response.type";

export type TPaymentTransactionStatus =
  | "pending"
  | "success"
  | "failed"
  | "refunded";
export type TCurrency = "USD" | "BDT";

// Status response type (for getPaymentTransactionStatus API)
export type TPaymentTransactionStatusResponse = {
  status: TPaymentTransactionStatus;
  gateway_status?: string;
  amount: number;
  currency: TCurrency;
  payment_method_id?: string;
  payment_method_name?: string;
  return_url?: string;
  cancel_url?: string;
};

export type TPaymentTransaction = {
  _id: string;
  user: string;
  user_wallet: string;
  status: TPaymentTransactionStatus;
  payment_method: string;
  gateway_transaction_id: string;
  gateway_session_id?: string;
  gateway_status?: string;
  package: string;
  plan: string;
  price: string; // PackagePlan document _id
  amount: number;
  currency: TCurrency;
  gateway_fee?: number;
  failure_reason?: string;
  refund_id?: string;
  refunded_at?: string;
  paid_at?: string;
  failed_at?: string;
  customer_email?: string;
  customer_name?: string;
  return_url?: string; // Frontend return URL (stored for redirect after payment)
  cancel_url?: string; // Frontend cancel URL (stored for redirect after payment)
  gateway_response?: Record<string, any>;
  is_deleted?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type TPaymentTransactionResponse = Response<TPaymentTransaction>;
export type TPaymentTransactionsResponse = Response<TPaymentTransaction[]>;

export type TInitiatePaymentResponse = {
  payment_transaction: TPaymentTransaction;
  redirect_url?: string;
  payment_url?: string;
};

export type TInitiatePaymentResponseData = Response<TInitiatePaymentResponse>;

