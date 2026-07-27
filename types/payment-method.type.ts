import type { Response } from "./response.type";

export type TPaymentMethod = {
  _id: string;
  name: string;
  value: string;
  currency: "USD" | "BDT";
  secret?: string;
  description?: string;
  public_key?: string;
  webhook_key?: string;
  webhook_url?: string;
  currencies?: string[];
  config?: Record<string, unknown>;
  is_test?: boolean;
  sequence?: number;
  is_active: boolean;
  is_deleted?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type TPaymentMethodResponse = Response<TPaymentMethod>;
export type TPaymentMethodsResponse = Response<TPaymentMethod[]>;

