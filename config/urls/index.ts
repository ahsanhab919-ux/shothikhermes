import { ENV } from "../env";

export const URLS = {
  app: ENV.app_url,
  api: ENV.api_url,
  user: `${ENV.api_url}/uploads/users`,
};
