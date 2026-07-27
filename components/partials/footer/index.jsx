import { LINKS } from "@/_mock/footer";
import { _socials } from "@/_mock/socials";
import Logo from "@/components/partials/logo";
import Link from "next/link";
import { Fragment } from "react";

export default function Footer() {
  const simpleFooter = (
    <footer className="bg-background flex flex-col items-center justify-around gap-4 px-4 py-5 md:flex-row lg:px-4">
      <div className="bg-background flex justify-center md:block">
        <div className="flex flex-col items-start gap-1 md:flex-row md:items-start md:gap-4">
          <Logo />
          <div className="flex flex-col gap-1">
            <span className="text-foreground text-sm">
              © 2025 All rights reserved.
            </span>
            <div className="flex flex-col items-start justify-start gap-1 md:flex-row">
              <Link
                href="/terms"
                className="text-muted-foreground hover:text-foreground text-sm"
              >
                Terms of Service
              </Link>
              <Link
                href="/privacy"
                className="text-muted-foreground hover:text-foreground text-sm"
              >
                Privacy Policy
              </Link>
              <Link
                href="/deletion"
                className="text-muted-foreground hover:text-foreground text-sm"
              >
                Deletion Policy
              </Link>
              <Link
                href="/copyright"
                className="text-muted-foreground hover:text-foreground text-sm"
              >
                Copyright, Community Guidelines
              </Link>
              <Link
                href="/magna-carta"
                className="text-muted-foreground hover:text-foreground text-sm"
              >
                Magna Carta
              </Link>
            </div>
            <span className="text-muted-foreground text-sm">
              This site is protected by reCAPTCHA and the Google Privacy Policy
              and Terms of Service apply
            </span>
          </div>
        </div>
      </div>
      <div className="text-muted-foreground flex items-center justify-center text-center text-xs">
        Developed by 
        <Link
          href="/?utm_source=internal"
          className="underline-offset-4 hover:underline"
        >
          Shothik AI
        </Link>
      </div>
    </footer>
  );

  const mainFooter = (
    <footer className="bg-background relative">
      <div className="border-border border-t" />

      <div className="mx-auto max-w-screen-xl px-4 py-10 sm:px-6 md:px-8">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-4">
          {LINKS.map((list) => (
            <div
              key={list.headline}
              className="my-2 flex w-full flex-col gap-1"
            >
              <span className="text-muted-foreground my-2 text-xs font-semibold tracking-wide uppercase">
                {list.headline}
              </span>
              {list.children.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="text-muted-foreground hover:text-foreground text-sm"
                  data-rybbit-event="Footer Nav"
                  data-rybbit-prop-foot_event={link.name}
                >
                  {link.name.split("\n").map((line, index) => (
                    <Fragment key={index}>
                      {line}
                      {index !== link.name.split("\n").length - 1 && <br />}
                    </Fragment>
                  ))}
                </Link>
              ))}
            </div>
          ))}

          <div className="col-span-2 mt-4 sm:col-span-2 md:col-span-4">
            <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
              <div className="text-muted-foreground text-center text-xs font-semibold tracking-wide uppercase md:text-left">
                Get to Know Us
              </div>
              <div className="mb-5 -ml-1 flex justify-center md:mb-0 md:justify-start">
                {_socials.map((Social) => (
                  <Link
                    key={Social.name}
                    href={Social.path}
                    target="_blank"
                    className="border-border text-muted-foreground hover:text-foreground mr-2 inline-flex h-9 w-9 items-center justify-center rounded-md border"
                  >
                    {/* Prefer Lucide; if icon is not Lucide, fall back to text */}
                    {Social.icon ? (
                      <Social.icon />
                    ) : (
                      <span className="text-xs">{Social.name}</span>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );

  return (
    <>
      {mainFooter}
      {simpleFooter}
    </>
  );
}
