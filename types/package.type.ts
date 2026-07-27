import type { Response } from "./response.type";

export type TCurrency = "USD" | "BDT";

export type TPackagePrice = {
  USD: number;
  BDT: number;
};

export type TPackagePlanItem = {
  _id: string;
  plan: {
    _id: string;
    name: string;
    duration: number;
  };
  price: TPackagePrice;
  previous_price?: TPackagePrice;
  token: number;
  is_initial: boolean;
  is_active: boolean;
};

export type TPackage = {
  _id: string;
  name: string;
  description?: string;
  content?: string;
  type?: "token" | "subscription";
  badge?: string;
  points?: string[];
  features: string[] | Array<{ _id: string; name: string }>;
  plans: TPackagePlanItem[];
  sequence?: number;
  is_initial: boolean;
  is_active: boolean;
  is_deleted?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type TPackageResponse = Response<TPackage>;
export type TPackagesResponse = Response<TPackage[]>;
