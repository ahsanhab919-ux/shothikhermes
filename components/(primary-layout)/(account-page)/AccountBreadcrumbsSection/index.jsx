import {
  BreadcrumbItem,
  BreadcrumbList,
  Breadcrumb as BreadcrumbRoot,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { cn } from "@/lib/utils";

export default function AccountBreadcrumbsSection({
  links,
  heading,
  activeLast,
}) {
  return (
    <div className="flex flex-row items-center">
      <div className="flex-grow">
        <h5 className="mb-2 text-xl font-semibold">{heading}</h5>

        {/* BREADCRUMBS */}
        <BreadcrumbRoot>
          <BreadcrumbList>
            {links.map((link, idx) => (
              <>
                <BreadcrumbItem
                  key={idx}
                  className={cn(
                    "inline-flex items-center text-sm capitalize",
                    activeLast === link.name &&
                      "text-muted-foreground pointer-events-none cursor-default",
                  )}
                >
                  {link.name}
                </BreadcrumbItem>
                {idx < links.length - 1 && (
                  <BreadcrumbSeparator key={`sep-${idx}`}>
                    <Separator />
                  </BreadcrumbSeparator>
                )}
              </>
            ))}
          </BreadcrumbList>
        </BreadcrumbRoot>
      </div>
    </div>
  );
}

export function Separator() {
  return (
    <span className="bg-muted-foreground inline-block h-1 w-1 rounded-full" />
  );
}
