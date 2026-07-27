"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

interface NewsCardProps {
  slug: string;
  title: string;
  category: string;
  date: string;
  image: any;
  featured?: boolean;
  viewMode?: "grid" | "list";
}

export const NewsCard = ({
  slug,
  title,
  category,
  date,
  image,
  featured = false,
  viewMode = "grid",
}: NewsCardProps) => {
  // Resolve image: if it's a static import object, extract .src; otherwise use as string
  const imgSrc = typeof image === "string" ? image : image?.src || image;

  // List view (compact horizontal card)
  if (viewMode === "list") {
    return (
      <Link href={`/blogs/${slug}`}>
        <article
          className={cn(
            "group bg-card flex cursor-pointer overflow-hidden rounded-2xl transition-all hover:shadow-lg",
            featured && "md:col-span-2 md:row-span-2",
          )}
        >
          <div className="relative h-40 w-64 shrink-0 overflow-hidden">
            <Image
              src={imgSrc}
              alt={title}
              fill
              sizes="250px"
              className="object-cover"
            />
          </div>
          <div className="flex-1 p-6">
            <h2 className="group-hover:text-muted-foreground mb-3 text-2xl leading-tight font-semibold transition-colors line-clamp-1">
              {title}
            </h2>
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <Badge variant="secondary" className="font-normal">
                {category}
              </Badge>
              <span>{date}</span>
            </div>
          </div>
        </article>
      </Link>
    );
  }

  // Featured hero-like card
  if (featured && viewMode === "grid") {
    return (
      <Link href={`/blogs/${slug}`}>
        <article className="group bg-card cursor-pointer overflow-hidden rounded-2xl transition-all hover:shadow-lg">
          <div className="relative aspect-video overflow-hidden">
            <Image
              src={imgSrc}
              alt={title}
              fill
              sizes="100vw"
              className="object-cover"
            />
          </div>
          <div className="p-6">
            <h2 className="group-hover:text-muted-foreground mb-4 text-lg leading-tight font-semibold transition-colors md:text-lg line-clamp-1">
              {title}
            </h2>
            <div className="text-muted-foreground flex items-center gap-3 text-sm">
              <Badge variant="secondary" className="font-normal">
                {category}
              </Badge>
              <span>{date}</span>
            </div>
          </div>
        </article>
      </Link>
    );
  }

  // Default grid card
  return (
    <Link href={`/blogs/${slug}`}>
      <article
        className={cn(
          "group bg-card cursor-pointer overflow-hidden rounded-2xl transition-all hover:shadow-lg",
          featured && "md:col-span-2 md:row-span-2",
        )}
      >
        <div className="relative aspect-video overflow-hidden">
          <Image
            src={imgSrc}
            alt={title}
            fill
            sizes="(min-width:1024px) 50vw, 100vw"
            className="object-cover"
          />
        </div>
        <div className="p-6">
          <h2
            className={cn(
              "group-hover:text-muted-foreground mb-3 leading-tight font-semibold transition-colors line-clamp-1",
              featured ? "text-2xl md:text-lg" : "text-lg",
            )}
          >
            {title}
          </h2>
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <Badge variant="secondary" className="font-normal">
              {category}
            </Badge>
            <span>{date}</span>
          </div>
        </div>
      </article>
    </Link>
  );
};