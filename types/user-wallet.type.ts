import type { Response } from "./response.type";

export type TFeature = {
  _id: string;
  name: string;
  description?: string;
  type?: string;
};

export type TUserWallet = {
  _id: string;
  user: string;
  package?:
    | string
    | {
        _id: string;
        name: string;
        features?: TFeature[] | string[];
      }
    | null;
  plan?: string | { _id: string; name: string; duration: number } | null;
  token: number;
  expires_at?: string;
  created_at?: string;
  updated_at?: string;
};

export type TUserWalletResponse = Response<TUserWallet>;
export type TUserWalletsResponse = Response<TUserWallet[]>;

