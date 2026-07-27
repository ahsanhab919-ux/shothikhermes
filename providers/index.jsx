"use client";

import store from "@/redux/store";
import { MotionConfig } from "framer-motion";
import { Provider } from "react-redux";
import AnalyticsLoader from "../components/analytics/AnalyticsProvider";
import { NotificationProvider } from "./NotificationProvider";
import TanstackQueryProvider from "./TanstackQueryProvider";
import { AuthProvider } from "./AuthProvider";
import ConvexClientProvider from "./ConvexClientProvider";
import { I18nProvider } from "@/i18n";
import { LocaleSync } from "@/i18n/LocaleSync";

export default function Providers({ children }) {
  return (
    <MotionConfig reducedMotion="user">
      <Provider store={store}>
        <TanstackQueryProvider>
          <AnalyticsLoader />
          <NotificationProvider>
            <AuthProvider>
              <ConvexClientProvider>
                <I18nProvider>
                  <LocaleSync />
                  {children}
                </I18nProvider>
              </ConvexClientProvider>
            </AuthProvider>
          </NotificationProvider>
        </TanstackQueryProvider>
      </Provider>
    </MotionConfig>
  );
}
