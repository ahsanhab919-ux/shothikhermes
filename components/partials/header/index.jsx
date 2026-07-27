"use client";

import Logo from "@/components/partials/logo";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useGetUserQuery } from "@/redux/api/auth/authApi";
import { updateTheme } from "@/redux/slices/settings-slice";
import {
  AlignRight,
  BarChart3,
  Beaker,
  Brain,
  Brush,
  CheckCheck,
  ChevronDown,
  ChevronRight,
  Edit,
  FileText,
  FileSearch,
  Gem,
  GitBranch,
  Image,
  Images,
  Languages,
  Lightbulb,
  Menu,
  Palette,
  Presentation,
  Rocket,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import AccountPopover from "./AccountPopover";
import LanguageSwitcher from "./LanguageSwitcher";
import MenuColumn from "./MenuColumn";
import MobileMenu from "./MobileMenu";
import ThemeToggle from "./ThemeToggle";
import { useTranslation } from "@/i18n";
import dynamic from "next/dynamic";

const NotificationBell = dynamic(
  () => import("@/components/forum/NotificationBell"),
  { ssr: false }
);

const navLinkKeys = [
  { key: "nav.about", href: "/about-us" },
  { key: "nav.contact", href: "/contact-us" },
  { key: "nav.pricing", href: "/pricing" },
  { key: "nav.blogs", href: "/blogs" },
];

const featuresMenuKeys = {
  writing: {
    titleKey: "header.writing",
    items: [
      { labelKey: "header.paraphrase", icon: Edit, href: "/paraphrase" },
      { labelKey: "header.aiDetector", icon: Brain, href: "/ai-detector" },
      { labelKey: "header.humanizer", icon: Sparkles, href: "/humanize-gpt" },
      { labelKey: "header.plagiarismChecker", icon: FileSearch, href: "/plagiarism-checker" },
      { labelKey: "header.grammarChecker", icon: CheckCheck, href: "/grammar-checker" },
      { labelKey: "header.summarizer", icon: CheckCheck, href: "/summarize" },
      { labelKey: "header.translator", icon: Languages, href: "/translator" },
    ],
  },
  agents: {
    titleKey: "header.agents",
    items: [
      { labelKey: "header.aiSlides", icon: Presentation, href: "#ai-slides" },
      { labelKey: "header.deepResearch", icon: Beaker, href: "#research" },
      { labelKey: "header.dataAnalysis", icon: BarChart3, href: "#data-analysis" },
    ],
  },
  vibeMetaAutomation: {
    titleKey: "header.vibeMetaAutomation",
    items: [
      { labelKey: "header.productAnalysis", icon: FileText, href: "#product-analysis" },
      { labelKey: "header.aiStrategy", icon: Lightbulb, href: "#ai-strategy" },
      { labelKey: "header.aiAdSets", icon: Images, href: "#ai-ad-sets" },
      { labelKey: "header.aiAdCreatives", icon: Palette, href: "#ai-ad-creatives" },
      { labelKey: "header.aiAdCopies", icon: FileText, href: "#ai-ad-copies" },
      { labelKey: "header.aiPoweredEditing", icon: Brush, href: "#vibe-canvas" },
      { labelKey: "header.aiMediaCanvas", icon: Image, href: "#media-canvas" },
      { labelKey: "header.adLaunch", icon: Rocket, href: "#ad-launch" },
      { labelKey: "header.mindmapReports", icon: GitBranch, href: "#mindmap-reports" },
      { labelKey: "header.aiOptimization", icon: TrendingUp, href: "#ai-optimization" },
    ],
  },
};

export default function Header({ className, layout }) {
  const { accessToken, user } = useSelector((state) => state.auth);
  const { theme } = useSelector((state) => state.settings);
  const [mounted, setMounted] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    setMounted(true);
  }, []);

  const { isLoading } = useGetUserQuery(undefined, {
    skip: !accessToken,
  });

  const dispatch = useDispatch();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [featuresOpen, setFeaturesOpen] = useState(false);

  const showLoadingState = !mounted || isLoading;

  const navLinks = navLinkKeys.map((link) => ({
    label: t(link.key),
    href: link.href,
  }));

  const translateSection = (section) => ({
    title: t(section.titleKey),
    items: section.items.map((item) => ({
      label: t(item.labelKey),
      icon: item.icon,
      href: item.href,
    })),
  });

  const featuresSections = [
    translateSection(featuresMenuKeys.writing),
    translateSection(featuresMenuKeys.agents),
    translateSection(featuresMenuKeys.vibeMetaAutomation),
  ];

  if (layout === "primary") {
    return (
      <header
        className={cn(
          "bg-card relative z-50 h-12 border-b backdrop-blur-lg lg:h-16",
          className,
        )}
      >
        <div className="flex h-full items-center justify-between gap-6 px-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <Logo className="lg:hidden" />
            </div>

            <div className="hidden items-center gap-1 lg:flex">
              {navLinks.map((link) => (
                <Button
                  key={link.label}
                  variant="ghost"
                  asChild
                  className="text-muted-foreground hover:text-primary hover:bg-muted/50 px-2 text-sm font-semibold transition-colors"
                  data-testid={`nav-${link.label.toLowerCase()}`}
                  data-rybbit-event="Top Navbar"
                  data-rybbit-prop-top_navbar={link.label}
                >
                  <Link href={link.href}>{link.label}</Link>
                </Button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <LanguageSwitcher className="inline-flex" />
              <ThemeToggle className="inline-flex" />
              <div className="flex items-center gap-2 md:gap-3">
                {showLoadingState ? (
                  <div className="flex items-center gap-1">
                    <span className="bg-primary h-2 w-2 animate-bounce rounded-full [animation-delay:-0.3s]" />
                    <span className="bg-primary h-2 w-2 animate-bounce rounded-full [animation-delay:-0.15s]" />
                    <span className="bg-primary h-2 w-2 animate-bounce rounded-full" />
                  </div>
                ) : (
                  <>
                    {user?.email && (
                      <NotificationBell masterId={user._id ?? user.email} />
                    )}
                    {user?.package !== "unlimited" && (
                      <Link href={"/pricing?redirect=" + pathname}>
                        <Button
                          className={cn("h-9 px-1 text-xs md:text-sm")}
                          data-rybbit-event="clicked_upgrade_plan"
                        >
                          <Gem className="h-5 w-5" />
                          {user?.email ? t("header.upgrade") : t("header.upgradePlan")}
                        </Button>
                      </Link>
                    )}
                  </>
                )}

                {!showLoadingState && (
                  <AccountPopover accessToken={accessToken} user={user} />
                )}
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="text-foreground lg:hidden"
              onClick={() => setMobileMenuOpen(true)}
              data-testid="button-mobile-menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <MobileMenu
          open={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          featuresSections={featuresSections}
          navLinks={navLinks}
          theme={theme}
          setTheme={(value) => dispatch(updateTheme(value))}
        />
      </header>
    );
  }

  if (layout === "secondary") {
    return (
      <header
        className={cn(
          "bg-card relative z-50 h-12 border-b backdrop-blur-lg lg:h-16",
          className,
        )}
      >
        <div className="flex h-full items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <Logo />
            </div>

            <div className="hidden items-center gap-1 lg:flex">
              {navLinks.map((link) => (
                <Button
                  key={link.label}
                  variant="ghost"
                  asChild
                  className="text-muted-foreground hover:text-primary hover:bg-muted/50 px-2 text-sm font-semibold transition-colors"
                  data-testid={`nav-${link.label.toLowerCase()}`}
                >
                  <Link href={link.href}>{link.label}</Link>
                </Button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <LanguageSwitcher className="inline-flex" />
              <ThemeToggle className="inline-flex" />
              <div className="flex items-center gap-2 md:gap-3">
                {showLoadingState ? (
                  <div className="flex items-center gap-1">
                    <span className="bg-primary h-2 w-2 animate-bounce rounded-full [animation-delay:-0.3s]" />
                    <span className="bg-primary h-2 w-2 animate-bounce rounded-full [animation-delay:-0.15s]" />
                    <span className="bg-primary h-2 w-2 animate-bounce rounded-full" />
                  </div>
                ) : (
                  user?.package !== "unlimited" && (
                    <Link href={"/pricing?redirect=" + pathname}>
                      <Button
                        data-rybbit-event="clicked_upgrade_plan"
                        className={cn("h-9 px-1 text-xs md:text-sm")}
                      >
                        <Gem className="h-5 w-5" />
                        {user?.email ? t("header.upgrade") : t("header.upgradePlan")}
                      </Button>
                    </Link>
                  )
                )}

                {!showLoadingState && (
                  <AccountPopover accessToken={accessToken} user={user} />
                )}
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="text-foreground lg:hidden"
              onClick={() => setMobileMenuOpen(true)}
              data-testid="button-mobile-menu"
            >
              <AlignRight className="size-8" />
            </Button>
          </div>
        </div>

        <MobileMenu
          open={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          featuresSections={featuresSections}
          navLinks={navLinks}
          theme={theme}
          setTheme={(value) => dispatch(updateTheme(value))}
        />
      </header>
    );
  }
}
