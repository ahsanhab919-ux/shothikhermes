import type { TPaymentTransaction } from "./payment-transaction.type";
import type { Response } from "./response.type";

export type TTokenTransactionType = "increase" | "decrease";
export type TTokenTransactionIncreaseSource = "payment" | "bonus";

export type TTokenTransaction = {
  _id: string;
  user: string;
  user_wallet: string;
  type: TTokenTransactionType;
  token: number;
  increase_source?: TTokenTransactionIncreaseSource;
  decrease_source?: string | { _id: string; name?: string; endpoint?: string; token?: number }; // FeatureEndpoint ID or populated object
  payment_transaction?: string | TPaymentTransaction; // Can be ID or populated object
  plan?: string | { _id: string; name: string; duration: number };
  is_deleted?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type TTokenTransactionResponse = Response<TTokenTransaction>;
export type TTokenTransactionsResponse = Response<TTokenTransaction[]>;

