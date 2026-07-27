import { UsageLimitError } from "./tools-api";

export function isUsageLimitError(error: unknown): error is UsageLimitError {
  return error instanceof UsageLimitError || 
    (error instanceof Error && error.name === "UsageLimitError");
}

export function handleUsageLimitError(
  error: UsageLimitError,
  options?: {
    toast?: (msg: string) => void;
    dispatch?: (action: unknown) => void;
    setShowAlert?: (show: boolean) => { type: string; payload: boolean };
    setAlertMessage?: (msg: string) => { type: string; payload: string };
  }
): boolean {
  const msg = `You've used ${error.used}/${error.limit} on your ${error.tier} plan. Upgrade at ${error.upgradeUrl}`;
  
  if (options?.dispatch && options?.setShowAlert && options?.setAlertMessage) {
    options.dispatch(options.setShowAlert(true));
    options.dispatch(options.setAlertMessage(msg));
    return true;
  }

  if (options?.toast) {
    options.toast(msg);
    return true;
  }

  return false;
}
