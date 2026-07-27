"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import DiscordIcon from "@/components/icons/DiscordIcon";
import { PATH_ACCOUNT } from "@/config/route";
import { toast } from "react-toastify";
import {
  logout,
  setShowLoginModal,
  setShowRegisterModal,
} from "@/redux/slices/auth";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

import { HelpCircle, LogIn, Mail, User } from "lucide-react";

export default function AccountPopover() {
  const { accessToken, user } = useSelector((state) => state.auth);

  const [open, setOpen] = useState(false);

  const dispatch = useDispatch();
  const { push } = useRouter();

  const handleLogout = async () => {
    try {
      dispatch(logout());
      localStorage.setItem("logout-event", Date.now().toString());
      setOpen(false);
      toast.success("Logout successful!");
      push("/");
    } catch (error) {
      console.error(error);
      toast.error("Unable to logout!");
    }
  };

  const handleClickItem = (path) => {
    setOpen(false);
    push(path);
  };

  useEffect(() => {
    const syncLogout = (event) => {
      if (event.key === "logout-event") {
        dispatch(logout());
        push("/");
      }
    };

    window.addEventListener("storage", syncLogout);
    return () => window.removeEventListener("storage", syncLogout);
  }, [dispatch, push]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className="size-8 md:size-9" asChild>
        <button
          onClick={() => setOpen((s) => !s)}
          className={cn(
            "flex cursor-pointer items-center rounded-full",
            "focus-visible:ring-ring focus:outline-none focus-visible:ring-2",
          )}
          aria-label="Account"
        >
          {user && user?.image ? (
            <Avatar className="size-8 md:size-9">
              <AvatarImage src={user.image} alt={user.name || "User"} />
              <AvatarFallback>{user?.name?.[0] ?? "U"}</AvatarFallback>
            </Avatar>
          ) : user && accessToken ? (
            <div
              className={cn(
                "flex size-8 items-center justify-center rounded-full text-sm font-semibold md:size-9",
                "bg-primary text-primary-foreground",
              )}
            >
              {user?.name
                ? `${String(user?.name ?? "").split(" ")[0][0] || ""}${user.name?.split(" ")[1]?.[0] || ""}`
                : ""}
            </div>
          ) : (
            <div className="flex size-8 items-center justify-center md:size-9">
              <User className="text-muted-foreground h-6 w-6" />
            </div>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent side="bottom" align="end" className="my-2 w-56 p-0">
        <div className="flex flex-col divide-y">
          {user?.email && (
            <button
              onClick={() => handleClickItem(PATH_ACCOUNT.settings.root)}
              className={cn(
                "hover:bg-primary/10 w-full px-4 py-3 text-left",
                "flex items-center gap-3",
              )}
            >
              <User className="h-5 w-5" />
              <div className="flex-1">
                <div className="text-sm font-medium">My Profile</div>
                <div className="text-muted-foreground truncate text-xs">
                  {user?.email
                    ? user.email.length > 15
                      ? `${user.email.slice(0, 15)}...`
                      : user.email
                    : ""}
                </div>
              </div>
            </button>
          )}

          {!user?.email && (
            <button
              // data-umami-event="Nav: Login / Sign up"
              data-rybbit-event="Nav: Login / Sign up"
              onClick={() => {
                setOpen(false);
                dispatch(setShowRegisterModal(false));
                dispatch(setShowLoginModal(true));
              }}
              className="hover:bg-primary/10 flex w-full items-center gap-3 px-3 py-2 text-sm"
            >
              <LogIn className="h-5 w-5" />
              <span>Login / Sign up</span>
            </button>
          )}

          <div className="flex flex-col">
            <Link href="mailto:support@shothik.ai" className="no-underline">
              <div className="hover:bg-primary/10 flex w-full items-center gap-3 px-3 py-2 text-sm">
                <HelpCircle className="h-5 w-5" />
                <span>Help Center</span>
              </div>
            </Link>
            <Link
              href="/contact-us"
              data-rybbit-event="Contact us"
              className="no-underline"
            >
              <div className="hover:bg-primary/10 flex w-full items-center gap-3 px-3 py-2 text-sm">
                <Mail className="h-5 w-5" />
                <span>Contact us</span>
              </div>
            </Link>

            <Link
              href="https://discord.gg/pq2wTqXEpj"
              target="_blank"
              rel="noreferrer"
              className="no-underline"
            >
              <div className="hover:bg-primary/10 flex w-full items-center gap-3 px-3 py-2 text-sm">
                <span className="inline-flex h-5 w-5 items-center justify-center">
                  <DiscordIcon />
                </span>
                <span>Join Us on Discord</span>
              </div>
            </Link>
          </div>

          {user?.email && (
            <button
              onClick={handleLogout}
              className="hover:bg-primary/10 flex w-full items-center gap-3 px-3 py-3 text-sm"
            >
              <LogIn className="h-5 w-5" />
              <span>Log out</span>
            </button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
