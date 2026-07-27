import AgentHistory from "@/components/agents/shared/AgentHistory";
import AuthApplier from "@/components/appliers/AuthApplier";
import DebugLogApplier from "@/components/appliers/DebugLogApplier";
import AuthSuccessPopup from "@/components/auth/AuthSuccessPopoup";
import VerifyEmailAlert from "@/components/auth/VerifyEmailAlert";
import FooterViewProvider from "@/components/common/FooterViewProvider";
import DebugPanel from "@/components/debug/DebugPanel";
import Footer from "@/components/partials/footer";
import Header from "@/components/partials/header";
import IconNavSidebar from "@/components/partials/icon-nav-sidebar";
import MobileBottomNav from "@/components/partials/mobile-bottom-nav";
import AlertDialog from "@/components/tools/common/AlertDialog";
import { SidebarProvider } from "@/components/ui/sidebar";
import ProgressProvider from "@/providers/ProgressProvider";
import { Suspense } from "react";

export default function PrimaryLayout({ children }) {
  return (
    <ProgressProvider
      color={"#00AB55"}
      options={{ showSpinner: false }}
      shallowRouting
    >
      <>
        <AuthApplier />
        <DebugLogApplier />
      </>
      <div suppressHydrationWarning>
        <SidebarProvider defaultOpen={false}>
          <div className="flex h-screen w-full">
            <IconNavSidebar />
            <div className="flex min-h-screen flex-1 flex-col">
              <div>
                <Header layout="primary" />
                <VerifyEmailAlert />
              </div>
              <div className="primary-layout-wrapper flex max-w-full flex-1 flex-col overflow-y-auto pb-14 md:pb-0">
                <div className="relative flex flex-1 flex-col">
                  <Suspense fallback={null}>
                    <AgentHistory />
                  </Suspense>
                  {children}
                </div>
                <FooterViewProvider>
                  <Footer />
                </FooterViewProvider>
              </div>
            </div>
          </div>
          <MobileBottomNav />
        </SidebarProvider>
      </div>
      <>
        <AuthSuccessPopup />
        <AlertDialog />
        <DebugPanel />
      </>
    </ProgressProvider>
  );
}
