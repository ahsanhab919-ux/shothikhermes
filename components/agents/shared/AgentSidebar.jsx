import { cn } from "@/lib/utils";
import { Bot } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const AgentSidebar = () => {
  const pathname = usePathname();
  const isActive = pathname === "/agents";

  return (
    <nav aria-label="Agent navigation">
      <Link
        href="/agents"
        className={cn(
          "relative mb-0.5 flex w-full flex-row items-center justify-start rounded-md px-4 py-2 transition-colors",
          isActive
            ? "text-primary bg-primary/10 hover:bg-primary/10 hover:text-primary"
            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
        )}
      >
        <div className="mr-4 flex h-8 w-8 shrink-0 items-center justify-center">
          <Bot
            className={cn(
              "h-5 w-5",
              isActive ? "text-primary" : "text-muted-foreground",
            )}
          />
        </div>
        <span className="flex-grow text-start text-base whitespace-nowrap">
          Agents
        </span>
      </Link>
    </nav>
  );
};

export default AgentSidebar;
