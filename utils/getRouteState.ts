export function getRouteState(searchParams: URLSearchParams) {
  const encodedState = searchParams.get("state");

  if (!encodedState) return null;

  try {
    return JSON.parse(decodeURIComponent(encodedState));
  } catch (error) {
    console.error("Failed to decode route state:", error);
    return null;
  }
}
