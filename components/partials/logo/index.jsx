import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { forwardRef } from "react";

const Logo = forwardRef(({ className }, ref) => {
  return (
    <Link
      ref={ref}
      href="/?utm_source=internal"
      className={cn("flex w-20 items-center justify-start lg:w-32", className)}
    >
      {/* For light mode */}
      <Image
        src="/shothik_light_logo.png"
        priority={true}
        alt="shothik_logo"
        width={100}
        height={40}
        className="inline-block h-auto w-full object-contain dark:hidden"
      />
      {/* For dark mode */}
      <Image
        src="/shothik_dark_logo.png"
        priority={true}
        alt="shothik_logo"
        width={100}
        height={40}
        className="hidden h-auto w-full object-contain dark:inline-block"
      />
    </Link>
  );
});

Logo.displayName = "Logo";

export default Logo;
