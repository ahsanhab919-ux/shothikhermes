"use client";

import {
  BreadcrumbItem,
  BreadcrumbList,
  Breadcrumb as BreadcrumbRoot,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";
import PolicyNavigation from "./PolicyNavigation";

function Separator() {
  return <ChevronRight className="text-muted-foreground h-4 w-4" />;
}

export default function PolicyPageLayout({
  heading,
  links,
  children,
  subtitle,
  navigationItems = [],
}) {
  return (
    <div className="bg-background min-h-screen">
      {/* Header Banner with Background Image and Gradient Overlay - matching Figma */}
      <div className="relative w-full overflow-hidden py-16 md:py-20 lg:py-24">
        {/* Background Image Layer - Base layer (must be visible) */}
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: "url(/policy-bg.png)",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        />

        {/* Light gradient overlay to enhance green theme while keeping image visible - matching Figma */}
        <div className="from-primary/70 via-primary/60 to-primary/70 absolute inset-0 z-[1] bg-gradient-to-r" />

        {/* Content */}
        <div className="relative z-10 container mx-auto max-w-[1200px] px-4 md:px-6">
          <h1 className="mb-3 text-3xl font-bold text-white drop-shadow-sm md:text-4xl lg:text-5xl">
            {heading}
          </h1>
          {subtitle && (
            <p className="text-sm leading-relaxed text-white/95 drop-shadow-sm md:text-base">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="container mx-auto max-w-[1200px] px-4 py-6 md:px-6 md:py-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
          {/* Left Navigation Sidebar */}
          {navigationItems.length > 0 && (
            <aside className="w-full lg:w-64 lg:shrink-0">
              <PolicyNavigation items={navigationItems} />
            </aside>
          )}

          {/* Main Content */}
          <div className="w-full min-w-0 flex-1 overflow-x-hidden">
            {/* Breadcrumb - styled consistently */}
            <div className="mb-6" data-breadcrumb-container>
              <BreadcrumbRoot>
                <BreadcrumbList className="flex-wrap">
                  {links.map((link, idx) => (
                    <div key={idx} className="flex items-center">
                      <BreadcrumbItem
                        className={cn(
                          "text-muted-foreground hover:text-foreground inline-flex items-center text-sm capitalize transition-colors",
                          idx === links.length - 1 &&
                            "text-foreground font-medium",
                        )}
                      >
                        {link.name}
                      </BreadcrumbItem>
                      {idx < links.length - 1 && (
                        <BreadcrumbSeparator className="mx-2">
                          <Separator />
                        </BreadcrumbSeparator>
                      )}
                    </div>
                  ))}
                </BreadcrumbList>
              </BreadcrumbRoot>
            </div>

            {/* Content - consistent spacing and typography */}
            <div className="text-foreground [&_h1]:first-child:mt-0 [&_a]:text-primary space-y-6 break-words [&_a]:break-words [&_a]:hover:underline [&_h1]:mt-8 [&_h1]:mb-4 [&_h1]:text-xl [&_h1]:font-bold [&_h1]:sm:text-2xl [&_h1]:md:text-3xl [&_h1[id]]:scroll-mt-24 [&_h2]:mt-6 [&_h2]:mb-3 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:sm:text-xl [&_h2]:md:text-2xl [&_h2[id]]:scroll-mt-24 [&_h3]:mt-4 [&_h3]:mb-2 [&_h3]:text-base [&_h3]:font-medium [&_h3]:sm:text-lg [&_h3]:md:text-xl [&_li]:text-sm [&_li]:leading-relaxed [&_li]:sm:text-base [&_p]:mb-4 [&_p]:text-sm [&_p]:leading-relaxed [&_p]:sm:text-base [&_strong]:font-semibold [&_ul]:mb-4 [&_ul]:list-inside [&_ul]:list-disc [&_ul]:space-y-1">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
