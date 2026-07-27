import Analytics from "@/analysers/Analytics";
import FeatureEndpointsApplier from "@/components/appliers/FeatureEndpointsApplier";
import FeaturePopupApplier from "@/components/appliers/FeaturePopupApplier";
import SettingApplier from "@/components/appliers/SettingApplier";
import ToastApplier from "@/components/appliers/ToastApplier";
import WalletApplier from "@/components/appliers/WalletApplier";
import WalletSocketApplier from "@/components/appliers/WalletSocketApplier";
import { LoginModal, RegisterModal } from "@/components/auth/AuthModal";
import { Login } from "@/components/auth/components/Login";
import { Register } from "@/components/auth/components/Register";
import UploadProgressIndicator from "@/components/tools/common/UploadProgressIndicator";
import Providers from "@/providers";
import LandingPageRedirectProvider from "@/providers/RedirectProvider";
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { ThemeScript } from "@/components/common/ThemeScript";
import "./globals.css";

export const metadata: Metadata = {
  title: "Shothik AI",
  description: "Shothik AI is a platform for AI-powered tools and services.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />

        {process.env.NODE_ENV === "production" && (
          <script
            src="https://rybbit.shothik.live/api/script.js"
            data-site-id="7e1390f29be4"
            defer
          ></script>
        )}
      </head>
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=GTM-PPRFW7NP`}
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          ></iframe>
        </noscript>
        <LandingPageRedirectProvider>
          <Providers>
            <SettingApplier />
            <ToastApplier />
            <WalletApplier />
            <WalletSocketApplier />
            <FeatureEndpointsApplier />
            <FeaturePopupApplier />
            <UploadProgressIndicator />

            <LoginModal>
              <Login />
            </LoginModal>
            <RegisterModal>
              <Register />
            </RegisterModal>

            <div>{children}</div>
          </Providers>
          <Analytics />
        </LandingPageRedirectProvider>
      </body>
    </html>
  );
}
