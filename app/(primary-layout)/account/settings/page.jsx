"use client";

import AccountGeneral from "@/components/(primary-layout)/(account-page)/AccountGeneralFormSection";
import AccountWalletSection from "@/components/(primary-layout)/(account-page)/AccountWalletSection";
import MasterDashboard from "@/components/(primary-layout)/(account-page)/MasterDashboard";
import BillingPage from "@/components/subscription/BillingPage";
import CreditPurchaseModal from "@/components/credits/CreditPurchaseModal";
import MyLibrarySection from "@/components/credits/MyLibrarySection";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PATH_ACCOUNT } from "@/config/route";
import { trackCreditPurchaseCompleted } from "@/lib/posthog";
import { useTranslation, SUPPORTED_LOCALES } from "@/i18n";
import { useSyncLocaleToConvex } from "@/i18n/useSyncLocaleToConvex";
import { User, Wallet, Bot, BookOpen, Brain, CheckCircle2, XCircle, Globe, ArrowRight, CreditCard } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";

export const dynamic = "force-dynamic";

export default function AccountSettings() {
  const { push } = useRouter();
  const { user, accessToken } = useSelector((state) => state.auth);
  const [currentTab, setCurrentTab] = useState("general");
  const [purchaseBanner, setPurchaseBanner] = useState(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const { t, locale, setLocale } = useTranslation();
  const syncLocale = useSyncLocaleToConvex();

  const handleLocaleChange = (code) => {
    setLocale(code);
    if (user?._id) {
      syncLocale(user._id, code);
    }
  };

  useEffect(() => {
    if (!accessToken || !user) {
      push("/");
    }
  }, [accessToken, user, push]);

  useEffect(() => {
    document.title = `${t('account.breadcrumbAccount')} ${t('account.breadcrumbSettings')} - ${currentTab} | Shothik AI`;
  }, [currentTab, t]);

  const handleTab = (newValue) => {
    setCurrentTab(newValue);
    setPurchaseBanner(null);
    const pathMap = {
      general: PATH_ACCOUNT.settings.general,
      billing: PATH_ACCOUNT.settings.billing,
      wallet: `${PATH_ACCOUNT.settings.root}?section=wallet`,
      library: `${PATH_ACCOUNT.settings.root}?section=library`,
      agents: `${PATH_ACCOUNT.settings.root}?section=agents`,
    };
    globalThis.window.history.pushState(
      {},
      "",
      pathMap[newValue] || PATH_ACCOUNT.settings.root,
    );
  };

  useEffect(() => {
    if (globalThis.window !== undefined) {
      const params = new URLSearchParams(globalThis.window.location.search);
      const section = params.get("section");
      const creditPurchase = params.get("credit_purchase");
      const credits = params.get("credits");

      if (section && ["general", "billing", "wallet", "agents", "library"].includes(section)) {
        setCurrentTab(section);
      }

      if (creditPurchase === "success") {
        const provider = params.get("provider") || "stripe";
        const pack = params.get("pack") || "starter";
        const validProviders = ["stripe", "bkash", "razorpay"];
        const validPacks = ["starter", "popular", "value", "mega"];
        if (validProviders.includes(provider) && validPacks.includes(pack)) {
          trackCreditPurchaseCompleted(provider, pack);
        }
        setCurrentTab("wallet");
        setPurchaseBanner({
          type: "success",
          message: credits
            ? t('account.creditsPurchasedWithAmount', { amount: parseInt(credits, 10).toLocaleString() })
            : t('account.creditsPurchased'),
        });
        const cleanUrl = `${globalThis.window.location.pathname}?section=wallet`;
        globalThis.window.history.replaceState({}, "", cleanUrl);
      } else if (creditPurchase === "cancelled") {
        setCurrentTab("wallet");
        setPurchaseBanner({
          type: "cancelled",
          message: t('account.paymentCancelled'),
        });
        const cleanUrl = `${globalThis.window.location.pathname}?section=wallet`;
        globalThis.window.history.replaceState({}, "", cleanUrl);
      }
    }
  }, []);

  return (
    <div className="px-3 py-6 sm:px-4 pb-24 md:pb-6">
      <Breadcrumb className="mb-4 sm:mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink>{t('account.breadcrumbAccount')}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="#">{t('account.breadcrumbSettings')}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="capitalize">{currentTab}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Tabs value={currentTab} onValueChange={handleTab} className="w-full">
        <div className="-mx-3 px-3 sm:mx-0 sm:px-0 overflow-x-auto scrollbar-none">
          <TabsList className="inline-flex w-auto min-w-full sm:min-w-0 sm:grid sm:w-fit sm:grid-cols-5">
            <TabsTrigger
              value="general"
              className="flex cursor-pointer items-center gap-2 min-h-[44px] whitespace-nowrap px-3 sm:px-4"
            >
              <User className="text-muted-foreground h-4 w-4" />
              <span className="hidden sm:inline">{t('account.general')}</span>
              <span className="sm:hidden">{t('account.general')}</span>
            </TabsTrigger>
            <TabsTrigger
              value="billing"
              className="flex cursor-pointer items-center gap-2 min-h-[44px] whitespace-nowrap px-3 sm:px-4"
            >
              <CreditCard className="text-muted-foreground h-4 w-4" />
              Billing
            </TabsTrigger>
            <TabsTrigger
              value="wallet"
              className="flex cursor-pointer items-center gap-2 min-h-[44px] whitespace-nowrap px-3 sm:px-4"
            >
              <Wallet className="text-muted-foreground h-4 w-4" />
              {t('account.wallet')}
            </TabsTrigger>
            <TabsTrigger
              value="library"
              className="flex cursor-pointer items-center gap-2 min-h-[44px] whitespace-nowrap px-3 sm:px-4"
            >
              <BookOpen className="text-muted-foreground h-4 w-4" />
              <span className="hidden sm:inline">{t('account.myLibrary')}</span>
              <span className="sm:hidden">{t('account.myLibrary')}</span>
            </TabsTrigger>
            <TabsTrigger
              value="agents"
              className="flex cursor-pointer items-center gap-2 min-h-[44px] whitespace-nowrap px-3 sm:px-4"
            >
              <Bot className="text-muted-foreground h-4 w-4" />
              <span className="hidden sm:inline">{t('account.myAgents')}</span>
              <span className="sm:hidden">{t('account.myAgents')}</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="general" className="my-6 sm:my-8">
          <div className="space-y-8">
            <AccountGeneral user={user} />

            <div className="rounded-xl border border-border bg-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <Globe className="h-5 w-5 text-muted-foreground" />
                <div>
                  <h3 className="text-base font-semibold">{t('account.languagePreference')}</h3>
                  <p className="text-sm text-muted-foreground">{t('account.languageDescription')}</p>
                </div>
              </div>
              <div className="flex gap-3">
                {SUPPORTED_LOCALES.map((loc) => (
                  <button
                    key={loc.code}
                    onClick={() => handleLocaleChange(loc.code)}
                    className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer ${
                      locale === loc.code
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-background text-foreground hover:bg-muted"
                    }`}
                    data-testid={`settings-lang-${loc.code}`}
                  >
                    {loc.nativeLabel}
                    {locale === loc.code && (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <Link
              href="/second-me"
              className="block rounded-xl border border-violet-500/20 bg-gradient-to-br from-violet-500/5 to-blue-500/5 p-6 transition-all hover:border-violet-500/40 hover:from-violet-500/10 hover:to-blue-500/10 no-underline group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10">
                    <Brain className="h-5 w-5 text-violet-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-foreground">{t('account.secondMeTitle')}</h3>
                    <p className="text-sm text-muted-foreground">{t('account.secondMeDescription')}</p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-violet-400 transition-colors flex-shrink-0" />
              </div>
            </Link>
          </div>
        </TabsContent>

        <TabsContent value="billing" className="my-6 sm:my-8">
          <BillingPage />
        </TabsContent>

        <TabsContent value="wallet" className="my-6 sm:my-8">
          {purchaseBanner && (
            <div
              role="alert"
              className={`mb-6 flex items-start sm:items-center gap-3 rounded-xl border px-4 py-3 ${
                purchaseBanner.type === "success"
                  ? "border-emerald-500/30 bg-emerald-950/30 text-emerald-400"
                  : "border-amber-500/30 bg-amber-950/30 text-amber-400"
              }`}
            >
              {purchaseBanner.type === "success" ? (
                <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5 sm:mt-0" />
              ) : (
                <XCircle className="h-5 w-5 shrink-0 mt-0.5 sm:mt-0" />
              )}
              <p className="flex-1 text-sm font-medium">{purchaseBanner.message}</p>
              <div className="flex shrink-0 items-center gap-2">
                {purchaseBanner.type === "cancelled" && (
                  <button
                    onClick={() => {
                      setPurchaseBanner(null);
                      setShowPurchaseModal(true);
                    }}
                    className="shrink-0 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-background hover:bg-amber-400 min-h-[36px]"
                  >
                    {t('common.retry')}
                  </button>
                )}
                <button
                  onClick={() => setPurchaseBanner(null)}
                  className="shrink-0 text-xs opacity-60 hover:opacity-100 min-h-[36px] min-w-[36px] flex items-center justify-center"
                  aria-label={t('common.dismiss')}
                >
                  ✕
                </button>
              </div>
            </div>
          )}
          <AccountWalletSection />
        </TabsContent>

        <TabsContent value="library" className="my-6 sm:my-8">
          <MyLibrarySection />
        </TabsContent>

        <TabsContent value="agents" className="my-6 sm:my-8">
          {user?._id || user?.email ? (
            <MasterDashboard masterId={user._id ?? user.email} />
          ) : (
            <p className="text-sm text-muted-foreground">{t('account.loadingAgents')}</p>
          )}
        </TabsContent>
      </Tabs>

      <CreditPurchaseModal
        open={showPurchaseModal}
        onOpenChange={setShowPurchaseModal}
      />
    </div>
  );
}
