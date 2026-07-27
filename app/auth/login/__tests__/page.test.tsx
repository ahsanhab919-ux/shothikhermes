import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import LoginPage from "../page";

const { replace, login, saveAuthFlowState, trackLoginIntentCaptured } = vi.hoisted(() => ({
  replace: vi.fn(),
  login: vi.fn(),
  saveAuthFlowState: vi.fn(),
  trackLoginIntentCaptured: vi.fn(),
}));

let searchParamsState: Record<string, string | null> = {
  intent: "research",
  email: null,
  verified: null,
  redirect: null,
};

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace,
  }),
  useSearchParams: () => ({
    get: (key: string) => searchParamsState[key] ?? null,
  }),
}));

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/providers/AuthProvider", () => ({
  useAuth: () => ({
    login,
  }),
}));

vi.mock("@/components/auth/AuthWithSocial", () => ({
  default: () => <div data-testid="social-auth" />,
}));

vi.mock("@/lib/auth-flow", () => ({
  getLoginFlowVariant: () => "contextual",
  normalizeAuthIntent: (value: string | null) => value ?? "continue",
  saveAuthFlowState,
}));

vi.mock("@/lib/posthog", () => ({
  trackLoginIntentCaptured,
}));

describe("LoginPage", () => {
  beforeEach(() => {
    replace.mockReset();
    login.mockReset();
    saveAuthFlowState.mockReset();
    trackLoginIntentCaptured.mockReset();
    searchParamsState = {
      intent: "research",
      email: null,
      verified: null,
      redirect: null,
    };
  });

  it("prefills the email field and shows the verified success banner from query params", () => {
    searchParamsState.email = "verified@example.com";
    searchParamsState.verified = "1";

    render(<LoginPage />);

    expect(screen.getByLabelText("Email")).toHaveValue("verified@example.com");
    expect(screen.getByRole("status")).toHaveTextContent("Email verified. You can sign in now.");
  });

  it("offers a verification link when sign-in requires email verification", async () => {
    searchParamsState.email = "user@example.com";
    login.mockRejectedValue(new Error("Email verification required"));

    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "secret123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Sign in and continue/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Email verification required");
    expect(screen.getByRole("link", { name: /Enter verification code/i })).toHaveAttribute(
      "href",
      "/auth/verify-email?email=user%40example.com",
    );
  });
});
