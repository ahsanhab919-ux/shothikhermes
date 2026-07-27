import type { Response } from "./response.type";

export type TPlan = {
  _id: string;
  name: string;
  duration: number;
  is_active: boolean;
  is_deleted?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type TPlanResponse = Response<TPlan>;
export type TPlansResponse = Response<TPlan[]>;
