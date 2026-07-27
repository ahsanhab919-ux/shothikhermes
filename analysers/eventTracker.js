import { googleEvent } from "./googleConfiq";

export const trackEvent = (action, category, label, value) => {
  googleEvent(action, category, label, value);
};
